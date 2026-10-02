import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
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
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { triggerHaptic } from '../../lib/haptics';

export default function SellerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, toggleLanguage, t } = useLanguage();
  const { sellerProfile, toggleSellerOnline, switchRole } = useAuth();
  const { sellerOrders } = useOrders();

  const requestedOrdersCount = sellerOrders.filter((o) => o.status === 'REQUESTED').length;
  const isOnline = sellerProfile?.is_online ?? true;

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
            {sellerProfile?.business_name || 'Pragjyotishpur SHG'} 🌾
          </Text>
          <Text style={styles.sellerCode}>
            SHG Code: {sellerProfile?.shg_code || 'AS-DRG-SHG-2023-889'}
          </Text>
        </View>

        <View style={styles.headerRight}>
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
            <Text style={styles.metricValue}>₹{sellerProfile?.today_sales || '2,450'}</Text>
            <Text style={styles.metricSub}>+18% from yesterday</Text>
          </View>

          {/* Incoming Orders */}
          <TouchableOpacity
            style={[styles.metricBox, requestedOrdersCount > 0 && styles.activeOrdersBox]}
            onPress={() => router.push('/seller/orders')}
          >
            <Text style={styles.metricLabel}>{t('totalOrders')}</Text>
            <Text style={[styles.metricValue, requestedOrdersCount > 0 && { color: COLORS.secondary }]}>
              {requestedOrdersCount > 0 ? `${requestedOrdersCount} New` : '12'}
            </Text>
            <Text style={styles.metricSub}>
              {requestedOrdersCount > 0 ? 'Tap to accept' : 'All dispatched'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Main Action Shortcuts Grid (Matching UI Flow C) */}
        <Text style={styles.sectionHeading}>
          {language === 'as' ? 'ব্যৱসায়িক কেন্দ্ৰ' : 'Producer Operations'}
        </Text>

        <View style={styles.grid}>
          {/* 1. Add Product */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/add-product');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconBox, { backgroundColor: COLORS.primaryLight }]}>
              <PlusCircle size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.gridCardTitle}>{t('addProduct')}</Text>
          </TouchableOpacity>

          {/* 2. My Products */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/products');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconBox, { backgroundColor: COLORS.secondaryLight }]}>
              <Package size={24} color={COLORS.secondary} />
            </View>
            <Text style={styles.gridCardTitle}>{t('myProducts')}</Text>
          </TouchableOpacity>

          {/* 3. Orders */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/orders');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconBox, { backgroundColor: COLORS.accentLight }]}>
              <ShoppingBag size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.gridCardTitle}>{t('orders')}</Text>
          </TouchableOpacity>

          {/* 4. Earnings */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/earnings');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconBox, { backgroundColor: COLORS.successLight }]}>
              <IndianRupee size={24} color={COLORS.success} />
            </View>
            <Text style={styles.gridCardTitle}>{t('earnings')}</Text>
          </TouchableOpacity>

          {/* 5. Analytics */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/analytics');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconBox, { backgroundColor: '#F3E8FF' }]}>
              <TrendingUp size={24} color="#8B5CF6" />
            </View>
            <Text style={styles.gridCardTitle}>{t('analytics')}</Text>
          </TouchableOpacity>

          {/* 6. Support */}
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => {
              triggerHaptic('light');
              router.push('/seller/verification');
            }}
            activeOpacity={0.8}
          >
            <View style={[styles.gridIconBox, { backgroundColor: COLORS.warningLight }]}>
              <ShieldCheck size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.gridCardTitle}>KYC & Docs</Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '31%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    gap: 8,
  },
  gridIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
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
});
