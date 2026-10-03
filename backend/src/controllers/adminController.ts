import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { sendPushNotification } from '../services/notificationService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

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
      .select('*, order_items(*)')
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
