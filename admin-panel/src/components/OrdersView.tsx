import React, { useState } from 'react';
import {
  Package,
  Search,
  Eye,
  AlertCircle,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { Order } from '../services/api';
import { Language, translations } from '../i18n';

interface OrdersViewProps {
  orders: Order[];
  lang: Language;
  onOverrideStatus: (orderId: string, newStatus: Order['status'], reason: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  lang,
  onOverrideStatus,
}) => {
  const t = translations[lang];
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [overrideModal, setOverrideModal] = useState(false);
  const [newStatus, setNewStatus] = useState<Order['status']>('COMPLETED');
  const [overrideReason, setOverrideReason] = useState('');

  const filteredOrders = orders.filter((order) => {
    if (activeStatus !== 'all' && order.status !== activeStatus) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        order.order_number.toLowerCase().includes(q) ||
        order.buyer_name.toLowerCase().includes(q) ||
        order.seller_name.toLowerCase().includes(q) ||
        order.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statuses: { key: string; label: string }[] = [
    { key: 'all', label: 'All Orders' },
    { key: 'REQUESTED', label: 'Requested' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div>
      {/* Filter and Search */}
      <div className="filter-bar">
        <div className="filter-tabs">
          {statuses.map((st) => (
            <button
              key={st.key}
              className={`filter-tab ${activeStatus === st.key ? 'active' : ''}`}
              onClick={() => setActiveStatus(st.key)}
            >
              {st.label} (
              {st.key === 'all'
                ? orders.length
                : orders.filter((o) => o.status === st.key).length}
              )
            </button>
          ))}
        </div>

        <div className="filter-controls">
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Order #, Buyer, Seller..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <Package size={18} color="#2563eb" />
            <span>Global Order Ledger & Moderation</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Buyer Details</th>
                  <th>Producer / Seller</th>
                  <th>Delivery & Payment</th>
                  <th>Amount</th>
                  <th>State Machine Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                      No orders found matching the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{ord.order_number}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {new Date(ord.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{ord.buyer_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{ord.buyer_phone}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0d5c3a' }}>{ord.seller_name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>📍 {ord.district}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                          {ord.pickup_or_delivery === 'pickup' ? '🏬 Haat Pickup' : '🚚 Doorstep Delivery'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          Method: <strong>{ord.payment_method}</strong> ({ord.payment_status})
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>₹{ord.total}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          Items: ₹{ord.subtotal} {ord.delivery_fee > 0 && `+ ₹${ord.delivery_fee} fee`}
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${ord.status.toLowerCase()}`}>
                          {ord.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            title="Inspect Order"
                            onClick={() => setSelectedOrder(ord)}
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            title="Override State"
                            onClick={() => {
                              setSelectedOrder(ord);
                              setOverrideModal(true);
                            }}
                          >
                            <SlidersHorizontal size={13} />
                            <span>Override</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && !overrideModal && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={20} color="#2563eb" />
                <span>Order Manifest: {selectedOrder.order_number}</span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedOrder(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Fulfillment Status</div>
                  <span className={`status-pill ${selectedOrder.status.toLowerCase()}`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Value</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0d5c3a' }}>
                    ₹{selectedOrder.total}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: 8 }}>
                  Items Ordered
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid #f1f5f9' : 'none',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{item.title}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Qty: {item.quantity} × ₹{item.unit_price}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800 }}>₹{item.line_total}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parties */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="card">
                  <div className="card-title">👤 Buyer Details</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{selectedOrder.buyer_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📞 {selectedOrder.buyer_phone}</div>
                </div>
                <div className="card">
                  <div className="card-title">🏬 Producer / Seller</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{selectedOrder.seller_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📍 {selectedOrder.district}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelectedOrder(null)}>
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setOverrideModal(true);
                }}
              >
                <SlidersHorizontal size={14} />
                <span>Administrative Override</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Modal */}
      {overrideModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setOverrideModal(false)}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                Override State: {selectedOrder.order_number}
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setOverrideModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                  Target State Machine Status
                </label>
                <select
                  className="filter-select"
                  style={{ width: '100%' }}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Order['status'])}
                >
                  <option value="ACCEPTED">ACCEPTED (Force Accept by Moderator)</option>
                  <option value="READY_FOR_PICKUP">READY_FOR_PICKUP (Item At Haat Hub)</option>
                  <option value="COMPLETED">COMPLETED (Delivery Confirmed)</option>
                  <option value="CANCELLED">CANCELLED (Cancelled with Refund)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                  Reason for Override (Recorded in Immutable Audit Log)
                </label>
                <textarea
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 8,
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                  placeholder="E.g., Customer verified receipt at Mangaldai weekly haat counter."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setOverrideModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onOverrideStatus(selectedOrder.id, newStatus, overrideReason);
                  setOverrideModal(false);
                  setSelectedOrder(null);
                }}
              >
                Apply State Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
