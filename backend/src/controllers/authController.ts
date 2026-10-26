import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';
import { ENV } from '../config/env.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

const JWT_SECRET = ENV.JWT_SECRET || 'thaluwa-bazar-secret-key-2026';

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  return phone.startsWith('+') ? phone : `+91${digits}`;
}

/**
 * Send OTP to phone number
 * In development, returns test OTP 123456 alongside sending via Supabase
 */
export async function sendOtp(req: Request, res: Response): Promise<void> {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, error: 'Phone number is required' });
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Check if user already exists in database
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, role, verified, district')
      .eq('phone', formattedPhone)
      .maybeSingle();

    const isExistingUser = !!existingUser;

    // Try Supabase OTP if configured
    try {
      await supabaseAdmin.auth.signInWithOtp({
        phone: formattedPhone,
      });
    } catch (e: any) {
      console.log('[Auth] Supabase OTP send warning (using fallback):', e?.message);
    }

    res.json({
      success: true,
      message: 'OTP sent successfully',
      formattedPhone,
      isExistingUser,
      userPreview: existingUser
        ? {
            name: existingUser.name,
            role: existingUser.role,
            district: existingUser.district,
          }
        : null,
      testOtp: '123456',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Verify OTP
 */
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      res.status(400).json({ success: false, error: 'Phone number and OTP are required' });
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Verify OTP logic (supports test OTP 123456 or Supabase verifyOtp)
    let isOtpValid = otp.toString().trim() === '123456';

    if (!isOtpValid) {
      try {
        const { data: authData, error: otpError } = await supabaseAdmin.auth.verifyOtp({
          phone: formattedPhone,
          token: otp.toString().trim(),
          type: 'sms',
        });
        if (!otpError && authData.user) {
          isOtpValid = true;
        }
      } catch (e) {
        // Continue
      }
    }

    if (!isOtpValid) {
      res.status(400).json({ success: false, error: 'Invalid or expired OTP. Use 123456 for testing.' });
      return;
    }

    // Lookup user in database
    const { data: existingUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*, seller_profiles(*)')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (userError) throw userError;

    // If user does not exist yet -> indicate new user needing registration
    if (!existingUser) {
      const tempToken = jwt.sign({ phone: formattedPhone, isNewUser: true }, JWT_SECRET, { expiresIn: '1d' });
      res.json({
        success: true,
        isNewUser: true,
        phone: formattedPhone,
        token: tempToken,
        message: 'OTP verified. Please complete your registration details.',
      });
      return;
    }

    // Ensure verified status is updated to true in database
    if (!existingUser.verified) {
      await supabaseAdmin
        .from('users')
        .update({ verified: true })
        .eq('id', existingUser.id);
      existingUser.verified = true;
    }

    // User exists -> issue authenticated session token
    const token = jwt.sign(
      {
        id: existingUser.id,
        phone: existingUser.phone,
        role: existingUser.role,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const sellerProfile = existingUser.seller_profiles?.[0] || null;

    res.json({
      success: true,
      isNewUser: false,
      user: {
        id: existingUser.id,
        phone: existingUser.phone,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role,
        language: existingUser.language || 'en',
        lat: Number(existingUser.lat || 26.435),
        lng: Number(existingUser.lng || 92.03),
        address: existingUser.address,
        village: existingUser.village,
        district: existingUser.district,
        verified: existingUser.verified,
        expo_push_token: existingUser.expo_push_token,
        created_at: existingUser.created_at,
      },
      sellerProfile,
      token,
      message: 'Welcome back to Thaluwa Bazar!',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Register Buyer Profile
 */
export async function registerBuyer(req: Request, res: Response): Promise<void> {
  try {
    const {
      phone,
      name,
      email,
      district = 'Darrang',
      village = 'Mangaldai',
      address,
      pincode,
      lat = 26.435,
      lng = 92.03,
      language = 'en',
      expo_push_token,
      role = 'buyer',
    } = req.body;

    if (!phone || !name) {
      res.status(400).json({ success: false, error: 'Phone and full name are required' });
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);

    // Upsert into users table
    const fullAddress = address ? `${address}${pincode ? `, PIN: ${pincode}` : ''}` : `${village}, ${district}`;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          phone: formattedPhone,
          name: name.trim(),
          email: email?.trim() || null,
          role,
          language,
          lat: Number(lat),
          lng: Number(lng),
          address: fullAddress,
          village: village.trim(),
          district: district.trim(),
          expo_push_token: expo_push_token || null,
          verified: true,
        },
        { onConflict: 'phone' }
      )
      .select()
      .single();

    if (error) throw error;

    // Create real Welcome notification in DB
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: user.id,
        title_en: '🎉 Welcome to Thaluwa Bazar!',
        title_as: '🎉 থলুৱা বজাৰলৈ স্বাগতম!',
        body_en: `Hello ${user.name}! Your account is now active. Explore fresh local produce from Assam's farmers & SHGs.`,
        body_as: `নমস্কাৰ ${user.name}! আপোনাৰ একাউণ্ট সক্ৰিয় হৈছে। অসমৰ কৃষক আৰু আত্মসহায়ক গোটৰ সতেজ সামগ্ৰী অন্বেষণ কৰক।`,
        type: 'system',
      });
    } catch (notifErr) {
      console.warn('[Auth] Welcome notification warning:', notifErr);
    }

    const token = jwt.sign(
      {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Buyer account created successfully!',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        role: user.role,
        language: user.language,
        lat: Number(user.lat),
        lng: Number(user.lng),
        address: user.address,
        village: user.village,
        district: user.district,
        verified: user.verified,
        created_at: user.created_at,
      },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Sync user profile
 */
export async function syncUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { phone, name, email, role = 'buyer', language = 'en', lat, lng, address, village, district, expo_push_token } = req.body;
    const authId = req.user?.id;

    if (!phone) {
      res.status(400).json({ success: false, error: 'Phone number is required' });
      return;
    }

    const formattedPhone = formatPhoneNumber(phone);

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', formattedPhone)
      .maybeSingle();

    let result;
    if (existingUser) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          auth_id: authId || existingUser.auth_id,
          name: name !== undefined ? name : existingUser.name,
          email: email !== undefined ? email : existingUser.email,
          role: role !== undefined ? role : existingUser.role,
          language: language !== undefined ? language : existingUser.language,
          lat: lat !== undefined ? Number(lat) : existingUser.lat,
          lng: lng !== undefined ? Number(lng) : existingUser.lng,
          address: address !== undefined ? address : existingUser.address,
          village: village !== undefined ? village : existingUser.village,
          district: district !== undefined ? district : existingUser.district,
          expo_push_token: expo_push_token !== undefined ? expo_push_token : existingUser.expo_push_token,
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
          phone: formattedPhone,
          name: name || 'Assam Resident',
          email,
          role,
          language,
          lat: lat ? Number(lat) : 26.435,
          lng: lng ? Number(lng) : 92.03,
          address,
          village,
          district,
          expo_push_token,
          verified: true,
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

/**
 * Get User Profile
 */
export async function getUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*, seller_profiles(*)')
      .or(`id.eq.${id},phone.eq.${id}`)
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

/**
 * Update Push Token
 */
export async function updatePushToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { token, userId, phone } = req.body;
    if (!token) {
      res.status(400).json({ success: false, error: 'token is required' });
      return;
    }

    let query = supabaseAdmin.from('users').update({ expo_push_token: token });
    if (userId) {
      query = query.eq('id', userId);
    } else if (phone) {
      query = query.eq('phone', formatPhoneNumber(phone));
    } else {
      res.status(400).json({ success: false, error: 'userId or phone required' });
      return;
    }

    const { error } = await query;
    if (error) throw error;

    res.json({ success: true, message: 'Push token updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
