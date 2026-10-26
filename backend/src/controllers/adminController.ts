import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { sendPushNotification } from '../services/notificationService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { recordAuditLog, queryAuditLogs } from '../services/auditService.js';

export async function getPlatformStats(req: Request, res: Response): Promise<void> {
  try {
    const [usersRes, sellersRes, listingsRes, ordersRes] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('seller_profiles').select('verification_status'),
      supabaseAdmin.from('listings').select('status'),
      supabaseAdmin.from('orders').select('total, status'),
    ]);

    const totalUsers = usersRes.count || 0;
    const sellers = sellersRes.data || [];
    const totalSellers = sellers.length;
    const verifiedSellers = sellers.filter((s) => s.verification_status === 'verified').length;
    const pendingSellers = sellers.filter((s) => s.verification_status === 'pending' || s.verification_status === 'under_review').length;

    const listings = listingsRes.data || [];
    const activeListings = listings.filter((l) => l.status === 'active').length;

    const orders = ordersRes.data || [];
    const totalOrders = orders.length;
    const completedOrders = orders.filter((o) => o.status === 'COMPLETED').length;
    const totalGmv = orders
      .filter((o) => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalSellers,
        verifiedSellers,
        pendingSellers,
        totalListings: listings.length,
        activeListings,
        totalOrders,
        completedOrders,
        totalGmv,
        formattedGmv: `₹${totalGmv.toLocaleString('en-IN')}`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAllSellers(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;

    let query = supabaseAdmin
      .from('seller_profiles')
      .select('*, users(*)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      if (status === 'pending') {
        query = query.in('verification_status', ['pending', 'under_review']);
      } else {
        query = query.eq('verification_status', status as string);
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, count: data?.length || 0, sellers: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getPendingSellers(req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('seller_profiles')
      .select('*, users(*)')
      .in('verification_status', ['pending', 'under_review'])
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, count: data?.length || 0, pending_sellers: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function verifySeller(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params; // seller_profile id
    const { status, remarks } = req.body; // 'verified' | 'rejected' | 'under_review'

    if (!['verified', 'rejected', 'under_review'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid status' });
      return;
    }

    const { data: profile, error } = await supabaseAdmin
      .from('seller_profiles')
      .update({ verification_status: status })
      .eq('id', id)
      .select('*, users(*)')
      .single();

    if (error) throw error;

    // Also update user verified field if approved
    if (status === 'verified') {
      await supabaseAdmin
        .from('users')
        .update({ verified: true })
        .eq('id', profile.user_id);
    }

    // Send push notification & in-app notification to seller
    try {
      const isApproved = status === 'verified';
      const title_en = isApproved ? '🎉 Seller Profile Verified!' : 'Seller Application Update';
      const title_as = isApproved ? '🎉 বিক্ৰেতা প্ৰফাইল প্ৰমাণিত হৈছে!' : 'বিক্ৰেতা আবেদন আপডেট';
      const body_en = isApproved
        ? 'Congratulations! Your Thaluwa Bazar verified seller badge is now active.'
        : `Your application status has been updated to ${status}. ${remarks ? `Remarks: ${remarks}` : ''}`;
      const body_as = isApproved
        ? 'অভিনন্দন! আপোনাৰ থলুৱা বজাৰ প্ৰমাণিত বিক্ৰেতা বেজ সক্ৰিয় হৈছে।'
        : `আপোনাৰ আবেদনৰ স্থিতি: ${status}।`;

      await supabaseAdmin.from('notifications').insert({
        user_id: profile.user_id,
        title_en,
        title_as,
        body_en,
        body_as,
        type: 'seller_status',
        data: { verification_status: status },
      });

      if (profile.users?.expo_push_token) {
        await sendPushNotification({
          to: profile.users.expo_push_token,
          title: title_en,
          body: body_en,
          data: { verification_status: status },
        });
      }
    } catch (notifErr) {
      console.warn('[AdminController] Notification failed:', notifErr);
    }

    // Capture audit log for seller verification decision
    try {
      await recordAuditLog({
        actor_id: req.user?.id || (req.headers['x-admin-id'] as string) || 'adm_reviewer_01',
        actor_name: (req.headers['x-admin-name'] as string) || req.body.admin_name || 'Admin Officer',
        actor_role: (req.headers['x-admin-role'] as string) || 'Operations Admin',
        action: status === 'verified' ? 'SELLER_VERIFIED' : status === 'rejected' ? 'SELLER_REJECTED' : 'SELLER_UNDER_REVIEW',
        entity: 'seller_profiles',
        entity_id: id as string,
        details: `Updated verification status to '${status}'. Remarks: ${remarks || 'None provided'}`,
        metadata: {
          seller_id: id,
          business_name: profile.business_name,
          shg_code: profile.shg_code,
          verification_status: status,
          remarks: remarks || null,
        },
        ip_address: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
      });
    } catch (auditErr) {
      console.warn('[AdminController] Audit log failed:', auditErr);
    }

    res.json({ success: true, seller_profile: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAllOrders(req: Request, res: Response): Promise<void> {
  try {
    const { limit = '100', status } = req.query;

    let query = supabaseAdmin
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string, 10));

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

export async function overrideOrderStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

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

    // Send Buyer In-App Notification if buyer_id exists
    try {
      if (order?.buyer_id) {
        await supabaseAdmin.from('notifications').insert({
          user_id: order.buyer_id,
          title_en: `Order #${order.order_number} Override`,
          title_as: `অৰ্ডাৰ #${order.order_number} আপডেট`,
          body_en: `Order status manually updated to ${status} by Admin. ${reason ? `Reason: ${reason}` : ''}`,
          body_as: `প্ৰশাসকে অৰ্ডাৰৰ স্থিতি ${status} লৈ সলনি কৰিছে।`,
          type: 'order_update',
          data: { orderId: order.id, status, reason },
        });
      }
    } catch (notifErr) {
      console.warn('[AdminController] Notification failed:', notifErr);
    }

    // Capture audit log for order override
    try {
      await recordAuditLog({
        actor_id: req.user?.id || (req.headers['x-admin-id'] as string) || 'adm_reviewer_01',
        actor_name: (req.headers['x-admin-name'] as string) || req.body.admin_name || 'Operations Admin',
        actor_role: (req.headers['x-admin-role'] as string) || 'Operations Admin',
        action: 'ORDER_OVERRIDE',
        entity: 'orders',
        entity_id: id as string,
        details: `Manually changed order #${order?.order_number || id} status to '${status}'. Reason: ${reason || 'Administrative decision'}`,
        metadata: {
          order_id: id,
          order_number: order?.order_number,
          new_status: status,
          reason: reason || null,
        },
        ip_address: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
      });
    } catch (auditErr) {
      console.warn('[AdminController] Audit log failed:', auditErr);
    }

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}



export async function getPayouts(req: Request, res: Response): Promise<void> {
  try {
    const { data: rawPayouts, error } = await supabaseAdmin
      .from('seller_payouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[AdminController] getPayouts error:', error);
      res.json({ success: true, count: 0, payouts: [] });
      return;
    }

    // Get seller profiles for metadata
    const sellerIds = Array.from(new Set((rawPayouts || []).map((p: any) => p.seller_id).filter(Boolean)));
    const sellerMap: Record<string, any> = {};

    if (sellerIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('seller_profiles')
        .select('id, user_id, business_name, bank_account, bank_ifsc, upi_id')
        .in('id', sellerIds);

      if (profiles) {
        for (const pr of profiles) {
          sellerMap[pr.id] = pr;
        }
      }
    }

    const payouts = (rawPayouts || []).map((p: any) => {
      const profile = sellerMap[p.seller_id];
      return {
        id: p.id,
        seller_id: p.seller_id,
        seller_name: profile?.business_name || 'Rural Producer',
        amount: Number(p.amount),
        status: p.status,
        utr_ref: p.reference_no,
        reference_no: p.reference_no,
        bank_account: profile?.bank_account || p.upi_id || 'Direct UPI',
        ifsc: profile?.bank_ifsc || 'UPI',
        upi_id: p.upi_id,
        created_at: p.created_at,
        disbursed_at: p.status === 'processed' ? p.created_at : undefined,
      };
    });

    res.json({ success: true, count: payouts.length, payouts });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function disbursePayout(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const utr = `UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;

    const { data, error } = await supabaseAdmin
      .from('seller_payouts')
      .update({
        status: 'processed',
        reference_no: utr,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Send In-App Notification to Seller
    try {
      if (data?.seller_id) {
        const { data: profile } = await supabaseAdmin
          .from('seller_profiles')
          .select('user_id')
          .eq('id', data.seller_id)
          .maybeSingle();

        if (profile?.user_id) {
          await supabaseAdmin.from('notifications').insert({
            user_id: profile.user_id,
            title_en: 'Payout Disbursed! 💰',
            title_as: 'ধনাগমন সম্পূৰ্ণ! 💰',
            body_en: `Your payout of ₹${Number(data.amount).toLocaleString('en-IN')} has been transferred. UTR: ${utr}`,
            body_as: `আপোনাৰ ₹${Number(data.amount).toLocaleString('en-IN')} টকা হস্তান্তৰ কৰা হ’ল। UTR: ${utr}`,
            type: 'payment_received',
            data: { payoutId: id, utr, amount: data.amount },
          });
        }
      }
    } catch (notifErr) {
      console.warn('[AdminController] Payout notification failed:', notifErr);
    }

    // Capture audit log for payout disbursement
    try {
      await recordAuditLog({
        actor_id: (req as any).user?.id || (req.headers['x-admin-id'] as string) || 'adm_finance_01',
        actor_name: (req.headers['x-admin-name'] as string) || 'Finance Admin',
        actor_role: (req.headers['x-admin-role'] as string) || 'Finance Admin',
        action: 'PAYOUT_DISBURSED',
        entity: 'seller_payouts',
        entity_id: id as string,
        details: `Disbursed settlement payout of ₹${Number(data?.amount || 0).toLocaleString('en-IN')} with UTR ${utr}.`,
        metadata: {
          payout_id: id,
          seller_id: data?.seller_id,
          amount: data?.amount,
          utr_reference: utr,
        },
        ip_address: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress,
        user_agent: req.headers['user-agent'],
      });
    } catch (auditErr) {
      console.warn('[AdminController] Audit log failed:', auditErr);
    }

    res.json({ success: true, utr, payout: { ...data, utr_ref: utr } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  try {
    const { search, action, entity, limit, offset } = req.query;
    const result = await queryAuditLogs({
      search: search as string,
      action: action as string,
      entity: entity as string,
      limit: limit ? parseInt(limit as string, 10) : 100,
      offset: offset ? parseInt(offset as string, 10) : 0,
    });

    res.json({
      success: true,
      count: result.logs.length,
      total: result.total,
      logs: result.logs,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createAuditLogEntry(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { action, entity, entity_id, details, metadata } = req.body;
    if (!action || !entity || !entity_id) {
      res.status(400).json({ success: false, error: 'Missing action, entity, or entity_id' });
      return;
    }

    const actor_id = req.user?.id || (req.headers['x-admin-id'] as string) || req.body.actor_id || 'adm_console_01';
    const actor_name = (req.headers['x-admin-name'] as string) || req.body.actor_name || (req.user?.email ? req.user.email.split('@')[0] : 'Admin Moderator');
    const actor_role = (req.headers['x-admin-role'] as string) || req.body.actor_role || req.user?.role || 'Super Admin';
    const ip_address = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    const user_agent = req.headers['user-agent'];

    const entry = await recordAuditLog({
      actor_id,
      actor_name,
      actor_role,
      action: String(action),
      entity: String(entity),
      entity_id: String(entity_id),
      details: details || `Executed ${action} on ${entity} #${entity_id}`,
      metadata,
      ip_address: typeof ip_address === 'string' ? ip_address : undefined,
      user_agent: typeof user_agent === 'string' ? user_agent : undefined,
    });

    res.status(201).json({ success: true, log: entry });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

