import { Request, Response, NextFunction } from 'express';

/**
 * Deep sanitization for strings against XSS, null byte injection, and prototype pollution
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return value
      // Remove null bytes
      .replace(/\0/g, '')
      // Strip script tags and dangerous HTML events
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const cleanObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      // Prototype pollution mitigation
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      cleanObj[key] = sanitizeValue(val);
    }
    return cleanObj;
  }

  return value;
}

/**
 * Express middleware to sanitize req.body, req.query, and req.params
 */
export function sanitizePayload(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeValue(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  next();
}
