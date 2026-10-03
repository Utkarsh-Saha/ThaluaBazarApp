import React, { useState } from 'react';
import {
  Store,
  MapPin,
  Calendar,
  UserCheck,
  Phone,
  CheckCircle,
  XCircle,
  Plus,
  Clock,
  Sparkles,
} from 'lucide-react';
import { HaatMarket } from '../services/api';
import { Language, translations } from '../i18n';

interface HaatMarketsViewProps {
  haats: HaatMarket[];
  lang: Language;
  onToggleHaat: (id: string) => void;
}

export const HaatMarketsView: React.FC<HaatMarketsViewProps> = ({
  haats,
  lang,
  onToggleHaat,
}) => {
  const t = translations[lang];
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div>
      <div className="filter-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>
            Weekly Rural Haat Aggregation Hubs
          </div>
          <span className="badge-count" style={{ backgroundColor: '#ecfdf5', color: '#065f46' }}>
            {haats.filter((h) => h.is_active).length} Active Hubs
          </span>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          <span>Register New Haat Hub</span>
        </button>
      </div>

      {/* Haat Market Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
        {haats.map((haat) => (
          <div key={haat.id} className="panel-card">
            <div className="panel-header">
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                  {haat.name_en}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#0d5c3a', fontWeight: 700 }}>
                  {haat.name_as}
                </div>
              </div>
              <span className={`status-pill ${haat.is_active ? 'verified' : 'rejected'}`}>
                {haat.is_active ? 'Active Market' : 'Inactive'}
              </span>
            </div>

            <div className="panel-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                  <MapPin size={15} color="#0d5c3a" />
                  <span>{haat.location}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem' }}>
                  <Calendar size={15} color="#d97706" />
                  <span style={{ fontWeight: 600 }}>{haat.market_day}</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    marginTop: 4,
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Assigned Coordinator</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700 }}>{haat.coordinator_name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>📞 {haat.coordinator_phone}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Stalls Active</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0d5c3a' }}>
                      {haat.active_stalls_count}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="panel-footer"
              style={{
                padding: '10px 16px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#fbfcfe',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                District: <strong>{haat.district}</strong>
              </span>
              <button
                className={`btn btn-sm ${haat.is_active ? 'btn-danger' : 'btn-success'}`}
                onClick={() => onToggleHaat(haat.id)}
              >
                {haat.is_active ? 'Deactivate' : 'Activate Hub'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Register Weekly Haat Market</div>
              <button className="btn btn-outline btn-sm" onClick={() => setShowAddModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                  Haat Name (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sipajhar Sunday Organic Market"
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                  Haat Name (Assamese)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ছিপাজাৰ দেওবৰীয়া জৈৱিক হাট"
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                  Market Schedule Days
                </label>
                <input
                  type="text"
                  placeholder="e.g. Every Sunday & Thursday"
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                  Assigned Haat Coordinator & Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hemanta Kalita (+91 98640 11223)"
                  style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  alert('New Haat Hub registered successfully and geolocated.');
                  setShowAddModal(false);
                }}
              >
                Save & Broadcast
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
