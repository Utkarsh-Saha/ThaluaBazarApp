import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function registerSeller(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const {
      user_id,
      business_name,
      seller_type = 'shg_member',
      shg_code,
      village,
      district,
      upi_id,
      bank_account,
      bank_ifsc,
      delivery_radius_km = 15,
      id_proof_url,
      address_proof_url,
      shg_cert_url,
      bank_proof_url,
    } = req.body;

    let targetUserId = user_id;
    if ((!targetUserId || targetUserId.startsWith('usr-') || targetUserId.startsWith('u-')) && req.body.phone) {
      const formattedPhone = req.body.phone.startsWith('+') ? req.body.phone : `+91${req.body.phone.replace(/\D/g, '')}`;
      const { data: u } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('phone', formattedPhone)
        .maybeSingle();
      if (u) targetUserId = u.id;
    }

    if (!targetUserId || !business_name || !village || !district || !upi_id) {
      res.status(400).json({ success: false, error: 'Missing required seller fields or valid user' });
      return;
    }

    // 1. Insert or update seller profile
    const { data: existingProfile } = await supabaseAdmin
      .from('seller_profiles')
      .select('id')
      .eq('user_id', targetUserId)
      .maybeSingle();

    let profile;
    if (existingProfile) {
      const { data, error } = await supabaseAdmin
        .from('seller_profiles')
        .update({
          business_name,
          seller_type,
          shg_code,
          village,
          district,
          upi_id,
          bank_account,
          bank_ifsc,
          delivery_radius_km,
          id_proof_url,
          address_proof_url,
          shg_cert_url,
          bank_proof_url,
          verification_status: 'pending',
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (error) throw error;
      profile = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('seller_profiles')
        .insert({
          user_id: targetUserId,
          business_name,
          seller_type,
          shg_code,
          village,
          district,
          upi_id,
          bank_account,
          bank_ifsc,
          delivery_radius_km,
          id_proof_url,
          address_proof_url,
          shg_cert_url,
          bank_proof_url,
          verification_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      profile = data;
    }

    // 2. Update user's role to 'seller'
    await supabaseAdmin
      .from('users')
      .update({ role: 'seller' })
      .eq('id', targetUserId);

    // 3. Create Notification for user
    await supabaseAdmin.from('notifications').insert({
      user_id: targetUserId,
      title_en: 'Seller Application Submitted!',
      title_as: 'বিক্ৰেতা আবেদন দাখিল কৰা হৈছে!',
      body_en: 'Your application is under review. You can now start adding draft listings.',
      body_as: 'আপোনাৰ আবেদন পৰ্যালোচনা কৰা হৈছে। এতিয়া আপুনি সামগ্ৰী যোগ কৰিব পাৰে।',
      type: 'seller_status',
    });

    res.status(201).json({ success: true, seller_profile: profile });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getSellerProfile(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('seller_profiles')
      .select('*, users(*)')
      .or(`id.eq.${id},user_id.eq.${id}`)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ success: false, error: 'Seller profile not found' });
      return;
    }

    res.json({ success: true, seller: data, seller_profile: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function toggleOnlineStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const { data: current, error: getErr } = await supabaseAdmin
      .from('seller_profiles')
      .select('is_online')
      .or(`id.eq.${id},user_id.eq.${id}`)
      .single();

    if (getErr) throw getErr;

    const newStatus = !current.is_online;
    const { data, error } = await supabaseAdmin
      .from('seller_profiles')
      .update({ is_online: newStatus })
      .or(`id.eq.${id},user_id.eq.${id}`)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, is_online: newStatus, seller: data, seller_profile: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getSellerAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Fetch seller profile
    const { data: profile } = await supabaseAdmin
      .from('seller_profiles')
      .select('*')
      .or(`id.eq.${id},user_id.eq.${id}`)
      .maybeSingle();

    // Fetch total orders and revenue
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('total, total_amount, status, created_at')
      .eq('seller_id', id);

    const completedOrders = (orders || []).filter((o) => o.status === 'COMPLETED');
    const totalGmv = completedOrders.reduce((sum, o) => sum + Number(o.total || o.total_amount || 0), 0);
    const pendingOrdersCount = (orders || []).filter((o) => o.status === 'REQUESTED' || o.status === 'ACCEPTED').length;

    // Fetch active listings count
    const { count: activeListingsCount } = await supabaseAdmin
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', id)
      .eq('status', 'active');

    res.json({
      success: true,
      analytics: {
        todaySales: profile?.today_sales || totalGmv,
        today_sales: profile?.today_sales || totalGmv,
        totalRevenue: totalGmv,
        total_revenue: totalGmv,
        totalOrders: orders?.length || 0,
        total_orders: orders?.length || 0,
        completedOrders: completedOrders.length,
        completed_orders: completedOrders.length,
        pendingOrders: pendingOrdersCount,
        pending_orders: pendingOrdersCount,
        activeListings: activeListingsCount || 0,
        active_listings: activeListingsCount || 0,
        rating: profile?.rating || 5.0,
        reviewsCount: profile?.reviews_count || 0,
        reviews_count: profile?.reviews_count || 0,
        isOnline: profile?.is_online ?? true,
        is_online: profile?.is_online ?? true,
        verificationStatus: profile?.verification_status || 'pending',
        verification_status: profile?.verification_status || 'pending',
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function requestPayout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { seller_id, amount, upi_id } = req.body;

    if (!seller_id || !amount || !upi_id) {
      res.status(400).json({ success: false, error: 'seller_id, amount, and upi_id are required' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('seller_payouts')
      .insert({
        seller_id,
        amount,
        upi_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, payout: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getSellerPayouts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('seller_payouts')
      .select('*')
      .eq('seller_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, count: data?.length || 0, payouts: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
