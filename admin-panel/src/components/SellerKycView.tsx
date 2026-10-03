import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  Building,
  Phone,
  CreditCard,
  MapPin,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { SellerProfile } from '../services/api';
import { Language, translations } from '../i18n';

interface SellerKycViewProps {
  sellers: SellerProfile[];
  lang: Language;
  onApproveSeller: (id: string) => void;
  onRejectSeller: (id: string, remarks?: string) => void;
  onReviewSeller: (id: string) => void;
}

export const SellerKycView: React.FC<SellerKycViewProps> = ({
  sellers,
  lang,
  onApproveSeller,
  onRejectSeller,
  onReviewSeller,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'under_review' | 'verified' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Filter logic
  const filteredSellers = sellers.filter((seller) => {
    if (activeTab !== 'all' && seller.verification_status !== activeTab) {
      return false;
    }
    if (districtFilter !== 'all' && seller.district !== districtFilter) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        seller.business_name.toLowerCase().includes(q) ||
        seller.shg_code.toLowerCase().includes(q) ||
        (seller.users?.name && seller.users.name.toLowerCase().includes(q)) ||
        (seller.users?.phone && seller.users.phone.includes(q))
      );
    }
    return true;
  });

  const districts = ['all', 'Darrang', 'Morigaon', 'Nagaon', 'Kamrup', 'Sonitpur'];

  return (
    <div>
      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Producers ({sellers.length})
          </button>
          <button
            className={`filter-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending ({sellers.filter((s) => s.verification_status === 'pending').length})
          </button>
          <button
            className={`filter-tab ${activeTab === 'under_review' ? 'active' : ''}`}
            onClick={() => setActiveTab('under_review')}
          >
            Under Review ({sellers.filter((s) => s.verification_status === 'under_review').length})
          </button>
          <button
            className={`filter-tab ${activeTab === 'verified' ? 'active' : ''}`}
            onClick={() => setActiveTab('verified')}
          >
            Verified ({sellers.filter((s) => s.verification_status === 'verified').length})
          </button>
          <button
            className={`filter-tab ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            Rejected ({sellers.filter((s) => s.verification_status === 'rejected').length})
          </button>
        </div>

        <div className="filter-controls">
          <div className="search-box" style={{ width: 240 }}>
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, SHG code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="all">📍 All Districts</option>
            {districts.filter((d) => d !== 'all').map((d) => (
              <option key={d} value={d}>
                {d} District
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <ShieldCheck size={18} color="#0d5c3a" />
            <span>KYC Verification & Producer Registry</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Showing {filteredSellers.length} of {sellers.length} registered producers
          </div>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producer / SHG Enterprise</th>
                  <th>Contact Person</th>
                  <th>District & Radius</th>
                  <th>SHG Registration Code</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSellers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
                      No producer profiles found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredSellers.map((seller) => (
                    <tr key={seller.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>
                          {seller.business_name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#0d5c3a', fontWeight: 600 }}>
                          ★ {seller.rating} • {seller.seller_type.replace('_', ' ').toUpperCase()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{seller.users?.name || 'Authorized Lead'}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {seller.users?.phone || 'N/A'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                          <MapPin size={12} color="#0d5c3a" />
                          <span>{seller.district}</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {seller.delivery_radius_km} km coverage
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: '0.78rem', fontWeight: 700 }}>
                          {seller.shg_code}
                        </code>
                      </td>
                      <td>
                        <span className={`status-pill ${seller.verification_status}`}>
                          {seller.verification_status === 'verified' && <CheckCircle size={12} />}
                          {seller.verification_status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            title="Inspect Documents"
                            onClick={() => setSelectedSeller(seller)}
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>

                          {seller.verification_status !== 'verified' && (
                            <button
                              className="btn btn-success btn-sm"
                              title="Verify & Award Badge"
                              onClick={() => onApproveSeller(seller.id)}
                            >
                              <CheckCircle size={13} />
                              <span>Verify</span>
                            </button>
                          )}

                          {seller.verification_status !== 'rejected' && (
                            <button
                              className="btn btn-danger btn-sm"
                              title="Reject"
                              onClick={() => {
                                setSelectedSeller(seller);
                                setShowRejectModal(true);
                              }}
                            >
                              <XCircle size={13} />
                            </button>
                          )}
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

      {/* Detail & Document Inspection Modal */}
      {selectedSeller && !showRejectModal && (
        <div className="modal-overlay" onClick={() => setSelectedSeller(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building size={20} color="#0d5c3a" />
                <span>Producer KYC Audit: {selectedSeller.business_name}</span>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedSeller(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Highlight Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 10,
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: '#166534', fontSize: '0.9rem' }}>
                    ASRLM Verification Registry
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                    SHG Code: <strong>{selectedSeller.shg_code}</strong>
                  </div>
                </div>
                <span className={`status-pill ${selectedSeller.verification_status}`}>
                  {selectedSeller.verification_status.toUpperCase()}
                </span>
              </div>

              {/* Grid details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="card">
                  <div className="card-title">📍 Address & Coverage</div>
                  <div style={{ fontSize: '0.8rem', color: '#334155' }}>
                    {selectedSeller.address || `${selectedSeller.district}, Assam`}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                    Delivery Radius: {selectedSeller.delivery_radius_km} km
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">👤 Authorized Contact</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                    {selectedSeller.users?.name || 'Primary Contact'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    📞 {selectedSeller.users?.phone || 'N/A'}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">🏦 Bank & Settlement Info</div>
                  <div style={{ fontSize: '0.8rem' }}>
                    Acc: <code>{selectedSeller.bank_account_no || '•••• 4589'}</code>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    IFSC: {selectedSeller.ifsc_code || 'SBIN0001234'}
                  </div>
                </div>

                <div className="card">
                  <div className="card-title">📱 Digital UPI ID</div>
                  <div style={{ fontSize: '0.8rem' }}>
                    <code>{selectedSeller.upi_id || 'seller@upi'}</code>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Direct Settlement Enabled
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => setSelectedSeller(null)}
              >
                Close
              </button>

              {selectedSeller.verification_status !== 'verified' && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    onApproveSeller(selectedSeller.id);
                    setSelectedSeller(null);
                  }}
                >
                  <CheckCircle size={16} />
                  <span>Approve & Award Gold Badge</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedSeller && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: '#ef4444' }}>
                Reject KYC Application
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowRejectModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', marginBottom: 12 }}>
                Please provide the rejection reason for{' '}
                <strong>{selectedSeller.business_name}</strong>. This feedback will be sent directly to the producer's phone via notification.
              </p>

              <textarea
                rows={4}
                style={{
                  width: '100%',
                  padding: 10,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem',
                  outline: 'none',
                }}
                placeholder="E.g., Invalid SHG registration number, unclear documentation, or mismatched bank account."
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => {
                  onRejectSeller(selectedSeller.id, rejectRemarks);
                  setShowRejectModal(false);
                  setSelectedSeller(null);
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
