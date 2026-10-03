import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { calculateDistanceKm } from '../services/locationService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getListings(req: Request, res: Response): Promise<void> {
  try {
    const {
      lat,
      lng,
      radius_km = '25',
      category_id,
      search,
      seller_id,
      haat_name,
      status = 'active',
      limit = '50',
      offset = '0',
    } = req.query;

    const userLat = lat ? parseFloat(lat as string) : undefined;
    const userLng = lng ? parseFloat(lng as string) : undefined;
    const radius = parseFloat(radius_km as string);

    // If coordinates are provided, attempt to use PostGIS RPC function
    if (userLat !== undefined && userLng !== undefined) {
      try {
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_nearby_listings', {
          user_lat: userLat,
          user_lng: userLng,
          radius_km: radius,
          category_filter: category_id || null,
          search_query: search || null,
        });

        if (!rpcError && rpcData) {
          res.json({
            success: true,
            count: rpcData.length,
            listings: rpcData,
          });
          return;
        }
      } catch (e) {
        console.warn('[ListingsController] PostGIS RPC fallback to standard query:', e);
      }
    }

    // Standard Query Fallback
    let query = supabaseAdmin
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (category_id) {
      query = query.eq('category_id', category_id);
    }
    if (seller_id) {
      query = query.eq('seller_id', seller_id);
    }
    if (haat_name) {
      query = query.eq('haat_name', haat_name);
    }
    if (search) {
      query = query.or(`title_en.ilike.%${search}%,title_as.ilike.%${search}%,village.ilike.%${search}%,district.ilike.%${search}%`);
    }

    query = query.range(parseInt(offset as string, 10), parseInt(offset as string, 10) + parseInt(limit as string, 10) - 1);

    const { data, error } = await query;
    if (error) throw error;

    // Attach calculated distance if lat/lng available
    const listingsWithDistance = (data || []).map((item) => {
      let distance_km = undefined;
      if (userLat !== undefined && userLng !== undefined && item.lat && item.lng) {
        distance_km = calculateDistanceKm(userLat, userLng, Number(item.lat), Number(item.lng));
      }
      return { ...item, distance_km };
    });

    res.json({
      success: true,
      count: listingsWithDistance.length,
      listings: listingsWithDistance,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getListingById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('listings')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ success: false, error: 'Listing not found' });
      return;
    }

    res.json({ success: true, listing: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function createListing(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const listingPayload = req.body;

    const { data, error } = await supabaseAdmin
      .from('listings')
      .insert({
        seller_id: listingPayload.seller_id,
        seller_name: listingPayload.seller_name,
        seller_type: listingPayload.seller_type || 'shg_member',
        seller_phone: listingPayload.seller_phone,
        category_id: listingPayload.category_id,
        category_name_en: listingPayload.category_name_en,
        category_name_as: listingPayload.category_name_as,
        title_en: listingPayload.title_en,
        title_as: listingPayload.title_as,
        description_en: listingPayload.description_en || '',
        description_as: listingPayload.description_as || '',
        price: Number(listingPayload.price),
        unit: listingPayload.unit || 'kg',
        stock: listingPayload.stock !== undefined ? Number(listingPayload.stock) : 10,
        image_url: listingPayload.image_url,
        lat: Number(listingPayload.lat || 26.435),
        lng: Number(listingPayload.lng || 92.03),
        village: listingPayload.village || 'Mangaldai',
        district: listingPayload.district || 'Darrang',
        haat_name: listingPayload.haat_name || null,
        rating: 5.0,
        status: 'active',
        is_organic: listingPayload.is_organic ?? true,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, listing: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updateListing(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, listing: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function toggleListingStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const { data: listing, error: fetchErr } = await supabaseAdmin
      .from('listings')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchErr) throw fetchErr;

    const newStatus = listing.status === 'active' ? 'inactive' : 'active';

    const { data, error } = await supabaseAdmin
      .from('listings')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, listing: data, status: newStatus });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function unlockContact(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { listing_id, buyer_id, seller_id } = req.body;

    const { data, error } = await supabaseAdmin
      .from('contact_unlocks')
      .insert({
        listing_id,
        buyer_id,
        seller_id,
        payment_status: 'free_tier',
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, unlock: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
