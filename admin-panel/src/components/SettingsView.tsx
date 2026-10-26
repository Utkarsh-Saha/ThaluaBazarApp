import React, { useState } from 'react';
import { Sliders, Database, Bell, Shield, CheckCircle, Server, Save, Check } from 'lucide-react';
import { Language } from '../i18n';
import { AdminLogger } from '../services/adminLogger';

interface SettingsViewProps {
  lang: Language;
  backendOnline: boolean;
  onConfigUpdated?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ backendOnline, onConfigUpdated }) => {
  const [shgCommission, setShgCommission] = useState('0.0% (Subsidized)');
  const [producerCommission, setProducerCommission] = useState('4.0%');
  const [geoRadius, setGeoRadius] = useState('15');
  const [minPayout, setMinPayout] = useState('500');
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await AdminLogger.logConfigChange(
        'marketplace_commission_matrix',
        { shg: '0.0%', commercial: '4.0%', radius: 15, min_payout: 500 },
        { shg: shgCommission, commercial: producerCommission, radius: Number(geoRadius), min_payout: Number(minPayout) },
        `Updated operational parameters: Commercial commission ${producerCommission}, Geo-match radius ${geoRadius}km, Min payout ₹${minPayout}.`
      );

      setIsSaved(true);
      if (onConfigUpdated) onConfigUpdated();
      setTimeout(() => setIsSaved(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {/* Platform Parameters */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <Sliders size={18} color="#0d5c3a" />
            <span>Marketplace Commission & Subsidy Engine</span>
          </div>
        </div>
        <form onSubmit={handleSave} className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
              Direct SHG Collective Commission Rate
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="text"
                disabled
                value={shgCommission}
                style={{
                  flex: 1,
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#f0fdf4',
                  fontWeight: 700,
                  color: '#166534',
                }}
              />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Subsidized 100% under Assam Rural Livelihood Mission (ARLM) mandate.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
              Commercial Producer Commission Rate
            </label>
            <input
              type="text"
              value={producerCommission}
              onChange={(e) => setProducerCommission(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontWeight: 600,
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Covers UPI payment gateway fee and cluster aggregation handling.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
              Default Geolocation Match Radius (km)
            </label>
            <input
              type="number"
              value={geoRadius}
              onChange={(e) => setGeoRadius(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontWeight: 600,
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              PostGIS ST_DWithin query radius for nearby buyer/seller discovery.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
              Minimum Payout Auto-Settlement Threshold (₹)
            </label>
            <input
              type="number"
              value={minPayout}
              onChange={(e) => setMinPayout(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                fontWeight: 600,
              }}
            />
          </div>

          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem' }}
            >
              {isSaved ? <Check size={16} /> : <Save size={16} />}
              <span>{isSaving ? 'Logging...' : isSaved ? 'Saved & Logged!' : 'Save & Log Configuration'}</span>
            </button>
            {isSaved && (
              <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>
                ✓ Logged to immutable audit trail!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Backend & Security Status */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <Server size={18} color="#2563eb" />
            <span>Infrastructure Health & Service Status</span>
          </div>
        </div>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 12,
              borderRadius: 8,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Node.js Express API</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>http://localhost:5000/api/v1</div>
            </div>
            <span className={`status-pill ${backendOnline ? 'verified' : 'rejected'}`}>
              {backendOnline ? '🟢 Connected (200 OK)' : '🟠 Offline (Using Demo Data)'}
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 12,
              borderRadius: 8,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Audit Logging Ledger Service</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>In-Memory + Disk + Supabase audit_logs sync</div>
            </div>
            <span className="status-pill verified">🟢 Real-Time Active</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 12,
              borderRadius: 8,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Supabase PostgreSQL + PostGIS</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Project: dhzoagvazmamigxobjcd.supabase.co</div>
            </div>
            <span className="status-pill verified">🟢 Schema V2 Active</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 12,
              borderRadius: 8,
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Expo Push Notification Dispatcher</div>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Bilingual (Assamese/English) Payloads</div>
            </div>
            <span className="status-pill verified">🟢 Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
