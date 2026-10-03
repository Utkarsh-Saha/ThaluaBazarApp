import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { calculateDistanceKm } from '../services/locationService.js';

export async function getHaats(req: Request, res: Response): Promise<void> {
  try {
    const { lat, lng, radius_km = '50', district } = req.query;

    const userLat = lat ? parseFloat(lat as string) : undefined;
    const userLng = lng ? parseFloat(lng as string) : undefined;
    const radius = parseFloat(radius_km as string);

    if (userLat !== undefined && userLng !== undefined) {
      try {
        const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('get_nearby_haats', {
          user_lat: userLat,
          user_lng: userLng,
          radius_km: radius,
        });

        if (!rpcError && rpcData) {
          res.json({ success: true, count: rpcData.length, haats: rpcData });
          return;
        }
      } catch (e) {
        console.warn('[HaatsController] PostGIS RPC fallback to standard query:', e);
      }
    }

    let query = supabaseAdmin.from('haat_markets').select('*').order('created_at', { ascending: true });
    if (district) {
      query = query.eq('district', district as string);
    }

    const { data, error } = await query;
    if (error) throw error;

    const haatsWithDistance = (data || []).map((h) => {
      let distance_km = undefined;
      if (userLat !== undefined && userLng !== undefined && h.lat && h.lng) {
        distance_km = calculateDistanceKm(userLat, userLng, Number(h.lat), Number(h.lng));
      }
      return { ...h, distance_km };
    });

    res.json({ success: true, count: haatsWithDistance.length, haats: haatsWithDistance });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getHaatById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('haat_markets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ success: false, error: 'Haat not found' });
      return;
    }

    res.json({ success: true, haat: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
