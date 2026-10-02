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
  IndianRupee,
  ArrowUpRight,
  ShieldCheck,
  Building,
  CheckCircle2,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../lib/haptics';

export default function SellerEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { sellerProfile } = useAuth();

  const [availableBalance, setAvailableBalance] = useState(23630);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = () => {
    triggerHaptic('success');
    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      Alert.alert(
        'Payout Initiated',
        `₹${availableBalance.toLocaleString()} has been queued for transfer to ${
          sellerProfile?.upi_id || 'producer@okaxis'
        }. Settlement takes 15-30 minutes.`
      );
      setAvailableBalance(0);
    }, 800);
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
        <Text style={styles.headerTitle}>{t('earnings')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>
            {language === 'as' ? 'উপাৰ্জনৰ ধন (Available Balance)' : 'Available for Payout'}
          </Text>
          <Text style={styles.balanceAmount}>₹{availableBalance.toLocaleString()}</Text>

          <View style={styles.bankLinkRow}>
            <Building size={14} color={COLORS.primary} />
            <Text style={styles.bankLinkText}>
              Linked to {sellerProfile?.upi_id || 'pragjyotishpur@okaxis'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.withdrawBtn, availableBalance === 0 && styles.disabledWithdrawBtn]}
            onPress={handleWithdraw}
            disabled={availableBalance === 0 || isWithdrawing}
            activeOpacity={0.88}
          >
            <ArrowUpRight size={18} color="#FFFFFF" />
            <Text style={styles.withdrawBtnText}>
              {isWithdrawing
                ? 'Processing...'
                : language === 'as'
                ? 'বেংকলৈ ধন স্থানান্তৰ কৰক'
                : 'Withdraw to Bank / UPI'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* History Breakdown */}
        <Text style={styles.sectionTitle}>
          {language === 'as' ? 'সাম্প্ৰতিক লেনদেন' : 'Recent Payout History'}
        </Text>

        <View style={styles.historyList}>
          <View style={styles.historyCard}>
            <View style={styles.historyLeft}>
              <View style={styles.historyIconBox}>
                <IndianRupee size={16} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.historyTitle}>Weekly Automatic Settlement</Text>
                <Text style={styles.historyDate}>28 Sep 2026, 11:30 AM</Text>
              </View>
            </View>
            <View style={styles.historyRight}>
              <Text style={styles.historyAmount}>+₹14,200</Text>
              <Text style={styles.historyStatus}>Completed</Text>
            </View>
          </View>

          <View style={styles.historyCard}>
            <View style={styles.historyLeft}>
              <View style={styles.historyIconBox}>
                <IndianRupee size={16} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.historyTitle}>Direct Instant Payout</Text>
                <Text style={styles.historyDate}>21 Sep 2026, 04:15 PM</Text>
              </View>
            </View>
            <View style={styles.historyRight}>
              <Text style={styles.historyAmount}>+₹9,850</Text>
              <Text style={styles.historyStatus}>Completed</Text>
            </View>
          </View>
        </View>

        <View style={styles.complianceBox}>
          <ShieldCheck size={16} color={COLORS.success} />
          <Text style={styles.complianceText}>
            100% Direct Producer Settlement with 0% hidden middleman commissions.
          </Text>
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
  balanceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.md,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.primary,
    marginVertical: 8,
  },
  bankLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  bankLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  withdrawBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
  },
  disabledWithdrawBtn: {
    backgroundColor: COLORS.textMuted,
  },
  withdrawBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.success,
  },
  historyStatus: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  complianceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.successLight,
    padding: 12,
    borderRadius: 12,
  },
  complianceText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
    flex: 1,
  },
});
