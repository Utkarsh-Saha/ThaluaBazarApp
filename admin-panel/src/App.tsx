import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Package,
  Store,
  CreditCard,
  History,
  Sliders,
  Bell,
  RefreshCw,
  Globe,
  CheckCircle,
  XCircle,
  Menu,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  AdminApi,
  AdminStats,
  SellerProfile,
  Order,
  HaatMarket,
  PayoutRecord,
  AuditLog,
} from './services/api';
import { Language, translations } from './i18n';
import { DashboardView } from './components/DashboardView';
import { SellerKycView } from './components/SellerKycView';
import { OrdersView } from './components/OrdersView';
import { HaatMarketsView } from './components/HaatMarketsView';
import { PayoutsView } from './components/PayoutsView';
import { AuditLogsView } from './components/AuditLogsView';
import { SettingsView } from './components/SettingsView';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [lang, setLang] = useState<Language>('en');
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core state
  const [stats, setStats] = useState<AdminStats>({
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
  });

  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [haats, setHaats] = useState<HaatMarket[]>([]);
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);

  const t = translations[lang];

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load all platform data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const isOnline = await AdminApi.checkBackend();
      setBackendOnline(isOnline);

      const [statsData, sellersData, ordersData, haatsData, payoutsData, auditData] =
        await Promise.all([
          AdminApi.getStats(),
          AdminApi.getSellers(),
          AdminApi.getOrders(),
          AdminApi.getHaats(),
          AdminApi.getPayouts(),
          AdminApi.getAuditLogs(),
        ]);

      setStats(statsData);
      setSellers(sellersData);
      setOrders(ordersData);
      setHaats(haatsData);
      setPayouts(payoutsData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Approve Seller
  const handleApproveSeller = async (id: string) => {
    const success = await AdminApi.updateSellerStatus(id, 'verified');
    if (success) {
      showToast('🎉 Seller profile verified & Gold Badge awarded! Push notification dispatched.');
      loadData();
    }
  };

  // Handle Reject Seller
  const handleRejectSeller = async (id: string, remarks?: string) => {
    const success = await AdminApi.updateSellerStatus(id, 'rejected', remarks);
    if (success) {
      showToast('Seller application rejected. Notification sent with remarks.');
      loadData();
    }
  };

  // Handle Review Seller
  const handleReviewSeller = async (id: string) => {
    await AdminApi.updateSellerStatus(id, 'under_review');
    showToast('Application moved to Under Review.');
    loadData();
  };

  // Handle Order Override
  const handleOverrideOrder = async (orderId: string, newStatus: Order['status'], reason: string) => {
    const success = await AdminApi.overrideOrderStatus(orderId, newStatus, reason);
    if (success) {
      showToast(`Order status updated to ${newStatus} with audit record.`);
      loadData();
    }
  };

  // Handle Toggle Haat
  const handleToggleHaat = async (haatId: string) => {
    await AdminApi.toggleHaatStatus(haatId);
    showToast('Haat Hub operational status toggled.');
    loadData();
  };

  // Handle Disburse Payout
  const handleDisbursePayout = async (payoutId: string) => {
    const { utr } = await AdminApi.disbursePayout(payoutId);
    showToast(`Disbursed payout via NEFT. UTR Ref: ${utr}`);
    loadData();
  };

  const pendingCount = sellers.filter(
    (s) => s.verification_status === 'pending' || s.verification_status === 'under_review'
  ).length;

  return (
    <div className="app-container">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.85rem',
            fontWeight: 600,
            borderLeft: '4px solid #10b981',
            animation: 'slideUp 0.25s ease',
          }}
        >
          <Sparkles size={18} color="#10b981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="brand-box">
          <div className="brand-icon">
            <Store size={22} />
          </div>
          <div>
            <div className="brand-title">
              {lang === 'as' ? 'থলুৱা বজাৰ' : 'Thaluwa Bazar'}
            </div>
            <div className="brand-subtitle">
              {lang === 'as' ? 'প্ৰশাসন আৰু নিয়ন্ত্ৰণ' : 'Platform Operations'}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="nav-section">
          <div className="nav-label">Core Operations</div>

          <div
            className={`nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="nav-item-left">
              <LayoutDashboard size={18} />
              <span>{t.dashboard}</span>
            </div>
          </div>

          <div
            className={`nav-item ${currentTab === 'kyc' ? 'active' : ''}`}
            onClick={() => setCurrentTab('kyc')}
          >
            <div className="nav-item-left">
              <ShieldCheck size={18} />
              <span>{t.sellerKyc}</span>
            </div>
            {pendingCount > 0 && <span className="badge-count">{pendingCount}</span>}
          </div>

          <div
            className={`nav-item ${currentTab === 'orders' ? 'active' : ''}`}
            onClick={() => setCurrentTab('orders')}
          >
            <div className="nav-item-left">
              <Package size={18} />
              <span>{t.orders}</span>
            </div>
          </div>

          <div
            className={`nav-item ${currentTab === 'haats' ? 'active' : ''}`}
            onClick={() => setCurrentTab('haats')}
          >
            <div className="nav-item-left">
              <Store size={18} />
              <span>{t.haatHubs}</span>
            </div>
          </div>

          <div className="nav-label" style={{ marginTop: 12 }}>
            Financial & Governance
          </div>

          <div
            className={`nav-item ${currentTab === 'payouts' ? 'active' : ''}`}
            onClick={() => setCurrentTab('payouts')}
          >
            <div className="nav-item-left">
              <CreditCard size={18} />
              <span>{t.payouts}</span>
            </div>
          </div>

          <div
            className={`nav-item ${currentTab === 'audit' ? 'active' : ''}`}
            onClick={() => setCurrentTab('audit')}
          >
            <div className="nav-item-left">
              <History size={18} />
              <span>{t.auditLogs}</span>
            </div>
          </div>

          <div
            className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentTab('settings')}
          >
            <div className="nav-item-left">
              <Sliders size={18} />
              <span>{t.settings}</span>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: backendOnline ? '#10b981' : '#f59e0b',
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {backendOnline ? 'API Connected' : 'Demo State'}
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>v1.0.0</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Navigation Bar */}
        <header className="top-nav">
          <div className="top-left">
            <h1 className="page-heading">
              {currentTab === 'dashboard' && t.dashboard}
              {currentTab === 'kyc' && t.sellerKyc}
              {currentTab === 'orders' && t.orders}
              {currentTab === 'haats' && t.haatHubs}
              {currentTab === 'payouts' && t.payouts}
              {currentTab === 'audit' && t.auditLogs}
              {currentTab === 'settings' && t.settings}
            </h1>
          </div>

          <div className="top-right">
            {/* Backend Connection Pill */}
            <div className="backend-pill">
              <span className="pulse-dot" style={{ backgroundColor: backendOnline ? '#10b981' : '#f59e0b' }} />
              <span>{backendOnline ? t.backendConnected : t.backendOffline}</span>
            </div>

            {/* Language Switch */}
            <button
              className="lang-toggle-btn"
              onClick={() => setLang(lang === 'en' ? 'as' : 'en')}
              title="Toggle Language"
            >
              <Globe size={15} />
              <span>{lang === 'en' ? 'অসমীয়া' : 'English'}</span>
            </button>

            {/* Refresh Button */}
            <button
              className="refresh-btn"
              onClick={loadData}
              title="Refresh Platform Data"
              disabled={isLoading}
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>

            {/* User Profile */}
            <div className="user-profile-badge">
              <div className="user-avatar">AD</div>
              <div className="user-meta">
                <span className="user-name">Admin Officer</span>
                <span className="user-role">Super Moderator</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <div className="page-body">
          {currentTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              pendingSellers={sellers.filter(
                (s) => s.verification_status === 'pending' || s.verification_status === 'under_review'
              )}
              recentOrders={orders.slice(0, 5)}
              haats={haats}
              lang={lang}
              onApproveSeller={handleApproveSeller}
              onRejectSeller={handleRejectSeller}
              onSelectSeller={(seller) => {
                setSelectedSeller(seller);
                setCurrentTab('kyc');
              }}
              onNavigate={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'kyc' && (
            <SellerKycView
              sellers={sellers}
              lang={lang}
              onApproveSeller={handleApproveSeller}
              onRejectSeller={handleRejectSeller}
              onReviewSeller={handleReviewSeller}
            />
          )}

          {currentTab === 'orders' && (
            <OrdersView
              orders={orders}
              lang={lang}
              onOverrideStatus={handleOverrideOrder}
            />
          )}

          {currentTab === 'haats' && (
            <HaatMarketsView
              haats={haats}
              lang={lang}
              onToggleHaat={handleToggleHaat}
            />
          )}

          {currentTab === 'payouts' && (
            <PayoutsView
              payouts={payouts}
              lang={lang}
              onDisburse={handleDisbursePayout}
            />
          )}

          {currentTab === 'audit' && (
            <AuditLogsView
              logs={auditLogs}
              lang={lang}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              lang={lang}
              backendOnline={backendOnline}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
