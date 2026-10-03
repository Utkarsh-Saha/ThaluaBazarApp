import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function createReview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { order_id, listing_id, seller_id, buyer_id, buyer_name, rating, comment } = req.body;

    if (!seller_id || !buyer_id || !rating) {
      res.status(400).json({ success: false, error: 'seller_id, buyer_id, and rating (1-5) are required' });
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        order_id: order_id || null,
        listing_id: listing_id || null,
        seller_id,
        buyer_id,
        buyer_name: buyer_name || 'Verified Buyer',
        rating: Math.min(5, Math.max(1, parseInt(rating, 10))),
        comment: comment || '',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, review: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getSellerReviews(req: Request, res: Response): Promise<void> {
  try {
    const { sellerId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const averageRating =
      data && data.length > 0
        ? data.reduce((sum, r) => sum + r.rating, 0) / data.length
        : 5.0;

    res.json({
      success: true,
      count: data?.length || 0,
      averageRating: Math.round(averageRating * 10) / 10,
      reviews: data || [],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
