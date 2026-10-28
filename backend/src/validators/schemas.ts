import { z } from 'zod';

/**
 * Strict Input Validation Schemas for Thaluwa Bazar API
 */

// Phone number regex accepting Indian mobile numbers (10 digits, optional +91 or 91)
const phoneRegex = /^(\+91[\s-]?)?[6-9]\d{9}$/;

export const sendOtpSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required' })
    .regex(phoneRegex, 'Please provide a valid 10-digit Indian mobile number'),
}).passthrough();

export const verifyOtpSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required' })
    .regex(phoneRegex, 'Please provide a valid Indian mobile number'),
  otp: z
    .union([z.string(), z.number()])
    .transform((val) => String(val).trim())
    .refine((val) => /^\d{6}$/.test(val), {
      message: 'OTP must be a valid 6-digit numeric code',
    }),
}).passthrough();

export const registerBuyerSchema = z.object({
  phone: z
    .string({ required_error: 'Phone number is required' })
    .regex(phoneRegex, 'Valid mobile number required'),
  name: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: z.string().email('Invalid email address format').optional().nullable().or(z.literal('')),
  district: z.string().min(2, 'District is required').max(100),
  village: z.string().min(2, 'Village is required').max(100),
  address: z.string().min(2, 'Address is required').max(300),
  pincode: z.string().optional().nullable().or(z.literal('')),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  language: z.enum(['en', 'as']).default('en'),
  role: z.enum(['buyer', 'seller']).default('buyer'),
  expo_push_token: z.string().max(255).optional().nullable(),
}).passthrough();

export const registerSellerSchema = z.object({
  user_id: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  business_name: z
    .string({ required_error: 'Business name is required' })
    .min(2, 'Business name must be at least 2 characters')
    .max(150),
  seller_type: z.enum(['shg_member', 'individual', 'small_business']).default('shg_member'),
  shg_code: z.string().max(50).optional().nullable().or(z.literal('')),
  village: z.string().min(2).max(100),
  district: z.string().min(2).max(100),
  upi_id: z
    .string({ required_error: 'UPI ID is required' })
    .min(3)
    .max(100),
  bank_account: z.string().optional().nullable().or(z.literal('')),
  bank_ifsc: z.string().max(20).optional().nullable().or(z.literal('')),
  delivery_radius_km: z.coerce.number().min(1).max(100).default(15),
  id_proof_url: z.string().optional().nullable().or(z.literal('')),
  address_proof_url: z.string().optional().nullable().or(z.literal('')),
  shg_cert_url: z.string().optional().nullable().or(z.literal('')),
  bank_proof_url: z.string().optional().nullable().or(z.literal('')),
}).passthrough();

export const createOrderSchema = z.object({
  buyer_id: z.string().min(1, 'Buyer ID is required'),
  buyer_name: z.string().min(2),
  buyer_phone: z.string().regex(phoneRegex, 'Valid buyer phone required'),
  seller_id: z.string().min(1, 'Seller ID is required'),
  seller_name: z.string().min(2),
  seller_phone: z.string().regex(phoneRegex, 'Valid seller phone required'),
  subtotal: z.coerce.number().positive('Subtotal must be positive'),
  delivery_fee: z.coerce.number().min(0).default(0),
  discount: z.coerce.number().min(0).default(0),
  total: z.coerce.number().positive('Total must be positive'),
  pickup_or_delivery: z.enum(['delivery', 'pickup']).default('delivery'),
  delivery_address: z.string().min(3),
  payment_method: z.enum(['cod', 'upi', 'card', 'netbanking']).default('cod'),
  items: z.array(
    z.object({
      listing_id: z.string().optional().nullable(),
      title: z.string().min(1),
      quantity: z.coerce.number().int().positive(),
      unit_price: z.coerce.number().positive(),
      unit: z.string().min(1),
      line_total: z.coerce.number().positive(),
    }).passthrough()
  ).min(1, 'Order must contain at least one item'),
}).passthrough();
