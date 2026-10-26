export interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  verifiedSellers: number;
  pendingSellers: number;
  totalListings: number;
  activeListings: number;
  totalOrders: number;
  completedOrders: number;
  totalGmv: number;
  formattedGmv: string;
}

export interface SellerProfile {
  id: string;
  user_id: string;
  business_name: string;
  shg_code: string;
  seller_type: 'shg_member' | 'individual_farmer' | 'artisan' | 'small_business';
  verification_status: 'pending' | 'under_review' | 'verified' | 'rejected';
  district: string;
  address?: string;
  bank_account_no?: string;
  ifsc_code?: string;
  upi_id?: string;
  rating: number;
  delivery_radius_km: number;
  created_at: string;
  users?: {
    id: string;
    phone: string;
    name?: string;
    email?: string;
    verified: boolean;
    language: string;
  };
}

export interface OrderItem {
  id: string;
  listing_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  buyer_name: string;
  buyer_phone: string;
  seller_id: string;
  seller_name: string;
  district: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'REQUESTED' | 'ACCEPTED' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'COMPLETED' | 'CANCELLED';
  pickup_or_delivery: 'pickup' | 'delivery';
  payment_method: 'COD' | 'UPI';
  payment_status: 'pending' | 'paid' | 'refunded';
  created_at: string;
  items: OrderItem[];
}



