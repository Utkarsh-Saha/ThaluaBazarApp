import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '../config/supabase.js';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

const DATA_DIR = fs.existsSync(path.resolve(process.cwd(), 'backend'))
  ? path.resolve(process.cwd(), 'backend/data')
  : path.resolve(process.cwd(), 'data');
const AUDIT_FILE = path.join(DATA_DIR, 'audit_logs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('[AuditService] Failed to create data dir:', err);
  }
}

// In-memory cache
let inMemoryLogs: AuditLogEntry[] = [];

// Load logs from JSON file on initialization
function loadLogsFromFile(): void {
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      const content = fs.readFileSync(AUDIT_FILE, 'utf8');
      inMemoryLogs = JSON.parse(content);
    } else {
      // Seed initial platform baseline logs
      inMemoryLogs = [
        {
          id: 'aud_sys_1001',
          timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
          actor_id: 'admin_sys_root',
          actor_name: 'System Root',
          actor_role: 'Super Admin',
          action: 'PLATFORM_INITIALIZATION',
          entity: 'system_config',
          entity_id: 'sys-core',
          details: 'Initialized Thaluwa Bazar operational engine with secure audit logging protocol.',
          metadata: { version: '1.0.0', environment: process.env.NODE_ENV || 'production' },
        },
        {
          id: 'aud_sys_1002',
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          actor_id: 'adm_utkarsh_01',
          actor_name: 'Admin Officer (Utkarsh)',
          actor_role: 'Super Admin',
          action: 'SECURITY_AUDIT_ENABLED',
          entity: 'security_policy',
          entity_id: 'sec-pol-01',
          details: 'Activated multi-factor admin audit console and real-time ledger tracking.',
          metadata: { real_time_sync: true, broadcast_channel: 'admin_audit' },
        },
      ];
      saveLogsToFile();
    }
  } catch (err) {
    console.error('[AuditService] Failed to load audit logs:', err);
    inMemoryLogs = [];
  }
}

function saveLogsToFile(): void {
  try {
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(inMemoryLogs.slice(0, 1000), null, 2), 'utf8');
  } catch (err) {
    console.error('[AuditService] Failed to save audit logs to file:', err);
  }
}

loadLogsFromFile();

export interface LogActionParams {
  actor_id?: string;
  actor_name?: string;
  actor_role?: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Record an administrative activity log entry.
 */
export async function recordAuditLog(params: LogActionParams): Promise<AuditLogEntry> {
  const entry: AuditLogEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    actor_id: params.actor_id || 'adm_console_01',
    actor_name: params.actor_name || 'Admin Moderator',
    actor_role: params.actor_role || 'Operations Admin',
    action: params.action.toUpperCase(),
    entity: params.entity,
    entity_id: params.entity_id,
    details: params.details,
    metadata: params.metadata || {},
    ip_address: params.ip_address,
    user_agent: params.user_agent,
  };

  // Add to local in-memory storage (newest first)
  inMemoryLogs.unshift(entry);
  saveLogsToFile();

  // Also attempt Supabase insert if audit_logs table is configured
  try {
    await supabaseAdmin.from('audit_logs').insert({
      id: entry.id,
      actor_id: entry.actor_id,
      actor_name: entry.actor_name,
      actor_role: entry.actor_role,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id,
      details: entry.details,
      metadata: entry.metadata,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      created_at: entry.timestamp,
    });
  } catch {
    // Fail silently if table not yet provisioned in Supabase schema
  }

  return entry;
}

/**
 * Retrieve audit logs with flexible search and filtering.
 */
export async function queryAuditLogs(filters?: {
  search?: string;
  action?: string;
  entity?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  let filtered = [...inMemoryLogs];

  if (filters?.action && filters.action !== 'all') {
    filtered = filtered.filter((log) => log.action.toUpperCase() === filters.action!.toUpperCase());
  }

  if (filters?.entity && filters.entity !== 'all') {
    filtered = filtered.filter((log) => log.entity.toLowerCase() === filters.entity!.toLowerCase());
  }

  if (filters?.search && filters.search.trim()) {
    const q = filters.search.toLowerCase().trim();
    filtered = filtered.filter(
      (log) =>
        log.actor_name.toLowerCase().includes(q) ||
        log.actor_id.toLowerCase().includes(q) ||
        log.actor_role.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        log.entity_id.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        (log.metadata && JSON.stringify(log.metadata).toLowerCase().includes(q))
    );
  }

  const total = filtered.length;
  const limit = Math.min(filters?.limit || 100, 500);
  const offset = filters?.offset || 0;
  const paginated = filtered.slice(offset, offset + limit);

  return { logs: paginated, total };
}
