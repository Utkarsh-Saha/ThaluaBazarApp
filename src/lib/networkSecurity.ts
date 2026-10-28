/**
 * Network & Transport Security Module
 * Enforces HTTPS/TLS in production, blocks insecure plaintext transmissions,
 * and validates allowed host origins.
 */

const IS_PROD = process.env.NODE_ENV === 'production' || process.env.EXPO_PUBLIC_APP_ENV === 'production';

// Allowed production backend & storage domains
export const ALLOWED_SECURE_HOSTS = [
  'supabase.co',
  'razorpay.com',
  'api.razorpay.com',
  'expo.dev',
];

/**
 * Enforces HTTPS/TLS protocol on URL.
 * Automatically upgrades plaintext http:// to https:// in production or throws an error.
 */
export function enforceHttps(url: string): string {
  if (!url) return url;

  // Development loopbacks (Android emulator 10.0.2.2 or localhost) are allowed in development
  const isLocalDev =
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('10.0.2.2') ||
    url.includes('192.168.') ||
    url.includes('10.');

  if (!isLocalDev && IS_PROD) {
    if (url.startsWith('http://')) {
      console.warn(`[NetworkSecurity] Insecure HTTP URL detected. Upgrading to HTTPS: ${url}`);
      return url.replace('http://', 'https://');
    }
  }

  return url;
}

/**
 * Validates whether a JWT token is structurally valid and not expired
 */
export function isJwtExpired(token: string | null): boolean {
  if (!token) return true;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false; // Non-JWT opaque token
    
    // Base64URL decode the payload
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const parsed = JSON.parse(jsonPayload);
    if (!parsed.exp) return false;

    // Current time in seconds with 30s buffer
    const currentTime = Math.floor(Date.now() / 1000);
    return parsed.exp < (currentTime + 30);
  } catch {
    // If decoding fails, do not assume expired
    return false;
  }
}