export interface PayoutRecord {
  id: string;
  seller_id: string;
  seller_name: string;
  amount: number;
  status: 'pending' | 'processed' | 'failed';
  utr_ref?: string;
  bank_account: string;
  ifsc: string;
  created_at: string;
  disbursed_at?: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api/v1';

// Initial Mock Datasets
let mockStats: AdminStats = {
  totalUsers: 2568,
  totalSellers: 452,
  verifiedSellers: 388,
  pendingSellers: 64,
  totalListings: 1420,
  activeListings: 1180,
  totalOrders: 1258,
  completedOrders: 1120,
  totalGmv: 245680,
  formattedGmv: '₹2,45,680',
};

let mockSellers: SellerProfile[] = [
  {
    id: 'sel-001',
    user_id: 'usr-101',
    business_name: 'Brahmaputra Organic Mustard Co-op',
    shg_code: 'AS-MRG-SHG-2024-102',
    seller_type: 'shg_member',
    verification_status: 'pending',
    district: 'Morigaon',
    address: 'Bhuragaon Cluster, Morigaon, Assam - 782121',
    bank_account_no: '•••• •••• 4589',
    ifsc_code: 'SBIN0001234',
    upi_id: 'brahmaputra.mustard@okaxis',
    rating: 4.8,
    delivery_radius_km: 15,
    created_at: '2026-10-02T10:15:00Z',
    users: {
      id: 'usr-101',
      phone: '+91 98640 12345',
      name: 'Jonali Saikia (President)',
      verified: false,
      language: 'as',
    },
  },
  {
    id: 'sel-002',
    user_id: 'usr-102',
    business_name: 'Nagaon Bell Metal Artisans',
    shg_code: 'AS-NGN-ART-2023-455',
    seller_type: 'artisan',
    verification_status: 'pending',
    district: 'Nagaon',
    address: 'Sarthebari Heritage Lane, Nagaon, Assam',
    bank_account_no: '•••• •••• 8821',
    ifsc_code: 'PUNB0123456',
    upi_id: 'nagaon.bellmetal@ybl',
    rating: 4.9,
    delivery_radius_km: 25,
    created_at: '2026-10-01T14:30:00Z',
    users: {
      id: 'usr-102',
      phone: '+91 94350 98765',
      name: 'Ramen Karmakar',
      verified: false,
      language: 'as',
    },
  },
  {
    id: 'sel-003',
    user_id: 'usr-103',
    business_name: 'Darrang Golden Paddy Collective',
    shg_code: 'AS-DRG-SHG-2024-089',
    seller_type: 'shg_member',
    verification_status: 'under_review',
    district: 'Darrang',
    address: 'Sipajhar Agricultural Belt, Darrang, Assam',
    bank_account_no: '•••• •••• 1102',
    ifsc_code: 'UCBA0000889',
    upi_id: 'darrang.golden@icici',
    rating: 4.7,
    delivery_radius_km: 20,
    created_at: '2026-09-29T08:20:00Z',
    users: {
      id: 'usr-103',
      phone: '+91 91012 34567',
      name: 'Bhabani Kalita',
      verified: false,
      language: 'en',
    },
  },
  {
    id: 'sel-004',
    user_id: 'usr-104',
    business_name: 'Sualkuchi Silk Weavers Guild',
    shg_code: 'AS-KMR-SLK-2022-771',
    seller_type: 'artisan',
    verification_status: 'verified',
    district: 'Kamrup',
    address: 'Silk Hub Road, Sualkuchi, Kamrup Rural, Assam',
    bank_account_no: '•••• •••• 9934',
    ifsc_code: 'HDFC0001452',
    upi_id: 'sualkuchi.silk@hdfcbank',
    rating: 5.0,
    delivery_radius_km: 30,
    created_at: '2026-09-15T11:00:00Z',
    users: {
      id: 'usr-104',
      phone: '+91 97060 55432',
      name: 'Pranab Baishya',
      verified: true,
      language: 'as',
    },
  },
  {
    id: 'sel-005',
    user_id: 'usr-105',
    business_name: 'Kharupetia Fresh Organic Produce',
    shg_code: 'AS-DRG-VEG-2024-312',
    seller_type: 'individual_farmer',
    verification_status: 'verified',
    district: 'Darrang',
    address: 'Station Road, Kharupetia, Darrang, Assam',
    bank_account_no: '•••• •••• 7741',
    ifsc_code: 'SBIN0005432',
    upi_id: 'kharupetia.fresh@sbi',
    rating: 4.8,
    delivery_radius_km: 12,
    created_at: '2026-09-10T09:40:00Z',
    users: {
      id: 'usr-105',
      phone: '+91 98541 22334',
      name: 'Mukut Deka',
      verified: true,
      language: 'as',
    },
  },
];

let mockOrders: Order[] = [
  {
    id: 'ord-1001',
    order_number: 'TB-2026-8841',
    buyer_id: 'usr-b01',
    buyer_name: 'Anupam Barua',
    buyer_phone: '+91 98640 99881',
    seller_id: 'sel-001',
    seller_name: 'Brahmaputra Organic Mustard Co-op',
    district: 'Morigaon',
    subtotal: 650,
    delivery_fee: 40,
    total: 690,
    status: 'REQUESTED',
    pickup_or_delivery: 'delivery',
    payment_method: 'COD',
    payment_status: 'pending',
    created_at: '2026-10-03T09:15:00Z',
    items: [
      { id: 'item-1', listing_id: 'lst-1', title: 'Cold-Pressed Mustard Oil (1L)', quantity: 2, unit_price: 240, line_total: 480 },
      { id: 'item-2', listing_id: 'lst-2', title: 'Organic Black Mustard Seeds (500g)', quantity: 1, unit_price: 170, line_total: 170 },
    ],
  },
  {
    id: 'ord-1002',
    order_number: 'TB-2026-8840',
    buyer_id: 'usr-b02',
    buyer_name: 'Dipika Devi',
    buyer_phone: '+91 94351 22119',
    seller_id: 'sel-004',
    seller_name: 'Sualkuchi Silk Weavers Guild',
    district: 'Kamrup',
    subtotal: 3800,
    delivery_fee: 0,
    total: 3800,
    status: 'ACCEPTED',
    pickup_or_delivery: 'pickup',
    payment_method: 'UPI',
    payment_status: 'paid',
    created_at: '2026-10-03T08:40:00Z',
    items: [
      { id: 'item-3', listing_id: 'lst-4', title: 'Handwoven Assam Eri Silk Gamosa', quantity: 2, unit_price: 1900, line_total: 3800 },
    ],
  },
  {
    id: 'ord-1003',
    order_number: 'TB-2026-8839',
    buyer_id: 'usr-b03',
    buyer_name: 'Rupjyoti Hazarika',
    buyer_phone: '+91 97061 88772',
    seller_id: 'sel-005',
    seller_name: 'Kharupetia Fresh Organic Produce',
    district: 'Darrang',
    subtotal: 420,
    delivery_fee: 30,
    total: 450,
    status: 'READY_FOR_PICKUP',
    pickup_or_delivery: 'pickup',
    payment_method: 'COD',
    payment_status: 'pending',
    created_at: '2026-10-03T07:20:00Z',
    items: [
      { id: 'item-4', listing_id: 'lst-6', title: 'Farm Fresh Bhut Jolokia (250g)', quantity: 1, unit_price: 180, line_total: 180 },
      { id: 'item-5', listing_id: 'lst-7', title: 'Organic Dhekia Saag & Vegetables', quantity: 3, unit_price: 80, line_total: 240 },
    ],
  },
  {
    id: 'ord-1004',
    order_number: 'TB-2026-8835',
    buyer_id: 'usr-b04',
    buyer_name: 'Manash Sarma',
    buyer_phone: '+91 91011 55443',
    seller_id: 'sel-002',
    seller_name: 'Nagaon Bell Metal Artisans',
    district: 'Nagaon',
    subtotal: 1450,
    delivery_fee: 60,
    total: 1510,
    status: 'COMPLETED',
    pickup_or_delivery: 'delivery',
    payment_method: 'UPI',
    payment_status: 'paid',
    created_at: '2026-10-02T16:10:00Z',
    items: [
      { id: 'item-6', listing_id: 'lst-8', title: 'Traditional Kahi-Bati Set (Bell Metal)', quantity: 1, unit_price: 1450, line_total: 1450 },
    ],
  },
];



let mockPayouts: PayoutRecord[] = [
  {
    id: 'pay-501',
    seller_id: 'sel-004',
    seller_name: 'Sualkuchi Silk Weavers Guild',
    amount: 14800,
    status: 'pending',
    bank_account: '•••• •••• 9934',
    ifsc: 'HDFC0001452',
    created_at: '2026-10-03T06:00:00Z',
  },
  {
    id: 'pay-502',
    seller_id: 'sel-005',
    seller_name: 'Kharupetia Fresh Organic Produce',
    amount: 8450,
    status: 'pending',
    bank_account: '•••• •••• 7741',
    ifsc: 'SBIN0005432',
    created_at: '2026-10-03T06:00:00Z',
  },
  {
    id: 'pay-500',
    seller_id: 'sel-002',
    seller_name: 'Nagaon Bell Metal Artisans',
    amount: 21500,
    status: 'processed',
    utr_ref: 'UTR2026100299814421',
    bank_account: '•••• •••• 8821',
    ifsc: 'PUNB0123456',
    created_at: '2026-09-30T06:00:00Z',
    disbursed_at: '2026-10-02T11:30:00Z',
  },
];

let mockAuditLogs: AuditLog[] = [
  {
    id: 'aud-001',
    actor_name: 'Admin Officer (Utkarsh)',
    actor_role: 'Super Admin',
    action: 'VERIFY_SELLER',
    entity: 'seller_profiles',
    entity_id: 'sel-004',
    details: 'Verified Sualkuchi Silk Weavers Guild and issued gold authenticity badge.',
    timestamp: '2026-09-15T11:05:00Z',
  },
  {
    id: 'aud-002',
    actor_name: 'Admin Officer (Utkarsh)',
    actor_role: 'Super Admin',
    action: 'DISBURSE_PAYOUT',
    entity: 'seller_payouts',
    entity_id: 'pay-500',
    details: 'Triggered batch NEFT payout ₹21,500 with UTR2026100299814421.',
    timestamp: '2026-10-02T11:32:00Z',
  },
];

export const AdminApi = {
  // Check backend health
  async checkBackend(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET', signal: AbortSignal.timeout(2000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  // Fetch Dashboard Stats
  async getStats(): Promise<AdminStats> {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.stats) {
          return {
            ...mockStats,
            ...json.stats,
            formattedGmv: `₹${(json.stats.totalGmv || mockStats.totalGmv).toLocaleString('en-IN')}`,
          };
        }
      }
    } catch {
      // Return mock dataset fallback
    }
    return mockStats;
  },

  // Fetch Pending & All Sellers
  async getSellers(filter?: string): Promise<SellerProfile[]> {
    try {
      const url = filter && filter !== 'all' ? `${API_BASE}/admin/sellers?status=${filter}` : `${API_BASE}/admin/sellers`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const json = await res.json();
        const sellerList = json.sellers || json.pending_sellers;
        if (json.success && Array.isArray(sellerList) && sellerList.length > 0) {
          return sellerList.map((s: any) => ({
            id: s.id,
            user_id: s.user_id,
            business_name: s.business_name || s.users?.name || 'Local Seller',
            shg_code: s.shg_code || 'SHG-MEMBER',
            seller_type: s.seller_type || 'shg_member',
            verification_status: s.verification_status || 'pending',
            district: s.district || 'Assam',
            address: s.address,
            bank_account_no: s.bank_account || s.bank_account_no,
            ifsc_code: s.bank_ifsc || s.ifsc_code,
            upi_id: s.upi_id,
            rating: s.rating || 4.5,
            delivery_radius_km: s.delivery_radius_km || 15,
            created_at: s.created_at || new Date().toISOString(),
            users: s.users,
          }));
        }
      }
    } catch {
      // Fallback
    }

    if (filter === 'pending') {
      return mockSellers.filter((s) => s.verification_status === 'pending' || s.verification_status === 'under_review');
    }
    if (filter && filter !== 'all') {
      return mockSellers.filter((s) => s.verification_status === filter);
    }
    return mockSellers;
  },

  // Verify / Reject Seller
  async updateSellerStatus(sellerId: string, status: 'verified' | 'rejected' | 'under_review', remarks?: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE}/admin/sellers/${sellerId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks }),
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      // Local state update fallback
    }

    const seller = mockSellers.find((s) => s.id === sellerId);
    if (seller) {
      seller.verification_status = status;
      if (seller.users && status === 'verified') {
        seller.users.verified = true;
      }
    }

    // Add Audit Log
    mockAuditLogs.unshift({
      id: `aud-${Date.now()}`,
      actor_name: 'Admin Moderator',
      actor_role: 'Operations Admin',
      action: status === 'verified' ? 'VERIFY_SELLER' : 'REJECT_SELLER',
      entity: 'seller_profiles',
      entity_id: sellerId,
      details: `Updated verification status to '${status}'. Remarks: ${remarks || 'None'}`,
      timestamp: new Date().toISOString(),
    });

    return true;
  },

  // Fetch Orders
  async getOrders(statusFilter?: string): Promise<Order[]> {
    try {
      const url = statusFilter && statusFilter !== 'all' ? `${API_BASE}/admin/orders?status=${statusFilter}` : `${API_BASE}/admin/orders`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.orders) && json.orders.length > 0) {
          return json.orders.map((o: any) => ({
            ...o,
            items: o.items || o.order_items || [],
          }));
        }
      }
    } catch {
      // Fallback
    }

    if (statusFilter && statusFilter !== 'all') {
      return mockOrders.filter((o) => o.status === statusFilter);
    }
    return mockOrders;
  },

  // Override Order Status
  async overrideOrderStatus(orderId: string, newStatus: Order['status'], reason: string): Promise<boolean> {
    try {
      await fetch(`${API_BASE}/admin/orders/${orderId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason }),
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      // Local fallback
    }

    const order = mockOrders.find((o) => o.id === orderId);
    if (order) {
      order.status = newStatus;
      mockAuditLogs.unshift({
        id: `aud-${Date.now()}`,
        actor_name: 'Admin Moderator',
        actor_role: 'Operations Admin',
        action: 'ORDER_OVERRIDE',
        entity: 'orders',
        entity_id: orderId,
        details: `Overrode order state to '${newStatus}'. Reason: ${reason}`,
        timestamp: new Date().toISOString(),
      });
      return true;
    }
    return true;
  },



  // Fetch Payouts
  async getPayouts(): Promise<PayoutRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/admin/payouts`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.payouts) && json.payouts.length > 0) {
          return json.payouts;
        }
      }
    } catch {
      // Fallback
    }
    return mockPayouts;
  },

  // Trigger Batch Payout
  async disbursePayout(payoutId: string): Promise<{ utr: string }> {
    let utr = `UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const res = await fetch(`${API_BASE}/admin/payouts/${payoutId}/disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.utr) utr = json.utr;
      }
    } catch {
      // Local fallback
    }

    const payout = mockPayouts.find((p) => p.id === payoutId);
    if (payout) {
      payout.status = 'processed';
      payout.utr_ref = utr;
      payout.disbursed_at = new Date().toISOString();

      mockAuditLogs.unshift({
        id: `aud-${Date.now()}`,
        actor_name: 'Finance Admin',
        actor_role: 'Super Admin',
        action: 'DISBURSE_PAYOUT',
        entity: 'seller_payouts',
        entity_id: payoutId,
        details: `Disbursed ₹${payout.amount.toLocaleString('en-IN')} to ${payout.seller_name}. UTR: ${utr}`,
        timestamp: new Date().toISOString(),
      });
    }
    return { utr };
  },

  // Fetch Audit Logs with Live Filtering & Search
  async getAuditLogs(filters?: { search?: string; action?: string; entity?: string }): Promise<AuditLog[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.action && filters.action !== 'all') params.append('action', filters.action);
      if (filters?.entity && filters.entity !== 'all') params.append('entity', filters.entity);
      params.append('limit', '150');

      const res = await fetch(`${API_BASE}/admin/audit-logs?${params.toString()}`, {
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.logs) && json.logs.length > 0) {
          return json.logs;
        }
      }
    } catch {
      // Local fallback
    }

    let logs = [...mockAuditLogs];
    if (filters?.action && filters.action !== 'all') {
      logs = logs.filter((l) => l.action.toLowerCase() === filters.action!.toLowerCase());
    }
    if (filters?.entity && filters.entity !== 'all') {
      logs = logs.filter((l) => l.entity.toLowerCase() === filters.entity!.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.actor_name.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.entity.toLowerCase().includes(q) ||
          l.entity_id.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          (l.actor_id && l.actor_id.toLowerCase().includes(q))
      );
    }
    return logs;
  },

  // Record Audit Log Entry directly
  async recordAuditLog(entry: {
    action: string;
    entity: string;
    entity_id: string;
    details: string;
    metadata?: Record<string, any>;
    actor_id?: string;
    actor_name?: string;
    actor_role?: string;
  }): Promise<AuditLog> {
    try {
      const res = await fetch(`${API_BASE}/admin/audit-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': entry.actor_id || 'adm-console-01',
          'x-admin-name': entry.actor_name || 'Admin Officer (Utkarsh)',
          'x-admin-role': entry.actor_role || 'Super Admin',
        },
        body: JSON.stringify(entry),
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.log) {
          mockAuditLogs.unshift(json.log);
          return json.log;
        }
      }
    } catch {
      // Local fallback
    }

    const localLog: AuditLog = {
      id: `aud-${Date.now()}`,
      actor_id: entry.actor_id || 'adm-console-01',
      actor_name: entry.actor_name || 'Admin Officer (Utkarsh)',
      actor_role: entry.actor_role || 'Super Admin',
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entity_id,
      details: entry.details,
      timestamp: new Date().toISOString(),
      metadata: entry.metadata,
    };
    mockAuditLogs.unshift(localLog);
    return localLog;
  },
};

