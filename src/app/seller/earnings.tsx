import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
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
  Clock,
  RefreshCw,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { triggerHaptic } from '../../lib/haptics';
import { supabase } from '../../lib/supabase';
import { SellerPayout } from '../../types';

export default function SellerEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { sellerProfile, user } = useAuth();
  const { sellerOrders } = useOrders();

  const sellerId = sellerProfile?.id || user?.id;
  const targetUpi = sellerProfile?.upi_id || 'pragjyotishpur@okaxis';

  const [payouts, setPayouts] = useState<SellerPayout[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  // Compute Revenue Totals
  const completedOrdersSales = sellerOrders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const grossRevenue = Math.max(completedOrdersSales, Number(sellerProfile?.today_sales || 0));

  const totalDisbursed = payouts
    .filter((p) => p.status === 'processed')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalPending = payouts
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const availableBalance = Math.max(0, grossRevenue - totalDisbursed - totalPending);

  const fetchPayouts = useCallback(async () => {
    try {
      if (!sellerId) {
        setPayouts([]);
        return;
      }

      const { data, error } = await supabase
        .from('seller_payouts')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Error fetching payouts:', error);
      } else if (data) {
        setPayouts(
          data.map((row: any) => ({
            id: row.id,
            seller_id: row.seller_id,
            amount: Number(row.amount),
            upi_id: row.upi_id,
            status: row.status as 'pending' | 'processed' | 'failed',
            reference_no: row.reference_no,
            created_at: row.created_at,
          }))
        );
      }
    } catch (e) {
      console.warn('Payout fetch exception:', e);
    } finally {
      setLoadingPayouts(false);
      setRefreshing(false);
    }
  }, [sellerId]);

  useEffect(() => {
    fetchPayouts();

    // Subscribe to realtime updates on seller_payouts
    const channel = supabase
      .channel('seller_payouts_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'seller_payouts' },
        () => {
          fetchPayouts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPayouts]);

  const onRefresh = () => {
    setRefreshing(true);
    triggerHaptic('light');
    fetchPayouts();
  };

  const handleWithdraw = async () => {
    if (availableBalance <= 0) return;

    Alert.alert(
      language === 'as' ? 'উপাৰ্জন হস্তান্তৰৰ আবেদন' : 'Request Payout',
      language === 'as'
        ? `আপুনি ₹${availableBalance.toLocaleString('en-IN')} টকা আপোনাৰ পঞ্জীয়নভুক্ত UPI (${targetUpi}) লৈ হস্তান্তৰ কৰিব বিচাৰেনে?`
        : `Do you want to queue a withdrawal of ₹${availableBalance.toLocaleString('en-IN')} to ${targetUpi}?`,
      [
        { text: language === 'as' ? 'বাতিল' : 'Cancel', style: 'cancel' },
        {
          text: language === 'as' ? 'হস্তান্তৰ কৰক' : 'Confirm Payout',
          onPress: async () => {
            triggerHaptic('success');
            setIsWithdrawing(true);
            try {
              const activeSellerId = sellerId || 'demo-seller';
              const { error } = await supabase
                .from('seller_payouts')
                .insert({
                  seller_id: activeSellerId,
                  amount: availableBalance,
                  upi_id: targetUpi,
                  status: 'pending',
                })
                .select()
                .single();

              if (error) {
                console.warn('Supabase payout insert failed:', error);
                throw error;
              }

              Alert.alert(
                language === 'as' ? 'আবেদন গ্ৰহণ কৰা হৈছে! 💰' : 'Payout Queued! 💰',
                language === 'as'
                  ? `₹${availableBalance.toLocaleString('en-IN')} টকাৰ আবেদন গ্ৰহণ কৰা হ’ল। প্ৰশাসকৰ অনুমোদনৰ পিছত ধন আপোনাৰ একাউণ্টত জমা হ’ব।`
                  : `₹${availableBalance.toLocaleString('en-IN')} has been queued. You will receive an alert once disbursed by the administrator.`
              );

              await fetchPayouts();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to submit payout request');
            } finally {
              setIsWithdrawing(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(language === 'as' ? 'as-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Bar */}
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
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          <RefreshCw size={18} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Main Available Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>
            {language === 'as' ? 'উপাৰ্জনৰ ধন (Available Balance)' : 'Available for Payout'}
          </Text>
          <Text style={styles.balanceAmount}>₹{availableBalance.toLocaleString('en-IN')}</Text>

          {totalPending > 0 && (
            <View style={styles.pendingBadgeRow}>
              <Clock size={12} color="#D97706" />
              <Text style={styles.pendingBadgeText}>
                ₹{totalPending.toLocaleString('en-IN')}{' '}
                {language === 'as' ? 'প্ৰক্ৰিয়াকৰণত আছে' : 'in pending run'}
              </Text>
            </View>
          )}

          <View style={styles.bankLinkRow}>
            <Building size={14} color={COLORS.primary} />
            <Text style={styles.bankLinkText}>
              Linked to {sellerProfile?.upi_id || 'pragjyotishpur@okaxis'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.withdrawBtn, (availableBalance === 0 || isWithdrawing) && styles.disabledWithdrawBtn]}
            onPress={handleWithdraw}
            disabled={availableBalance === 0 || isWithdrawing}
            activeOpacity={0.88}
          >
            {isWithdrawing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ArrowUpRight size={18} color="#FFFFFF" />
            )}
            <Text style={styles.withdrawBtnText}>
              {isWithdrawing
                ? 'Processing...'
                : language === 'as'
                ? 'বেংকলৈ ধন হস্তান্তৰ কৰক'
                : 'Withdraw to Bank / UPI'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Breakdown Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{language === 'as' ? 'মুঠ বিক্ৰী' : 'Gross Sales'}</Text>
            <Text style={styles.statVal}>₹{grossRevenue.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{language === 'as' ? 'মুঠ হস্তান্তৰিত' : 'Settled'}</Text>
            <Text style={[styles.statVal, { color: COLORS.success }]}>
              ₹{totalDisbursed.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>{language === 'as' ? 'অপেক্ষাৰত' : 'In Queue'}</Text>
            <Text style={[styles.statVal, { color: '#B45309' }]}>
              ₹{totalPending.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Live Payout History */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {language === 'as' ? 'সাম্প্ৰতিক লেনদেন' : 'Payout Settlement Ledger'}
          </Text>
          <Text style={styles.payoutCountBadge}>
            {payouts.length} {language === 'as' ? 'লেনদেন' : 'records'}
          </Text>
        </View>

        {loadingPayouts ? (
          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
        ) : payouts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Clock size={28} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'as' ? 'কোনো লেনদেন নাই' : 'No Payout Requests Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'as'
                ? 'আপোনাৰ উপলব্ধ উপাৰ্জনৰ ধন বেংকলৈ প্ৰেৰণ কৰাৰ পিছত ইয়াত দেখা পাব।'
                : 'Earnings from completed orders will be queued and settled directly to your bank account.'}
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {payouts.map((p) => {
              const isProcessed = p.status === 'processed';
              return (
                <View key={p.id} style={styles.historyCard}>
                  <View style={styles.historyLeft}>
                    <View
                      style={[
                        styles.historyIconBox,
                        isProcessed
                          ? { backgroundColor: COLORS.successLight }
                          : { backgroundColor: '#FEF3C7' },
                      ]}
                    >
                      {isProcessed ? (
                        <CheckCircle2 size={16} color={COLORS.success} />
                      ) : (
                        <Clock size={16} color="#D97706" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.historyTitleRow}>
                        <Text style={styles.historyTitle}>
                          {language === 'as' ? 'বেংক হস্তান্তৰ' : 'Bank Settlement'}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            isProcessed ? styles.statusSuccess : styles.statusPending,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              isProcessed ? { color: COLORS.success } : { color: '#B45309' },
                            ]}
                          >
                            {isProcessed
                              ? language === 'as'
                                ? 'হস্তান্তৰিত'
                                : 'Disbursed'
                              : language === 'as'
                              ? 'প্ৰক্ৰিয়াকৰণ চলি আছে'
                              : 'Pending Approval'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.historyDate}>{formatDate(p.created_at)}</Text>
                      {p.reference_no && (
                        <Text style={styles.historyUtr}>
                          UTR: <Text style={styles.utrMono}>{p.reference_no}</Text>
                        </Text>
                      )}
                      <Text style={styles.historyUpi}>UPI: {p.upi_id}</Text>
                    </View>
                  </View>
                  <View style={styles.historyRight}>
                    <Text
                      style={[
                        styles.historyAmount,
                        !isProcessed && { color: COLORS.text },
                      ]}
                    >
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Producer Direct Subsidy Notice */}
        <View style={styles.complianceBox}>
          <ShieldCheck size={16} color={COLORS.success} />
          <Text style={styles.complianceText}>
            100% Direct Producer Settlement with 0% middleman commissions. Funds transfer via NEFT / IMPS / UPI.
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
  refreshBtn: {
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
    marginTop: 6,
    marginBottom: 4,
  },
  pendingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  payoutCountBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
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
    ...SHADOWS.sm,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  historyIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingRight: 8,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusSuccess: {
    backgroundColor: COLORS.successLight,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  historyUtr: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  utrMono: {
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#065f46',
  },
  historyUpi: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  historyRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.success,
  },
  emptyContainer: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderStyle: 'dashed',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
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
    lineHeight: 16,
  },
});
