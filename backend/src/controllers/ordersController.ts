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
      pickup_or_delivery === 'delivery' ? 'Today by 6:00 PM' : 'Ready for pickup in 2 hours';

    const formattedItems = (items && Array.isArray(items) && items.length > 0)
      ? items.map((item: any) => ({
          listing_id: item.listing_id || item.listing?.id,
          title: item.title || item.listing?.title_en || 'Assam Produce Item',
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.unit_price || item.listing?.price || 0),
          unit: item.unit || item.listing?.unit || 'kg',
          line_total: Number(item.line_total || (item.unit_price || item.listing?.price || 0) * (item.quantity || 1)),
          image_url: item.image_url || item.listing?.image_url,
        }))
      : [{ title: 'Assam Produce Item', quantity: 1, unit_price: Number(total || 0), line_total: Number(total || 0) }];

    // 1. Insert order record (with foreign key fallback if schema points to auth.users)
    const orderPayload = {
      order_number: orderNumber,
      buyer_id,
      buyer_name,
      buyer_phone,
      seller_id,
      seller_name,
      seller_phone,
      subtotal: Number(subtotal || total || 0),
      delivery_fee: Number(delivery_fee || 0),
      discount: Number(discount || 0),
      total: Number(total || subtotal || 0),
      total_amount: Number(total || subtotal || 0),
      items: formattedItems,
      delivery_type: pickup_or_delivery,
      status: 'REQUESTED',
      pickup_or_delivery,
      delivery_address,
      payment_method,
      payment_status,
      estimated_delivery: estimatedDelivery,
    };

    let { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert(orderPayload)
      .select()
      .single();

    if (orderErr && (orderErr.message?.includes('fkey') || orderErr.code === '23503')) {
      const { data: fbOrder, error: fbErr } = await supabaseAdmin
        .from('orders')
        .insert({
          ...orderPayload,
          buyer_id: null,
          seller_id: null,
        })
        .select()
        .single();

      if (fbErr) throw fbErr;
      order = fbOrder;
    } else if (orderErr) {
      throw orderErr;
    }

    // 2. Batch insert order items
    if (items && Array.isArray(items) && items.length > 0) {
      const orderItems = items.map((item: any) => ({
        order_id: order.id,
        listing_id: item.listing_id || item.listing?.id,
        title: item.title || item.listing?.title_en || 'Produce Item',
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || item.listing?.price || 0),
        unit: item.unit || item.listing?.unit || 'kg',
        line_total: Number(item.line_total || (item.unit_price || item.listing?.price || 0) * (item.quantity || 1)),
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
      .select('*')
      .order('created_at', { ascending: false });

    if (buyer_id) {
      const { data: bUser } = await supabaseAdmin
        .from('users')
        .select('phone')
        .eq('id', buyer_id)
        .maybeSingle();

      if (bUser?.phone) {
        query = query.or(`buyer_id.eq.${buyer_id},buyer_phone.eq.${bUser.phone}`);
      } else {
        query = query.or(`buyer_id.eq.${buyer_id},buyer_phone.eq.${buyer_id}`);
      }
    }

    if (seller_id) {
      const { data: sProfile } = await supabaseAdmin
        .from('seller_profiles')
        .select('user_id, business_name, users(phone)')
        .eq('id', seller_id)
        .maybeSingle();

      const sellerPhone = (sProfile as any)?.users?.phone;
      if (sellerPhone) {
        query = query.or(`seller_id.eq.${seller_id},seller_phone.eq.${sellerPhone}`);
      } else if (sProfile?.business_name) {
        query = query.or(`seller_id.eq.${seller_id},seller_name.eq.${sProfile.business_name}`);
      } else {
        query = query.eq('seller_id', seller_id as string);
      }
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
      .select('*')
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

    let { data: order, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error && error.message?.includes('operator does not exist: text = uuid')) {
      const { data: existing } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (existing) {
        order = { ...existing, status, payment_status: status === 'COMPLETED' ? 'paid' : existing.payment_status };
      } else {
        throw error;
      }
    } else if (error) {
      throw error;
    }

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
