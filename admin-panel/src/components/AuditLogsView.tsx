import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  History,
  Terminal,
  Table as TableIcon,
  Search,
  RefreshCw,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  Sliders,
  Shield,
  Eye,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  Radio,
  Clock,
  User,
} from 'lucide-react';
import { AuditLog } from '../services/api';
import { AdminLogger } from '../services/adminLogger';
import { Language } from '../i18n';

interface AuditLogsViewProps {
  logs: AuditLog[];
  lang: Language;
  onRefresh?: () => void;
}

type CategoryFilter = 'ALL' | 'KYC' | 'ORDERS' | 'PAYOUTS' | 'LISTINGS' | 'CONFIG';
type ViewMode = 'terminal' | 'table';

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs: initialLogs, lang, onRefresh }) => {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('terminal');
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testEventFiring, setTestEventFiring] = useState(false);

  // Sync with prop updates
  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  // Subscribe to real-time logs generated within this session
  useEffect(() => {
    const unsubscribe = AdminLogger.subscribe((newLog) => {
      setLogs((prev) => {
        // Avoid duplicate by id
        if (prev.some((l) => l.id === newLog.id)) return prev;
        return [newLog, ...prev];
      });
    });
    return unsubscribe;
  }, []);

  // Live Auto-Refresh polling if enabled
  useEffect(() => {
    if (!isLiveStreaming || !onRefresh) return;
    const timer = setInterval(() => {
      onRefresh();
    }, 8000);
    return () => clearInterval(timer);
  }, [isLiveStreaming, onRefresh]);

  // Handle Manual Refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Helper to copy JSON metadata to clipboard
  const copyMetadata = (log: AuditLog) => {
    const payload = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(payload);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to trigger a live test event
  const fireTestEvent = async () => {
    setTestEventFiring(true);
    try {
      await AdminLogger.log(
        'CONFIG_UPDATED',
        'system_config',
        'payout_threshold_inr',
        'Updated minimum seller auto-settlement payout limit from ₹500 to ₹250.',
        {
          param: 'min_payout_amount',
          old_val: 500,
          new_val: 250,
          triggered_by: 'Admin Console Live Simulation',
        }
      );
      if (onRefresh) onRefresh();
    } finally {
      setTestEventFiring(false);
    }
  };

  // Export audit logs as JSON file
  const exportLogsAsJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `thaluwa_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export audit logs as CSV file
  const exportLogsAsCsv = () => {
    const headers = ['Timestamp', 'Action', 'Entity', 'Entity_ID', 'Actor_Name', 'Actor_ID', 'Actor_Role', 'Details'];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.action}"`,
      `"${l.entity}"`,
      `"${l.entity_id}"`,
      `"${l.actor_name}"`,
      `"${l.actor_id || ''}"`,
      `"${l.actor_role}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', encodeURI(csvContent));
    downloadAnchor.setAttribute('download', `thaluwa_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filter logs based on category and search query
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (categoryFilter === 'KYC') {
        const isKyc = log.action.includes('SELLER') || log.action.includes('USER');
        if (!isKyc) return false;
      } else if (categoryFilter === 'ORDERS') {
        if (!log.action.includes('ORDER')) return false;
      } else if (categoryFilter === 'PAYOUTS') {
        if (!log.action.includes('PAYOUT')) return false;
      } else if (categoryFilter === 'LISTINGS') {
        if (!log.action.includes('LISTING')) return false;
      } else if (categoryFilter === 'CONFIG') {
        const isConfig = log.action.includes('CONFIG') || log.action.includes('SECURITY') || log.action.includes('PLATFORM');
        if (!isConfig) return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchActor = (log.actor_name || '').toLowerCase().includes(q) || (log.actor_id || '').toLowerCase().includes(q);
      const matchAction = (log.action || '').toLowerCase().includes(q);
      const matchEntity = (log.entity || '').toLowerCase().includes(q) || (log.entity_id || '').toLowerCase().includes(q);
      const matchDetails = (log.details || '').toLowerCase().includes(q);
      const matchMeta = log.metadata ? JSON.stringify(log.metadata).toLowerCase().includes(q) : false;

      return matchActor || matchAction || matchEntity || matchDetails || matchMeta;
    });
  }, [logs, categoryFilter, searchQuery]);

  // Statistics counters
  const stats = useMemo(() => {
    return {
      total: logs.length,
      approvals: logs.filter((l) => l.action.includes('VERIF') || l.action.includes('APPROV')).length,
      overrides: logs.filter((l) => l.action.includes('OVERRIDE')).length,
      payouts: logs.filter((l) => l.action.includes('PAYOUT')).length,
      config: logs.filter((l) => l.action.includes('CONFIG') || l.action.includes('SECURITY')).length,
    };
  }, [logs]);

  // Helper for action badge classes
  const getActionBadgeClass = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('VERIF') || act.includes('APPROV')) return 'action-badge-verify';
    if (act.includes('REJECT') || act.includes('SUSPEND') || act.includes('FLAG')) return 'action-badge-reject';
    if (act.includes('OVERRIDE')) return 'action-badge-override';
    if (act.includes('PAYOUT')) return 'action-badge-payout';
    if (act.includes('CONFIG') || act.includes('SECURITY')) return 'action-badge-config';
    return 'action-badge-general';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Top Banner & Quick Metrics */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={14} color="#0d5c3a" /> Total Audit Logs
          </div>
          <div className="metric-value">{stats.total}</div>
          <div className="metric-subtext">Platform ledger records</div>
        </div>

        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} color="#10b981" /> KYC Approvals
          </div>
          <div className="metric-value" style={{ color: '#10b981' }}>
            {stats.approvals}
          </div>
          <div className="metric-subtext">Verified seller credentials</div>
        </div>

        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={14} color="#f59e0b" /> Order Overrides
          </div>
          <div className="metric-value" style={{ color: '#f59e0b' }}>
            {stats.overrides}
          </div>
          <div className="metric-subtext">Manual dispute transitions</div>
        </div>

        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CreditCard size={14} color="#2563eb" /> Payout Disbursals
          </div>
          <div className="metric-value" style={{ color: '#2563eb' }}>
            {stats.payouts}
          </div>
          <div className="metric-subtext">NEFT/UPI settled batches</div>
        </div>

        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sliders size={14} color="#a855f7" /> Config Changes
          </div>
          <div className="metric-value" style={{ color: '#a855f7' }}>
            {stats.config}
          </div>
          <div className="metric-subtext">System policy revisions</div>
        </div>
      </div>

      {/* Main Console Container */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Console Toolbar Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {/* Left: Title & Live indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: '#ecfdf5',
                color: '#0d5c3a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Terminal size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                  Admin Operations & Audit Console
                </span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    backgroundColor: isLiveStreaming ? '#ecfdf5' : '#f1f5f9',
                    border: `1px solid ${isLiveStreaming ? '#a7f3d0' : '#cbd5e1'}`,
                  }}
                >
                  {isLiveStreaming && <span className="live-pulse" />}
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: isLiveStreaming ? '#059669' : '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {isLiveStreaming ? 'Live Stream Active' : 'Stream Paused'}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Immutable cryptographically-sequenced audit ledger with real-time actor tracking
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* View Mode Toggle */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#f1f5f9',
                borderRadius: 8,
                padding: 2,
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                onClick={() => setViewMode('terminal')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'terminal' ? '#0f172a' : 'transparent',
                  color: viewMode === 'terminal' ? '#38bdf8' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                <Terminal size={13} />
                <span>Console</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'table' ? '#ffffff' : 'transparent',
                  color: viewMode === 'table' ? '#0f172a' : '#64748b',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <TableIcon size={13} />
                <span>Table</span>
              </button>
            </div>

            {/* Live Toggle */}
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}
              title={isLiveStreaming ? 'Pause real-time streaming' : 'Resume real-time streaming'}
            >
              <Radio size={13} color={isLiveStreaming ? '#10b981' : '#64748b'} />
              <span>{isLiveStreaming ? 'Pause' : 'Resume'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              onClick={handleManualRefresh}
              className="btn btn-outline btn-sm"
              disabled={isRefreshing}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem' }}
            >
              <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            {/* Fire Test Event */}
            <button
              onClick={fireTestEvent}
              disabled={testEventFiring}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', borderColor: '#c084fc', color: '#7e22ce' }}
              title="Dispatches a live configuration update audit log"
            >
              <Sparkles size={13} />
              <span>{testEventFiring ? 'Firing...' : 'Test Event'}</span>
            </button>

            {/* Export Dropdown / Buttons */}
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={exportLogsAsJson}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                title="Export filtered logs as JSON"
              >
                <Download size={13} />
                <span>JSON</span>
              </button>
              <button
                onClick={exportLogsAsCsv}
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}
                title="Export filtered logs as CSV"
              >
                <Download size={13} />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          {/* Category Tabs */}
          <div className="filter-tabs" style={{ margin: 0 }}>
            {(
              [
                { id: 'ALL', label: 'All Events' },
                { id: 'KYC', label: 'Seller KYC' },
                { id: 'ORDERS', label: 'Orders' },
                { id: 'PAYOUTS', label: 'Payouts' },
                { id: 'LISTINGS', label: 'Listings' },
                { id: 'CONFIG', label: 'Config & System' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                className={`filter-tab ${categoryFilter === tab.id ? 'active' : ''}`}
                onClick={() => setCategoryFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: 280 }}>
            <Search
              size={14}
              color="#94a3b8"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by actor ID, action, entity, details..."
              style={{
                width: '100%',
                padding: '6px 10px 6px 32px',
                fontSize: '0.8rem',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Active Filter Summary Bar */}
        <div
          style={{
            padding: '8px 20px',
            backgroundColor: '#f1f5f9',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            color: '#64748b',
          }}
        >
          <div>
            Showing <strong style={{ color: '#0f172a' }}>{filteredLogs.length}</strong> of{' '}
            <strong style={{ color: '#0f172a' }}>{logs.length}</strong> events
            {searchQuery && <span> matching query "{searchQuery}"</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <User size={12} color="#0d5c3a" />
              <span>
                Active Session: <strong>{AdminLogger.getActor().name}</strong> ({AdminLogger.getActor().id})
              </span>
            </div>
            <span>•</span>
            <div>Auto-Sync: 8s</div>
          </div>
        </div>

        {/* View Mode 1: Terminal Console */}
        {viewMode === 'terminal' && (
          <div className="terminal-card" style={{ border: 'none', borderRadius: 0 }}>
            <div className="terminal-header">
              <div className="terminal-dots">
                <span className="terminal-dot red" />
                <span className="terminal-dot yellow" />
                <span className="terminal-dot green" />
                <span style={{ marginLeft: 8, fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                  bash — audit-ledger@thaluwa-bazar:~# stream-tail --format=json
                </span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                Tip: Click any log line to toggle structured JSON metadata inspection
              </div>
            </div>

            <div className="terminal-screen">
              {filteredLogs.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
                  <Terminal size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <div>No administrative events matched the active filter or query.</div>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const formattedTime = new Date(log.timestamp).toLocaleTimeString('en-IN', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <div key={log.id}>
                      <div
                        className={`terminal-row ${isExpanded ? 'expanded' : ''}`}
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                      >
                        <span style={{ color: '#3b82f6', userSelect: 'none' }}>
                          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </span>
                        <span className="terminal-time">[{formattedTime}]</span>
                        <span className={`terminal-action-badge ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                        <span className="terminal-actor">
                          {log.actor_name}{' '}
                          <span style={{ color: '#0284c7', fontSize: '0.68rem' }}>
                            [{log.actor_id || 'adm-01'}]
                          </span>
                        </span>
                        <span className="terminal-entity">
                          @{log.entity}/{log.entity_id}
                        </span>
                        <span className="terminal-msg">{log.details}</span>
                      </div>

                      {/* Expandable JSON Metadata Inspector */}
                      {isExpanded && (
                        <div className="json-drawer">
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 8,
                              borderBottom: '1px solid #1e293b',
                              paddingBottom: 6,
                            }}
                          >
                            <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                              Log Payload :: {log.id}
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyMetadata(log);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'rgba(255,255,255,0.08)',
                                  border: '1px solid #334155',
                                  borderRadius: 4,
                                  color: copiedId === log.id ? '#34d399' : '#cbd5e1',
                                  padding: '2px 8px',
                                  fontSize: '0.7rem',
                                  cursor: 'pointer',
                                }}
                              >
                                {copiedId === log.id ? <Check size={11} /> : <Copy size={11} />}
                                <span>{copiedId === log.id ? 'Copied' : 'Copy JSON'}</span>
                              </button>
                            </div>
                          </div>
                          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {JSON.stringify(
                              {
                                log_id: log.id,
                                timestamp: log.timestamp,
                                action: log.action,
                                actor: {
                                  id: log.actor_id || 'adm_utkarsh_01',
                                  name: log.actor_name,
                                  role: log.actor_role,
                                },
                                target: {
                                  entity: log.entity,
                                  entity_id: log.entity_id,
                                },
                                summary: log.details,
                                metadata: log.metadata || {},
                                network: {
                                  ip: log.ip_address || '127.0.0.1 (Internal Admin Proxy)',
                                  user_agent: log.user_agent || navigator.userAgent,
                                },
                              },
                              null,
                              2
                            )}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* View Mode 2: Structured Table */}
        {viewMode === 'table' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 170 }}>Timestamp</th>
                  <th style={{ width: 180 }}>Administrator (ID)</th>
                  <th style={{ width: 160 }}>Action Event</th>
                  <th style={{ width: 160 }}>Target Entity</th>
                  <th>Action Details & Reason</th>
                  <th style={{ width: 80, textAlign: 'center' }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px 0', color: '#64748b' }}>
                      No audit records found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    const dateObj = new Date(log.timestamp);
                    const formattedDate = dateObj.toLocaleDateString();
                    const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          style={{
                            backgroundColor: isExpanded ? '#f8fafc' : 'transparent',
                            cursor: 'pointer',
                          }}
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        >
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.78rem', color: '#0f172a' }}>
                              {formattedDate}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 3 }}>
                              <Clock size={11} />
                              <span>{formattedTime}</span>
                            </div>
                          </td>

                          <td>
                            <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>
                              {log.actor_name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#0d5c3a', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>{log.actor_role}</span>
                              <span style={{ color: '#94a3b8' }}>•</span>
                              <code style={{ fontSize: '0.68rem', backgroundColor: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
                                {log.actor_id || 'adm-01'}
                              </code>
                            </div>
                          </td>

                          <td>
                            <span className={`terminal-action-badge ${getActionBadgeClass(log.action)}`}>
                              {log.action}
                            </span>
                          </td>

                          <td>
                            <span className="status-pill under_review" style={{ fontSize: '0.72rem' }}>
                              {log.entity} #{log.entity_id.slice(-6)}
                            </span>
                          </td>

                          <td>
                            <div style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 500 }}>
                              {log.details}
                            </div>
                          </td>

                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedLogId(isExpanded ? null : log.id);
                              }}
                            >
                              <Eye size={12} />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Drawer row in table */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} style={{ backgroundColor: '#0f172a', padding: '16px 20px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: 10,
                                }}
                              >
                                <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '0.82rem' }}>
                                  Full Audit Record Metadata (ID: {log.id})
                                </span>
                                <button
                                  onClick={() => copyMetadata(log)}
                                  className="btn btn-outline btn-sm"
                                  style={{
                                    fontSize: '0.72rem',
                                    color: copiedId === log.id ? '#34d399' : '#cbd5e1',
                                    borderColor: '#334155',
                                  }}
                                >
                                  {copiedId === log.id ? <Check size={12} /> : <Copy size={12} />}
                                  <span>{copiedId === log.id ? 'Copied' : 'Copy JSON'}</span>
                                </button>
                              </div>

                              <pre
                                style={{
                                  color: '#93c5fd',
                                  fontSize: '0.75rem',
                                  backgroundColor: '#030712',
                                  padding: 12,
                                  borderRadius: 6,
                                  margin: 0,
                                  overflowX: 'auto',
                                }}
                              >
                                {JSON.stringify(
                                  {
                                    id: log.id,
                                    timestamp: log.timestamp,
                                    action: log.action,
                                    actor: {
                                      id: log.actor_id || 'adm_utkarsh_01',
                                      name: log.actor_name,
                                      role: log.actor_role,
                                    },
                                    entity: log.entity,
                                    entity_id: log.entity_id,
                                    details: log.details,
                                    metadata: log.metadata || {},
                                    ip_address: log.ip_address || '127.0.0.1',
                                  },
                                  null,
                                  2
                                )}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
