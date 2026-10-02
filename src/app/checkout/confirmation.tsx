import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, ShoppingBag, ArrowRight } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { triggerHaptic } from '../../lib/haptics';

export default function OrderConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orderId, orderNumber, total } = useLocalSearchParams<{
    orderId: string;
    orderNumber: string;
    total: string;
  }>();
  const { language, t } = useLanguage();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.centerContent}>
        <View style={styles.successIconBox}>
          <CheckCircle2 size={68} color={COLORS.primary} strokeWidth={2.5} />
        </View>

        <Text style={styles.title}>{t('orderPlacedSuccess')}</Text>
        <Text style={styles.subtitle}>{t('orderPlacedMsg')}</Text>

        {/* Order Details Summary Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {language === 'as' ? 'অৰ্ডাৰ নম্বৰ' : 'Order ID'}
            </Text>
            <Text style={styles.detailValue}>{orderNumber || '#TB-8842'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('total')}</Text>
            <Text style={styles.detailTotalValue}>₹{total || '390'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {language === 'as' ? 'আনুমানিক সময়' : 'Estimated Delivery'}
            </Text>
            <Text style={styles.detailValue}>
              {language === 'as' ? 'আজি, ২ ঘণ্টাৰ ভিতৰত' : 'Today, within 2-4 Hours'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => {
            triggerHaptic('medium');
            router.replace('/(tabs)/orders');
          }}
          activeOpacity={0.88}
        >
          <Text style={styles.trackBtnText}>{t('trackOrder')}</Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => {
            triggerHaptic('light');
            router.replace('/(tabs)/explore');
          }}
          activeOpacity={0.8}
        >
          <ShoppingBag size={18} color={COLORS.primary} />
          <Text style={styles.continueBtnText}>{t('continueShopping')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  centerContent: {
    alignItems: 'center',
    paddingTop: 40,
  },
  successIconBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...SHADOWS.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 32,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  actionButtons: {
    gap: 12,
  },
  trackBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    ...SHADOWS.sm,
  },
  trackBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  continueBtn: {
    backgroundColor: COLORS.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(19, 117, 71, 0.2)',
  },
  continueBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
