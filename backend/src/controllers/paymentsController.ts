import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { razorpayService } from '../services/razorpayService.js';
import { sendPushNotification } from '../services/notificationService.js';
import { recordAuditLog } from '../services/auditService.js';

/**
 * POST /api/v1/payments/create-order
 * Creates a Razorpay Order and initializes a payment transaction in database
 */
export async function createPaymentOrder(req: Request, res: Response): Promise<void> {
  try {
    const { order_id, order_number, amount, buyer_id, seller_id, items_summary } = req.body;

    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, error: 'Invalid order amount' });
      return;
    }

    const receipt = order_number || `rcpt_${Date.now()}`;
    const rzpOrder = await razorpayService.createOrder({
      amount: Number(amount),
      receipt,
      notes: {
        order_id: order_id || '',
        order_number: order_number || '',
        buyer_id: buyer_id || '',
        seller_id: seller_id || '',
        items: items_summary || 'Local Assam Produce',
      },
    });

    // Record transaction attempt in payment_transactions table
    try {
      await supabaseAdmin.from('payment_transactions').insert([
        {
          order_id: order_id || null,
          order_number: receipt,
          buyer_id: buyer_id || 'guest',
          seller_id: seller_id || 'unknown',
          amount: Number(amount),
          currency: 'INR',
          payment_method: 'razorpay',
          payment_status: 'initiated',
          razorpay_order_id: rzpOrder.id,
          raw_response: rzpOrder,
        },
      ]);
    } catch (dbErr) {
      console.warn('[Payments] DB transaction logging fallback:', dbErr);
    }

    res.json({
      success: true,
      key_id: razorpayService.getKeyId() || process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      razorpay_order_id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      receipt: rzpOrder.receipt,
      isMock: rzpOrder.isMock,
    });
  } catch (error: any) {
    console.error('[PaymentsController.createPaymentOrder] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment order',
    });
  }
}

/**
 * POST /api/v1/payments/verify
 * Cryptographically verifies HMAC-SHA256 signature and updates order status to 'paid'
 */
export async function verifyPayment(req: Request, res: Response): Promise<void> {
  try {
    const {
      order_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      res.status(400).json({
        success: false,
        error: 'Missing required Razorpay payment parameters',
      });
      return;
    }

    const isValid = razorpayService.verifySignature({
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature || '',
    });

    if (!isValid) {
      // Mark transaction failed
      await supabaseAdmin
        .from('payment_transactions')
        .update({
          payment_status: 'failed',
          error_code: 'BAD_SIGNATURE',
          error_description: 'HMAC signature verification failed',
        })
        .eq('razorpay_order_id', razorpay_order_id);

      res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Verification failed.',
      });
      return;
    }

    // 1. Update payment_transactions record
    await supabaseAdmin
      .from('payment_transactions')
      .update({
        payment_status: 'success',
        razorpay_payment_id,
        razorpay_signature,
      })
      .eq('razorpay_order_id', razorpay_order_id);

    // 2. Update order status in orders table if order_id is present
    if (order_id) {
      const { data: updatedOrder, error: ordErr } = await supabaseAdmin
        .from('orders')
        .update({
          payment_status: 'paid',
          razorpay_order_id,
          razorpay_payment_id,
        })
        .eq('id', order_id)
        .select()
        .single();

      if (!ordErr && updatedOrder) {
        // Send Push Notification to Seller if push token exists
        if (updatedOrder.seller_id) {
          try {
            const { data: sellerUser } = await supabaseAdmin
              .from('users')
              .select('expo_push_token')
              .eq('id', updatedOrder.seller_id)
              .single();

            if (sellerUser?.expo_push_token) {
              await sendPushNotification({
                to: sellerUser.expo_push_token,
                title: '💰 New Paid Order Received!',
                body: `Order #${updatedOrder.order_number} has been paid via Razorpay. Confirm to prepare dispatch.`,
                data: { orderId: updatedOrder.id, action: 'order_paid' },
              });
            }
          } catch (notifErr) {
            console.warn('[Payments] Push notification to seller skipped:', notifErr);
          }
        }

        // Send confirmation to Buyer
        if (updatedOrder.buyer_id) {
          try {
            const { data: buyerUser } = await supabaseAdmin
              .from('users')
              .select('expo_push_token')
              .eq('id', updatedOrder.buyer_id)
              .single();

            if (buyerUser?.expo_push_token) {
              await sendPushNotification({
                to: buyerUser.expo_push_token,
                title: '✅ Payment Confirmed',
                body: `Your payment of ₹${updatedOrder.total} for Order #${updatedOrder.order_number} was successful!`,
                data: { orderId: updatedOrder.id, action: 'payment_success' },
              });
            }
          } catch (notifErr) {
            console.warn('[Payments] Push notification to buyer skipped:', notifErr);
          }
        }
      }
    }

    // Log to Audit Trail
    await recordAuditLog({
      action: 'PAYMENT_VERIFIED',
      actor_id: 'SYSTEM',
      actor_name: 'Razorpay Gateway',
      actor_role: 'system',
      entity: 'orders',
      entity_id: order_id || razorpay_order_id,
      details: `Payment of verified successfully for ${order_id || razorpay_order_id}`,
      metadata: {
        event: 'PAYMENT_VERIFIED',
        razorpay_payment_id,
        razorpay_order_id,
      },
    });

    res.json({
      success: true,
      message: 'Payment verified and captured successfully',
      razorpay_payment_id,
    });
  } catch (error: any) {
    console.error('[PaymentsController.verifyPayment] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment verification failed',
    });
  }
}

/**
 * POST /api/v1/payments/webhook
 * Webhook handler for asynchronous Razorpay events (captured, failed, refunded)
 */
export async function handleWebhook(req: Request, res: Response): Promise<void> {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      res.status(400).send('Invalid webhook signature');
      return;
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured') {
      const payment = payload.payment.entity;
      const orderId = payment.order_id;
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'paid', razorpay_payment_id: payment.id })
        .eq('razorpay_order_id', orderId);
    } else if (event === 'payment.failed') {
      const payment = payload.payment.entity;
      const orderId = payment.order_id;
      await supabaseAdmin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('razorpay_order_id', orderId);
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[PaymentsController.handleWebhook] Error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
