import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function syncUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { phone, name, email, role = 'buyer', language = 'en', lat = 26.435, lng = 92.03, address, village, district, expo_push_token } = req.body;
    const authId = req.user?.id;

    if (!phone) {
      res.status(400).json({ success: false, error: 'Phone number is required' });
      return;
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    let result;
    if (existingUser) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          auth_id: authId || existingUser.auth_id,
          name: name || existingUser.name,
          email: email || existingUser.email,
          role: role || existingUser.role,
          language: language || existingUser.language,
          lat: lat !== undefined ? lat : existingUser.lat,
          lng: lng !== undefined ? lng : existingUser.lng,
          address: address || existingUser.address,
          village: village || existingUser.village,
          district: district || existingUser.district,
          expo_push_token: expo_push_token || existingUser.expo_push_token,
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          auth_id: authId,
          phone,
          name: name || 'User',
          email,
          role,
          language,
          lat,
          lng,
          address,
          village,
          district,
          expo_push_token,
          verified: false,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({ success: true, user: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function getUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*, seller_profiles(*)')
      .or(`id.eq.${id},phone.eq.${id},auth_id.eq.${id}`)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({ success: true, user: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function updatePushToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { token, userId } = req.body;
    if (!token || !userId) {
      res.status(400).json({ success: false, error: 'token and userId are required' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('users')
      .update({ expo_push_token: token })
      .eq('id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'Push token updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
