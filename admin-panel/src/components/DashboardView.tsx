import React from 'react';
import {
  Users,
  Store,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Clock,
  Sparkles,
  MapPin,
  ChevronRight,
  Package,
} from 'lucide-react';
import { AdminStats, SellerProfile, Order, HaatMarket } from '../services/api';
import { Language, translations } from '../i18n';

interface DashboardViewProps {
  stats: AdminStats;
  pendingSellers: SellerProfile[];
  recentOrders: Order[];
  haats: HaatMarket[];
  lang: Language;
  onApproveSeller: (id: string) => void;
  onRejectSeller: (id: string) => void;
  onSelectSeller: (seller: SellerProfile) => void;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  pendingSellers,
  recentOrders,
  haats,
  lang,
  onApproveSeller,
  onRejectSeller,
  onSelectSeller,
  onNavigate,
}) => {
  const t = translations[lang];

  return (
    <div>
      {/* 2x2 / 4-Column Executive Metrics Grid */}
      <div className="metrics-grid">
        {/* Metric 1: Total Users */}
        <div className="metric-card green">
          <div className="metric-header">
            <div className="metric-icon-box green">
              <Users size={22} />
            </div>
            <div className="metric-growth up">
              <TrendingUp size={12} />
              <span>+18.4%</span>
            </div>
          </div>
          <div>
            <div className="metric-value">{stats.totalUsers.toLocaleString('en-IN')}</div>
            <div className="metric-label">{t.totalUsers}</div>
          </div>
          <div className="metric-sub">
            <span>2,116 Buyers</span> • <span>452 Producers</span>
          </div>
        </div>

        {/* Metric 2: Total Sellers & KYC */}
        <div className="metric-card amber">
          <div className="metric-header">
            <div className="metric-icon-box amber">
              <Store size={22} />
            </div>
            <div className="metric-growth up">
              <ShieldCheck size={12} />
              <span>{stats.verifiedSellers} Verified</span>
            </div>
          </div>
          <div>
            <div className="metric-value">{stats.totalSellers.toLocaleString('en-IN')}</div>
            <div className="metric-label">{t.totalSellers}</div>
          </div>
          <div className="metric-sub">
            <span style={{ color: '#d97706', fontWeight: 700 }}>
              {pendingSellers.length} pending KYC review
            </span>
          </div>
        </div>

        {/* Metric 3: Total Orders */}
        <div className="metric-card blue">
          <div className="metric-header">
            <div className="metric-icon-box blue">
              <ShoppingBag size={22} />
            </div>
            <div className="metric-growth up">
              <TrendingUp size={12} />
              <span>+12.6%</span>
            </div>
          </div>
          <div>
            <div className="metric-value">{stats.totalOrders.toLocaleString('en-IN')}</div>
            <div className="metric-label">{t.totalOrders}</div>
          </div>
          <div className="metric-sub">
            <span>{stats.completedOrders} Completed</span> • <span>138 Active</span>
          </div>
        </div>

        {/* Metric 4: Platform GMV */}
        <div className="metric-card purple">
          <div className="metric-header">
            <div className="metric-icon-box purple">
              <IndianRupee size={22} />
            </div>
            <div className="metric-growth up">
              <Sparkles size={12} />
              <span>Gross GMV</span>
            </div>
          </div>
          <div>
            <div className="metric-value">{stats.formattedGmv}</div>
            <div className="metric-label">{t.platformGmv}</div>
          </div>
          <div className="metric-sub">
            <span>Avg Order ₹218</span> • <span>Assam Rural Volume</span>
          </div>
        </div>
      </div>

      {/* Main Row: KYC Queue + Market Analytics */}
      <div className="dashboard-grid-2">
        {/* Pending KYC Approvals Queue */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <ShieldCheck size={18} color="#0d5c3a" />
              <span>{t.pendingSellers}</span>
              {pendingSellers.length > 0 && (
                <span className="badge-count" style={{ marginLeft: 6 }}>
                  {pendingSellers.length} Action Needed
                </span>
              )}
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('kyc')}
            >
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="panel-body" style={{ padding: 0 }}>
            {pendingSellers.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#166534' }}>
                <CheckCircle size={36} style={{ margin: '0 auto 8px', color: '#10b981' }} />
                <div style={{ fontWeight: 700 }}>All Pending Sellers Verified!</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  No pending KYC applications in the moderation queue.
                </div>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Producer / SHG</th>
                      <th>District</th>
                      <th>SHG Code</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSellers.slice(0, 4).map((seller) => (
                      <tr key={seller.id}>
                        <td>
                          <div
                            style={{ fontWeight: 700, cursor: 'pointer', color: '#0d5c3a' }}
                            onClick={() => onSelectSeller(seller)}
                          >
                            {seller.business_name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {seller.users?.name || 'Authorized Lead'}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={12} color="#64748b" />
                            <span>{seller.district}</span>
                          </div>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {seller.shg_code}
                          </code>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              seller.seller_type === 'shg_member' ? 'verified' : 'under_review'
                            }`}
                          >
                            {seller.seller_type === 'shg_member' ? 'SHG Collective' : 'Producer'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-success btn-sm"
                              title="Approve & Award Badge"
                              onClick={() => onApproveSeller(seller.id)}
                            >
                              <CheckCircle size={14} />
                              <span>Verify</span>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              title="Reject Application"
                              onClick={() => onRejectSeller(seller.id)}
                            >
                              <XCircle size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Haat Hub Status */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <Store size={18} color="#d97706" />
              <span>{t.haatHubs}</span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('haats')}
            >
              <span>Manage</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {haats.map((haat) => (
                <div
                  key={haat.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 10,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {lang === 'as' ? haat.name_as : haat.name_en}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      📍 {haat.district} • {haat.market_day}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`status-pill ${haat.is_active ? 'verified' : 'rejected'}`}>
                      {haat.is_active ? 'Active Hub' : 'Inactive'}
                    </span>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                      {haat.active_stalls_count} Stalls
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Orders Stream & Top Performing Producers */}
      <div className="dashboard-grid-2">
        {/* Recent Order Stream */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <Package size={18} color="#2563eb" />
              <span>{t.orders}</span>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onNavigate('orders')}
            >
              <span>View All Orders</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="panel-body" style={{ padding: 0 }}>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Buyer</th>
                    <th>Seller</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{ord.order_number}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ord.buyer_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{ord.buyer_phone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0d5c3a' }}>{ord.seller_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>📍 {ord.district}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800 }}>₹{ord.total}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{ord.payment_method}</div>
                      </td>
                      <td>
                        <span className={`status-pill ${ord.status.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Top Performing SHGs */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <Sparkles size={18} color="#7c3aed" />
              <span>Top SHG Collectives</span>
            </div>
          </div>

          <div className="panel-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Sualkuchi Silk Weavers Guild', rev: '₹48,500', loc: 'Kamrup', rating: 5.0 },
                { name: 'Brahmaputra Organic Mustard', rev: '₹34,200', loc: 'Morigaon', rating: 4.8 },
                { name: 'Kharupetia Agri Collective', rev: '₹28,400', loc: 'Darrang', rating: 4.8 },
                { name: 'Nagaon Bell Metal Artisans', rev: '₹22,100', loc: 'Nagaon', rating: 4.9 },
              ].map((top, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderBottom: idx < 3 ? '1px solid #f1f5f9' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: idx === 0 ? '#fef3c7' : '#f1f5f9',
                        color: idx === 0 ? '#b45309' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.75rem',
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{top.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        📍 {top.loc} • ★ {top.rating}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: '#0d5c3a', fontSize: '0.88rem' }}>
                    {top.rev}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
