import crypto from 'crypto';
import { ENV } from '../config/env.js';

/**
 * Thaluwa Bazar Security & Cryptography Utilities
 * Provides AES-256-GCM authenticated encryption for sensitive PII (bank accounts, KYC),
 * HMAC-SHA256 signature verification for payments, and PII masking.
 */

const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(ENV.JWT_SECRET || 'thaluwa-bazar-secure-encryption-key-2026')
  .digest(); // 32 bytes for AES-256

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

/**
 * Encrypts a plaintext string into a serialized hex payload (IV + AuthTag + Ciphertext)
 */
export function encryptSensitiveField(plaintext: string): string {
  if (!plaintext) return plaintext;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv, { authTagLength: AUTH_TAG_LENGTH });
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a serialized hex payload (IV + AuthTag + Ciphertext)
 */
export function decryptSensitiveField(serializedPayload: string): string {
  if (!serializedPayload || !serializedPayload.includes(':')) {
    return serializedPayload;
  }

  try {
    const [ivHex, authTagHex, encryptedHex] = serializedPayload.split(':');
    if (!ivHex || !authTagHex || !encryptedHex) return serializedPayload;

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.warn('[Crypto] Decryption error (returning raw or masked):', (error as Error).message);
    return serializedPayload;
  }
}

/**
 * Masks bank account number or sensitive identifier, leaving only last 4 digits visible
 * Example: "123456789012" -> "••••••••9012"
 */
export function maskSensitiveIdentifier(value?: string | null, visibleSuffixLength: number = 4): string {
  if (!value) return '';
  const clean = value.trim();
  if (clean.length <= visibleSuffixLength) return clean;
  const prefixLength = clean.length - visibleSuffixLength;
  return `${'•'.repeat(prefixLength)}${clean.slice(-visibleSuffixLength)}`;
}

/**
 * Validates HMAC-SHA256 signature (used for webhook & payment callbacks) in constant time
 */
export function verifyHmacSignature(data: string, secret: string, expectedSignature: string): boolean {
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const generatedBuffer = Buffer.from(generatedSignature, 'hex');

  if (expectedBuffer.length !== generatedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, generatedBuffer);
}
