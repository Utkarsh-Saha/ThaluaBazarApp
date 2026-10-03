import React, { useState } from 'react';
import {
  CreditCard,
  IndianRupee,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Download,
  Building,
  RefreshCw,
} from 'lucide-react';
import { PayoutRecord } from '../services/api';
import { Language, translations } from '../i18n';

interface PayoutsViewProps {
  payouts: PayoutRecord[];
  lang: Language;
  onDisburse: (payoutId: string) => void;
}

export const PayoutsView: React.FC<PayoutsViewProps> = ({
  payouts,
  lang,
  onDisburse,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'processed'>('all');

  const filteredPayouts = payouts.filter((p) => {
    if (activeTab === 'pending') return p.status === 'pending';
    if (activeTab === 'processed') return p.status === 'processed';
    return true;
  });

  const pendingTotal = payouts
    .filter((p) => p.status === 'pending')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const processedTotal = payouts
    .filter((p) => p.status === 'processed')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div>
      {/* Summary Cards */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
        <div className="metric-card amber">
          <div className="metric-header">
            <div className="metric-icon-box amber">
              <Clock size={20} />
            </div>
            <span className="status-pill pending">Awaiting Monday Run</span>
          </div>
          <div>
            <div className="metric-value">₹{pendingTotal.toLocaleString('en-IN')}</div>
            <div className="metric-label">Pending SHG Bank Disbursals</div>
          </div>
          <div className="metric-sub">
            {payouts.filter((p) => p.status === 'pending').length} Producers queued
          </div>
        </div>

        <div className="metric-card green">
          <div className="metric-header">
            <div className="metric-icon-box green">
              <CheckCircle size={20} />
            </div>
            <span className="status-pill verified">Settled</span>
          </div>
          <div>
            <div className="metric-value">₹{processedTotal.toLocaleString('en-IN')}</div>
            <div className="metric-label">Total Disbursed This Month</div>
          </div>
          <div className="metric-sub">Direct NEFT / UPI to SHG accounts</div>
        </div>

        <div className="metric-card blue">
          <div className="metric-header">
            <div className="metric-icon-box blue">
              <Building size={20} />
            </div>
            <span className="status-pill under_review">0% Direct SHG Fee</span>
          </div>
          <div>
            <div className="metric-value">₹0 Commission</div>
            <div className="metric-label">Rural Producer Subsidy</div>
          </div>
          <div className="metric-sub">100% of product sales go to rural SHGs</div>
        </div>
      </div>

      {/* Settlement Table */}
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <CreditCard size={18} color="#0d5c3a" />
            <span>Weekly Producer Payout Ledger</span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => alert('Exporting settlement CSV report for Bank Manager...')}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="panel-body" style={{ padding: 0 }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Producer / SHG Account</th>
                  <th>Bank Account & IFSC</th>
                  <th>Settlement Amount</th>
                  <th>UTR / Transaction Ref</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.seller_name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        Created: {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div><code>{p.bank_account}</code></div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>IFSC: {p.ifsc}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0d5c3a' }}>
                        ₹{p.amount.toLocaleString('en-IN')}
                      </div>
                    </td>
                    <td>
                      {p.utr_ref ? (
                        <code style={{ color: '#065f46', fontWeight: 700 }}>{p.utr_ref}</code>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Awaiting Trigger</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${p.status}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {p.status === 'pending' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => onDisburse(p.id)}
                        >
                          <CheckCircle size={13} />
                          <span>Disburse</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>
                          ✓ Disbursed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
