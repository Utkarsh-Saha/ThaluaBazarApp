import rateLimit from 'express-rate-limit';

/**
 * Thaluwa Bazar Rate Limiting Suite
 * Protects authentication endpoints from credential brute-forcing, OTP abuse,
 * and denial-of-service attempts.
 */

// 1. OTP Request Limiter: Maximum 5 OTP requests per 10 minutes per IP/Phone
export const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 OTP requests per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  message: {
    success: false,
    error: 'Too many OTP requests from this connection. Please wait 10 minutes before trying again.',
  },
  keyGenerator: (req) => {
    // Key by normalized phone number if present, otherwise fallback to IP
    const phone = req.body?.phone ? String(req.body.phone).replace(/\D/g, '') : '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    return phone ? `otp-send:${phone}` : `otp-send-ip:${ip}`;
  },
});

// 2. OTP Verification Limiter: Maximum 5 verification attempts per 10 minutes
export const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  message: {
    success: false,
    error: 'Too many verification attempts. Please wait 10 minutes before attempting to verify again.',
  },
  keyGenerator: (req) => {
    const phone = req.body?.phone ? String(req.body.phone).replace(/\D/g, '') : '';
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    return phone ? `otp-verify:${phone}` : `otp-verify-ip:${ip}`;
  },
});

// 3. General Public API Limiter: Maximum 120 requests per minute
export const apiGeneralLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down and try again shortly.',
  },
});

// 4. Admin Operations Limiter: Maximum 60 requests per minute
export const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Administrative rate limit exceeded. Please wait a moment.',
  },
});
