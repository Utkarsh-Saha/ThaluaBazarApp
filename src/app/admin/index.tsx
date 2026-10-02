import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Users,
  Store,
  ShoppingBag,
  IndianRupee,
  ShieldCheck,
  Check,
  X,
  Sparkles,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useOrders } from '../../context/OrderContext';
import { triggerHaptic } from '../../lib/haptics';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { orders } = useOrders();

  const [pendingSellers, setPendingSellers] = useState([
    {
      id: 'sel-p1',
      name: 'Brahmaputra Organic Mustard Co-op',
      district: 'Morigaon',
      shgCode: 'AS-MRG-SHG-2024-102',
      type: 'SHG Member',
    },
    {
      id: 'sel-p2',
      name: 'Nagaon Bell Metal Artisans',
      district: 'Nagaon',
      shgCode: 'AS-NGN-ART-2023-455',
      type: 'Small Business',
    },
  ]);

  const handleApprove = (id: string) => {
    triggerHaptic('success');
    setPendingSellers((prev) => prev.filter((s) => s.id !== id));
    Alert.alert('Approved', 'Seller profile verified and badge awarded.');
  };

  const handleReject = (id: string) => {
    triggerHaptic('warning');
    setPendingSellers((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('adminDashboard')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Platform Overview Metrics 2x2 Grid (Matching Flow E) */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Users size={20} color={COLORS.primary} />
            <Text style={styles.metricValue}>2,568</Text>
            <Text style={styles.metricLabel}>{t('totalUsers')}</Text>
          </View>

          <View style={styles.metricCard}>
            <Store size={20} color={COLORS.secondary} />
            <Text style={styles.metricValue}>452</Text>
            <Text style={styles.metricLabel}>{t('totalSellers')}</Text>
          </View>

          <View style={styles.metricCard}>
            <ShoppingBag size={20} color={COLORS.accent} />
            <Text style={styles.metricValue}>1,258</Text>
            <Text style={styles.metricLabel}>{language === 'as' ? 'মুঠ অৰ্ডাৰ' : 'Total Orders'}</Text>
          </View>

          <View style={styles.metricCard}>
            <IndianRupee size={20} color={COLORS.success} />
            <Text style={styles.metricValue}>₹2,45,680</Text>
            <Text style={styles.metricLabel}>{t('platformGMV')}</Text>
          </View>
        </View>

        {/* Pending Approvals Queue */}
        <Text style={styles.sectionTitle}>{t('approvalsQueue')}</Text>
        {pendingSellers.length === 0 ? (
          <View style={styles.allClearedBox}>
            <ShieldCheck size={20} color={COLORS.success} />
            <Text style={styles.allClearedText}>All pending sellers have been approved!</Text>
          </View>
        ) : (
          pendingSellers.map((seller) => (
            <View key={seller.id} style={styles.pendingCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingName}>{seller.name}</Text>
                <Text style={styles.pendingSub}>
                  📍 {seller.district} • {seller.type}
                </Text>
                <Text style={styles.pendingCode}>{seller.shgCode}</Text>
              </View>

              <View style={styles.actionBtns}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(seller.id)}
                >
                  <Check size={16} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleReject(seller.id)}
                >
                  <X size={16} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Top Sellers */}
        <Text style={styles.sectionTitle}>{t('topSellers')}</Text>
        <View style={styles.topSellersList}>
          {[
            { name: '1. XYZ SHG Collective', rev: '₹25,100', loc: 'Darrang' },
            { name: '2. Green Farms Producer Co.', rev: '₹18,250', loc: 'Sonitpur' },
            { name: '3. Assam Handloom Crafts', rev: '₹14,800', loc: 'Kamrup' },
          ].map((top, idx) => (
            <View key={idx} style={styles.topSellerRow}>
              <View>
                <Text style={styles.topSellerName}>{top.name}</Text>
                <Text style={styles.topSellerLoc}>📍 {top.loc}</Text>
              </View>
              <Text style={styles.topSellerRev}>{top.rev}</Text>
            </View>
          ))}
        </View>

        {/* Recent Orders Stream */}
        <Text style={styles.sectionTitle}>{t('recentOrders')}</Text>
        <View style={styles.recentOrdersList}>
          {orders.slice(0, 3).map((ord) => (
            <View key={ord.id} style={styles.orderRow}>
              <View>
                <Text style={styles.orderRowNumber}>{ord.order_number}</Text>
                <Text style={styles.orderRowBuyer}>{ord.buyer_name}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.orderRowTotal}>₹{ord.total}</Text>
                <Text style={styles.orderRowStatus}>{ord.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    gap: 4,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  pendingName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  pendingSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pendingCode: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  approveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allClearedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.successLight,
    padding: 12,
    borderRadius: 12,
  },
  allClearedText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '700',
  },
  topSellersList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
  },
  topSellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSellerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  topSellerLoc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  topSellerRev: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  recentOrdersList: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  orderRowNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  orderRowBuyer: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  orderRowTotal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  orderRowStatus: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
  },
});
