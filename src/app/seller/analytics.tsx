import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, TrendingUp, Users, ShoppingBag, Eye } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../lib/haptics';

export default function SellerAnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();

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
        <Text style={styles.headerTitle}>{t('analytics')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Revenue Chart Overview */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <View>
              <Text style={styles.chartPeriod}>This Month (September 2026)</Text>
              <Text style={styles.chartTotal}>₹45,000</Text>
            </View>
            <View style={styles.growthBadge}>
              <TrendingUp size={12} color={COLORS.success} />
              <Text style={styles.growthText}>+24.5%</Text>
            </View>
          </View>

          {/* Visual Bar Chart */}
          <View style={styles.barGraph}>
            {[
              { day: 'Mon', height: 40, val: '₹3k' },
              { day: 'Tue', height: 65, val: '₹6k' },
              { day: 'Wed', height: 95, val: '₹9k' }, // Haat day
              { day: 'Thu', height: 50, val: '₹4k' },
              { day: 'Fri', height: 70, val: '₹7k' },
              { day: 'Sat', height: 110, val: '₹12k' }, // Haat day
              { day: 'Sun', height: 45, val: '₹4k' },
            ].map((bar, i) => (
              <View key={i} style={styles.barColumn}>
                <Text style={styles.barValText}>{bar.val}</Text>
                <View style={[styles.barFill, { height: bar.height }]} />
                <Text style={styles.barLabel}>{bar.day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reach & Impression Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: COLORS.primaryLight }]}>
              <Eye size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>1,840</Text>
            <Text style={styles.statLabel}>Local Views</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: COLORS.secondaryLight }]}>
              <Users size={18} color={COLORS.secondary} />
            </View>
            <Text style={styles.statNumber}>142</Text>
            <Text style={styles.statLabel}>Repeat Buyers</Text>
          </View>
        </View>

        {/* Top Performing Local Items */}
        <Text style={styles.sectionTitle}>
          {language === 'as' ? 'শীৰ্ষ বিক্ৰী হোৱা সামগ্ৰী' : 'Top Selling Products'}
        </Text>

        <View style={styles.topList}>
          <View style={styles.topItemCard}>
            <Text style={styles.rankNum}>1</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.topItemTitle}>Kola Joha Aromatic Rice</Text>
              <Text style={styles.topItemSub}>180 kg sold this month</Text>
            </View>
            <Text style={styles.topItemRev}>₹21,600</Text>
          </View>

          <View style={styles.topItemCard}>
            <Text style={styles.rankNum}>2</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.topItemTitle}>Handwoven Pure Muga Silk Mekhela Sador</Text>
              <Text style={styles.topItemSub}>2 sets sold</Text>
            </View>
            <Text style={styles.topItemRev}>₹17,000</Text>
          </View>

          <View style={styles.topItemCard}>
            <Text style={styles.rankNum}>3</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.topItemTitle}>Sun-dried Organic Bhut Jolokia</Text>
              <Text style={styles.topItemSub}>42 packs sold</Text>
            </View>
            <Text style={styles.topItemRev}>₹6,300</Text>
          </View>
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
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  chartPeriod: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chartTotal: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.text,
    marginTop: 2,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.success,
  },
  barGraph: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: 10,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValText: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  barFill: {
    width: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  topList: {
    gap: 10,
  },
  topItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 12,
  },
  rankNum: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    width: 20,
  },
  topItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  topItemSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  topItemRev: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
});
