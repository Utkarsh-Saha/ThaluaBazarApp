import React from 'react';
import { History, Shield, UserCheck, Sliders, AlertCircle } from 'lucide-react';
import { AuditLog } from '../services/api';
import { Language } from '../i18n';

interface AuditLogsViewProps {
  logs: AuditLog[];
  lang: Language;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <History size={18} color="#0d5c3a" />
          <span>Immutable Platform Audit Trail</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
          Real-time record of all administrative decisions & overrides
        </div>
      </div>

      <div className="panel-body" style={{ padding: 0 }}>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrative Actor</th>
                <th>Action</th>
                <th>Target Entity</th>
                <th>Change Details & Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#64748b' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{log.actor_name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#0d5c3a' }}>{log.actor_role}</div>
                  </td>
                  <td>
                    <code style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                      {log.action}
                    </code>
                  </td>
                  <td>
                    <span className="status-pill under_review">
                      {log.entity} #{log.entity_id.slice(-6)}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.82rem', color: '#334155' }}>{log.details}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
