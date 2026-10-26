import { AdminApi, AuditLog } from './api';

export interface AdminActor {
  id: string;
  name: string;
  role: string;
}

const DEFAULT_ACTOR: AdminActor = {
  id: 'adm_utkarsh_01',
  name: 'Admin Officer (Utkarsh)',
  role: 'Super Admin',
};

type LogListener = (log: AuditLog) => void;
const listeners: Set<LogListener> = new Set();

export const AdminLogger = {
  // Current active admin actor
  getActor(): AdminActor {
    try {
      const stored = localStorage.getItem('thaluwa_admin_actor');
      if (stored) return JSON.parse(stored);
    } catch {
      // Fallback
    }
    return DEFAULT_ACTOR;
  },

  setActor(actor: AdminActor): void {
    try {
      localStorage.setItem('thaluwa_admin_actor', JSON.stringify(actor));
    } catch (e) {
      console.warn('Could not persist admin actor', e);
    }
  },

  // Subscribe to real-time administrative logs dispatched in current session
  subscribe(listener: LogListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Core logging action
  async log(
    action: string,
    entity: string,
    entityId: string,
    details: string,
    metadata?: Record<string, any>
  ): Promise<AuditLog> {
    const actor = this.getActor();
    const recordedLog = await AdminApi.recordAuditLog({
      action: action.toUpperCase(),
      entity,
      entity_id: entityId,
      details,
      metadata: {
        ...metadata,
        client_timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
      actor_id: actor.id,
      actor_name: actor.name,
      actor_role: actor.role,
    });

    // Notify active listeners
    listeners.forEach((listener) => {
      try {
        listener(recordedLog);
      } catch (err) {
        console.error('Error in audit log listener:', err);
      }
    });

    return recordedLog;
  },

  // Convenience helper: Seller approval / rejection
  async logSellerDecision(
    sellerId: string,
    businessName: string,
    decision: 'verified' | 'rejected' | 'under_review',
    remarks?: string
  ): Promise<AuditLog> {
    const action =
      decision === 'verified'
        ? 'SELLER_VERIFIED'
        : decision === 'rejected'
        ? 'SELLER_REJECTED'
        : 'SELLER_UNDER_REVIEW';

    const details =
      decision === 'verified'
        ? `Approved seller verification and issued certified producer badge for "${businessName}".`
        : decision === 'rejected'
        ? `Rejected seller verification for "${businessName}". Reason: ${remarks || 'Incomplete KYC documentation'}.`
        : `Moved seller "${businessName}" application to Under Review.`;

    return this.log(action, 'seller_profiles', sellerId, details, {
      business_name: businessName,
      decision,
      remarks,
    });
  },

  // Convenience helper: Order status override
  async logOrderOverride(
    orderId: string,
    orderNumber: string,
    previousStatus: string,
    newStatus: string,
    reason: string
  ): Promise<AuditLog> {
    return this.log(
      'ORDER_OVERRIDE',
      'orders',
      orderId,
      `Manually transitioned order #${orderNumber} from '${previousStatus}' to '${newStatus}'. Reason: ${reason}.`,
      {
        order_number: orderNumber,
        previous_status: previousStatus,
        new_status: newStatus,
        reason,
      }
    );
  },

  // Convenience helper: Listing moderation
  async logListingModeration(
    listingId: string,
    title: string,
    action: 'APPROVED' | 'FLAGGED' | 'SUSPENDED' | 'PRICE_MODERATED',
    reason?: string
  ): Promise<AuditLog> {
    return this.log(
      `LISTING_${action}`,
      'listings',
      listingId,
      `Moderated listing "${title}": status updated to ${action}. ${reason ? `Reason: ${reason}` : ''}`,
      { title, action, reason }
    );
  },

  // Convenience helper: Payout disbursement
  async logPayoutDisbursal(
    payoutId: string,
    sellerName: string,
    amount: number,
    utr: string
  ): Promise<AuditLog> {
    return this.log(
      'PAYOUT_DISBURSED',
      'seller_payouts',
      payoutId,
      `Disbursed NEFT payout ₹${amount.toLocaleString('en-IN')} to ${sellerName}. Reference: ${utr}.`,
      {
        seller_name: sellerName,
        amount,
        utr_ref: utr,
      }
    );
  },

  // Convenience helper: System configuration changes
  async logConfigChange(
    configKey: string,
    previousValue: any,
    newValue: any,
    description: string
  ): Promise<AuditLog> {
    return this.log(
      'CONFIG_UPDATED',
      'system_config',
      configKey,
      `Modified platform parameter '${configKey}': ${description}.`,
      {
        config_key: configKey,
        previous_value: previousValue,
        new_value: newValue,
      }
    );
  },
};
