import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { sendPushNotification } from '../services/notificationService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function createOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      buyer_id,
      buyer_name,
      buyer_phone,
      seller_id,
      seller_name,
      seller_phone,
      items,
      subtotal,
      delivery_fee = 0,
      discount = 0,
      total,
      pickup_or_delivery = 'delivery',
      delivery_address,
      payment_method = 'cod',
      payment_status = 'pending',
    } = req.body;

    const orderNumber = `TB-${Date.now().toString().slice(-6)}`;
    const estimatedDelivery =
      pickup_or_delivery === 'delivery' ? 'Today by 6:00 PM' : 'Ready at Haat in 2 hours';

    // 1. Insert order record
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        buyer_id,
        buyer_name,
        buyer_phone,
        seller_id,
        seller_name,
        seller_phone,
        subtotal,
        delivery_fee,
        discount,
        total,
        status: 'REQUESTED',
        pickup_or_delivery,
        delivery_address,
        payment_method,
        payment_status,
        estimated_delivery: estimatedDelivery,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;

    // 2. Batch insert order items
    if (items && Array.isArray(items) && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        listing_id: item.listing_id || item.listing?.id,
        title: item.title || item.listing?.title_en,
        quantity: item.quantity,
        unit_price: item.unit_price || item.listing?.price,
        unit: item.unit || item.listing?.unit || 'kg',
        line_total: (item.unit_price || item.listing?.price) * item.quantity,
        image_url: item.image_url || item.listing?.image_url,
      }));

      const { error: itemsErr } = await supabaseAdmin
        .from('order_items')
        .insert(orderItems);

      if (itemsErr) console.error('[OrdersController] Error inserting order items:', itemsErr);
    }

    // 3. Create In-App Notification for seller & dispatch push if token exists
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: seller_id,
        title_en: 'New Order Received!',
        title_as: 'নতুন অৰ্ডাৰ লাভ কৰা হৈছে!',
        body_en: `Order #${orderNumber} for ₹${total} received from ${buyer_name}.`,
        body_as: `${buyer_name} ৰ পৰা ₹${total} টকাৰ অৰ্ডাৰ #${orderNumber} লাভ হৈছে।`,
        type: 'order_update',
        data: { orderId: order.id, orderNumber },
      });

      // Find seller's push token
      const { data: sellerUser } = await supabaseAdmin
        .from('users')
        .select('expo_push_token')
        .or(`id.eq.${seller_id},phone.eq.${seller_phone}`)
        .maybeSingle();

      if (sellerUser?.expo_push_token) {
        await sendPushNotification({
          to: sellerUser.expo_push_token,
          title: `🛍️ New Order #${orderNumber}!`,
          body: `₹${total} order received from ${buyer_name}. Tap to accept.`,
          data: { orderId: order.id, orderNumber },
        });
      }
    } catch (notifErr) {
      console.warn('[OrdersController] Notification dispatch failed:', notifErr);
    }

    res.status(201).json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getOrders(req: Request, res: Response): Promise<void> {
  try {
    const { buyer_id, seller_id, status } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (buyer_id) {
      query = query.eq('buyer_id', buyer_id as string);
    }
    if (seller_id) {
      query = query.eq('seller_id', seller_id as string);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status as string);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, count: data?.length || 0, orders: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getOrderById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .or(`id.eq.${id},order_number.eq.${id}`)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ success: false, error: 'Order not found' });
      return;
    }

    res.json({ success: true, order: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['REQUESTED', 'ACCEPTED', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid order status' });
      return;
    }

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*, order_items(*)')
      .single();

    if (error) throw error;

    // Send Buyer In-App Notification & Push Notification
    try {
      const statusMessages: Record<string, { en: string; as: string }> = {
        ACCEPTED: { en: 'Your order has been accepted by the seller.', as: 'বিক্ৰেতাই আপোনাৰ অৰ্ডাৰ গ্ৰহণ কৰিছে।' },
        READY_FOR_PICKUP: { en: 'Your fresh items are packed and ready!', as: 'আপোনাৰ সামগ্ৰী সাজু হৈছে!' },
        OUT_FOR_DELIVERY: { en: 'Your order is on the way to you!', as: 'আপোনাৰ অৰ্ডাৰ আহি আছে!' },
        COMPLETED: { en: 'Order delivered successfully. Enjoy!', as: 'অৰ্ডাৰ সম্পূৰ্ণ হ’ল। ধন্যবাদ!' },
        CANCELLED: { en: 'Order has been cancelled.', as: 'অৰ্ডাৰ বাতিল কৰা হৈছে।' },
      };

      const msg = statusMessages[status] || { en: `Order status updated to ${status}`, as: `অৰ্ডাৰ অৱস্থা: ${status}` };

      await supabaseAdmin.from('notifications').insert({
        user_id: order.buyer_id,
        title_en: `Order #${order.order_number} Update`,
        title_as: `অৰ্ডাৰ #${order.order_number} আপডেট`,
        body_en: msg.en,
        body_as: msg.as,
        type: 'order_update',
        data: { orderId: order.id, status },
      });

      const { data: buyerUser } = await supabaseAdmin
        .from('users')
        .select('expo_push_token')
        .or(`id.eq.${order.buyer_id},phone.eq.${order.buyer_phone}`)
        .maybeSingle();

      if (buyerUser?.expo_push_token) {
        await sendPushNotification({
          to: buyerUser.expo_push_token,
          title: `📦 Order #${order.order_number} Update`,
          body: msg.en,
          data: { orderId: order.id, status },
        });
      }
    } catch (notifErr) {
      console.warn('[OrdersController] Status notification dispatch failed:', notifErr);
    }

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
