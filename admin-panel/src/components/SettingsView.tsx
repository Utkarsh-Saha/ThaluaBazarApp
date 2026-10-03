import React from 'react';
import { Sliders, Database, Bell, Shield, CheckCircle, Server } from 'lucide-react';
import { Language } from '../i18n';

interface SettingsViewProps {
  lang: Language;
  backendOnline: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ backendOnline }) => {
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
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
              Direct SHG Collective Commission Rate
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="text"
                disabled
                value="0.0% (Subsidized for Assam Rural Livelihood Mission)"
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
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
              Commercial Producer Commission Rate
            </label>
            <input
              type="text"
              disabled
              value="4.0% (Covers digital gateway + logistics)"
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>
              Default Geolocation Match Radius
            </label>
            <input
              type="text"
              disabled
              value="15 km (PostGIS ST_DWithin Indexing)"
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#f8fafc',
              }}
            />
          </div>
        </div>
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
