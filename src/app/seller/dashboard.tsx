import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  BackHandler,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PlusCircle,
  Package,
  ShoppingBag,
  IndianRupee,
  TrendingUp,
  Headphones,
  Bell,
  CheckCircle2,
  Globe,
  ArrowRight,
  ShieldCheck,
  Power,
  Store,
  Crown,
  FileText,
  MessageCircle,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { triggerHaptic } from '../../lib/haptics';

export default function SellerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.floor((screenWidth - 32 - 12) / 2);
  const { language, toggleLanguage, t } = useLanguage();
  const { sellerProfile, toggleSellerOnline, switchRole } = useAuth();
  const { sellerOrders } = useOrders();

  const requestedOrdersCount = sellerOrders.filter((o) => o.status === 'REQUESTED').length;
  const isOnline = sellerProfile?.is_online ?? true;

  useEffect(() => {
    const onBackPress = () => {
      // Main dashboard is root; prevent hardware back button from navigating back to auth
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  const handleToggleStatus = () => {
    triggerHaptic('medium');
    toggleSellerOnline();
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingTitle}>
            {language === 'as' ? 'নমস্কাৰ, ' : 'Hello, '}
            {sellerProfile?.business_name || (language === 'as' ? 'উৎপাদক' : 'Producer')} 🌾
          </Text>
          <Text style={styles.sellerCode}>
            {sellerProfile?.shg_code
              ? `SHG Code: ${sellerProfile.shg_code}`
              : sellerProfile?.village
              ? `${sellerProfile.village}, ${sellerProfile.district}`
              : (language === 'as' ? 'পঞ্জীভুক্ত বিক্ৰেতা' : 'Registered Producer')}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.messagesBtn}
            onPress={() => {
              triggerHaptic('light');
              router.push('/messages');
            }}
          >
            <MessageCircle size={15} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.langBtn}
            onPress={() => {
              triggerHaptic('light');
              toggleLanguage();
            }}
          >
            <Globe size={14} color={COLORS.primary} />
            <Text style={styles.langText}>
              {language === 'en' ? 'অসমীয়া' : 'English'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buyerSwitchBtn}
            onPress={() => {
              triggerHaptic('medium');
              switchRole('buyer');
              router.push('/(tabs)/explore');
            }}
          >
            <ShoppingBag size={14} color="#FFFFFF" />
            <Text style={styles.buyerSwitchText}>Buyer App</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Availability Toggle Card */}
        <View style={[styles.statusCard, isOnline ? styles.onlineCard : styles.offlineCard]}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.success : COLORS.error }]} />
            <View>
              <Text style={styles.statusLabel}>{t('liveStatus')}</Text>
              <Text style={styles.statusValue}>
                {isOnline ? t('openForOrders') : t('closedForOrders')}
              </Text>
            </View>
          </View>

          <Switch
            value={isOnline}
            onValueChange={handleToggleStatus}
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={isOnline ? COLORS.primary : '#FFFFFF'}
          />
        </View>

        {/* Verification Status Banner if pending */}
        {sellerProfile?.verification_status === 'pending' && (
          <TouchableOpacity
            style={styles.verificationBanner}
            onPress={() => router.push('/seller/verification')}
          >
            <ShieldCheck size={18} color={COLORS.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.verificationTitle}>KYC Verification Pending</Text>
              <Text style={styles.verificationSubtitle}>
                Documents submitted and under review by district coordinator.
              </Text>
            </View>
            <ArrowRight size={16} color={COLORS.secondary} />
          </TouchableOpacity>
        )}

        {/* Key Metrics Row */}
        <View style={styles.metricsRow}>
          {/* Today's Sales */}
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>{t('todaysSales')}</Text>
            <Text style={styles.metricValue}>₹{sellerProfile?.today_sales ?? 0}</Text>
            <Text style={styles.metricSub}>{language === 'as' ? 'আজিৰ উপাৰ্জন' : "Today's Revenue"}</Text>
          </View>

          {/* Incoming Orders */}
          <TouchableOpacity
            style={[styles.metricBox, requestedOrdersCount > 0 && styles.activeOrdersBox]}
            onPress={() => router.push('/seller/orders')}
          >
            <Text style={styles.metricLabel}>{t('totalOrders')}</Text>
            <Text style={[styles.metricValue, requestedOrdersCount > 0 && { color: COLORS.secondary }]}>
              {requestedOrdersCount > 0 ? `${requestedOrdersCount} New` : sellerOrders.length}
            </Text>
            <Text style={styles.metricSub}>
              {requestedOrdersCount > 0 ? 'Tap to accept' : (language === 'as' ? 'সকলো অৰ্ডাৰ প্ৰেৰণ কৰা হৈছে' : 'All dispatched')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Seller Subscription / Membership Status Banner */}
        <TouchableOpacity
          style={styles.subscriptionBanner}
          onPress={() => {
            triggerHaptic('light');
            router.push('/seller/subscription');
          }}
          activeOpacity={0.88}
        >
          <View style={styles.subBannerLeft}>
            <View style={styles.subCrownCircle}>
              <Crown size={20} color={COLORS.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.subTitleRow}>
                <Text style={styles.subBannerTitle}>
                  {language === 'as' ? 'বিক্ৰেতা সদস্যপদ' : 'Producer Membership'}
                </Text>
                <View style={styles.subActiveBadge}>
                  <Text style={styles.subActiveBadgeText}>Active • ₹20/mo</Text>
                </View>
              </View>
              <Text style={styles.subBannerSubtitle}>
                {language === 'as'
                  ? 'বেছিক উৎপাদক প্লেন • বৈধতা: ১০ নৱেম্বৰ ২০২৬'
                  : 'Basic Producer Plan • Valid till 10 Nov 2026'}
              </Text>
            </View>
          </View>
          <View style={styles.subManageBtn}>
            <Text style={styles.subManageBtnText}>
              {language === 'as' ? 'নবীকৰণ' : 'Manage'}
            </Text>
            <ArrowRight size={13} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Main Action Shortcuts Grid */}
        <Text style={styles.sectionHeading}>
          {language === 'as' ? 'ব্যৱসায়িক কেন্দ্ৰ' : 'Producer Operations'}
        </Text>

        <View style={styles.operationsGrid}>
          {/* 1. Add Product */}
          <TouchableOpacity
            style={[styles.gridCard, { width: cardWidth }]}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/add-product');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.gridIconBox, { backgroundColor: COLORS.primaryLight }]}>
                <PlusCircle size={22} color={COLORS.primary} />
              </View>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.gridCardTitle} numberOfLines={1}>{t('addProduct')}</Text>
              <Text style={styles.gridCardSubtitle} numberOfLines={1}>
                {language === 'as' ? 'নতুন ফচল যোগ কৰক' : 'List new produce'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 2. My Products */}
          <TouchableOpacity
            style={[styles.gridCard, { width: cardWidth }]}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/products');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.gridIconBox, { backgroundColor: COLORS.secondaryLight }]}>
                <Package size={22} color={COLORS.secondary} />
              </View>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.gridCardTitle} numberOfLines={1}>{t('myProducts')}</Text>
              <Text style={styles.gridCardSubtitle} numberOfLines={1}>
                {language === 'as' ? 'মজুত আৰু তালিকা' : 'Inventory & catalog'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 3. Orders */}
          <TouchableOpacity
            style={[styles.gridCard, { width: cardWidth }]}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/orders');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.gridIconBox, { backgroundColor: COLORS.accentLight }]}>
                <ShoppingBag size={22} color={COLORS.accent} />
              </View>
              {requestedOrdersCount > 0 && (
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{requestedOrdersCount} NEW</Text>
                </View>
              )}
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.gridCardTitle} numberOfLines={1}>{t('orders')}</Text>
              <Text style={styles.gridCardSubtitle} numberOfLines={1}>
                {requestedOrdersCount > 0
                  ? (language === 'as' ? 'নতুন অৰ্ডাৰ গ্ৰহণ কৰক' : `${requestedOrdersCount} pending orders`)
                  : (language === 'as' ? 'অৰ্ডাৰ পৰিচালনা' : 'Dispatch & tracking')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 4. Earnings */}
          <TouchableOpacity
            style={[styles.gridCard, { width: cardWidth }]}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/earnings');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.gridIconBox, { backgroundColor: COLORS.successLight }]}>
                <IndianRupee size={22} color={COLORS.success} />
              </View>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.gridCardTitle} numberOfLines={1}>{t('earnings')}</Text>
              <Text style={styles.gridCardSubtitle} numberOfLines={1}>
                {language === 'as' ? 'বেংক আৰু ধন তোলা' : 'Payouts & ledger'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 5. Analytics */}
          <TouchableOpacity
            style={[styles.gridCard, { width: cardWidth }]}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/analytics');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.gridIconBox, { backgroundColor: '#F3E8FF' }]}>
                <TrendingUp size={22} color="#8B5CF6" />
              </View>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.gridCardTitle} numberOfLines={1}>{t('analytics')}</Text>
              <Text style={styles.gridCardSubtitle} numberOfLines={1}>
                {language === 'as' ? 'বিক্ৰীৰ প্ৰতিবেদন' : 'Sales performance'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 6. Support / KYC */}
          <TouchableOpacity
            style={[styles.gridCard, { width: cardWidth }]}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/verification');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.gridIconBox, { backgroundColor: COLORS.warningLight }]}>
                <ShieldCheck size={22} color={COLORS.warning} />
              </View>
              {sellerProfile?.verification_status === 'verified' && (
                <View style={[styles.cardBadge, { backgroundColor: COLORS.successLight }]}>
                  <Text style={[styles.cardBadgeText, { color: COLORS.success }]}>✓</Text>
                </View>
              )}
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.gridCardTitle} numberOfLines={1}>
                {language === 'as' ? 'কেৱাইচি স্থিতি' : 'KYC Verification'}
              </Text>
              <Text style={styles.gridCardSubtitle} numberOfLines={1}>
                {sellerProfile?.verification_status === 'verified'
                  ? (language === 'as' ? 'প্ৰমাণিত উৎপাদক' : 'Verified Producer')
                  : (language === 'as' ? 'পৰীক্ষাধীন' : 'Under Review')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 7. Seller Subscription */}
          <TouchableOpacity
            style={[styles.gridCard, { width: cardWidth }]}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/subscription');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.gridIconBox, { backgroundColor: '#FFF6E0' }]}>
                <Crown size={22} color={COLORS.secondary} />
              </View>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.gridCardTitle} numberOfLines={1}>
                {language === 'as' ? 'সদস্যপদ প্লেন' : 'Membership'}
              </Text>
              <Text style={styles.gridCardSubtitle} numberOfLines={1}>
                {language === 'as' ? 'সদস্যপদ নবীকৰণ' : 'Active • ₹20/mo'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* 8. Documents & Certificates */}
          <TouchableOpacity
            style={[styles.gridCard, { width: cardWidth }]}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/documents');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.cardTopRow}>
              <View style={[styles.gridIconBox, { backgroundColor: '#E0F2FE' }]}>
                <FileText size={22} color="#0284C7" />
              </View>
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.gridCardTitle} numberOfLines={1}>
                {language === 'as' ? 'নথিপত্ৰ আপলোড' : 'Documents & ID'}
              </Text>
              <Text style={styles.gridCardSubtitle} numberOfLines={1}>
                {language === 'as' ? 'প্ৰমাণপত্ৰ আৰু ফটো' : 'Certificates & Proofs'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Incoming Orders Alert Box */}
        {requestedOrdersCount > 0 && (
          <View style={styles.incomingAlertCard}>
            <View style={styles.alertHeader}>
              <Bell size={18} color={COLORS.secondary} />
              <Text style={styles.alertTitle}>
                {language === 'as'
                  ? 'নতুন অৰ্ডাৰ গ্ৰহণৰ বাবে অপেক্ষা কৰি আছে!'
                  : 'New Orders Waiting For Confirmation!'}
              </Text>
            </View>
            <Text style={styles.alertDesc}>
              {language === 'as'
                ? 'এতিয়াই গ্ৰহণ কৰক যাতে পেকেট সাজু কৰিব পাৰি।'
                : 'Accept incoming order to send real-time confirmation to the local buyer.'}
            </Text>
            <TouchableOpacity
              style={styles.viewOrdersBtn}
              onPress={() => router.push('/seller/orders')}
            >
              <Text style={styles.viewOrdersBtnText}>{t('orders')} →</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  headerLeft: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  sellerCode: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messagesBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
  },
  langText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  buyerSwitchBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  buyerSwitchText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  onlineCard: {
    borderColor: 'rgba(19, 117, 71, 0.3)',
  },
  offlineCard: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.secondaryLight,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(198, 139, 23, 0.3)',
  },
  verificationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  verificationSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  activeOrdersBox: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondaryLight,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.text,
    marginVertical: 4,
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 6,
  },
  operationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  gridCard: {
    minHeight: 118,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  gridIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBadge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cardBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBottom: {
    width: '100%',
    marginTop: 10,
  },
  gridCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  gridCardSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  incomingAlertCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginTop: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
    flex: 1,
  },
  alertDesc: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 6,
    lineHeight: 18,
  },
  viewOrdersBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewOrdersBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  subscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF5',
    borderWidth: 1.5,
    borderColor: 'rgba(198, 139, 23, 0.35)',
    borderRadius: 16,
    padding: 14,
    ...SHADOWS.sm,
  },
  subBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  subCrownCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF6E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  subBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  subActiveBadge: {
    backgroundColor: 'rgba(19, 117, 71, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(19, 117, 71, 0.25)',
  },
  subActiveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subBannerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  subManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  subManageBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
