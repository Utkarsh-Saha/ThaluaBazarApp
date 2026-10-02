import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Truck,
  Store,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle,
  Smartphone,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useOrders } from '../../context/OrderContext';
import { triggerHaptic } from '../../lib/haptics';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { cart, subtotal, deliveryFee, total, deliveryType, setDeliveryType, clearCart } =
    useCart();
  const { placeOrder } = useOrders();

  const [address, setAddress] = useState(
    user?.address || 'Ward No 4, Hospital Road, Mangaldai - 784125'
  );
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod' | 'netbanking'>('upi');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    triggerHaptic('success');
    setIsSubmitting(true);

    try {
      const order = await placeOrder(
        cart,
        user || {
          id: 'u-guest',
          name: 'Local Buyer',
          phone: '+91 98765 43210',
          role: 'buyer',
          language: 'en',
          lat: 26.435,
          lng: 92.03,
          verified: true,
          created_at: new Date().toISOString(),
        },
        deliveryType,
        address,
        paymentMethod
      );

      clearCart();
      router.replace({
        pathname: '/checkout/confirmation',
        params: {
          orderId: order.id,
          orderNumber: order.order_number,
          total: order.total.toString(),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
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
        <Text style={styles.headerTitle}>
          {language === 'as' ? 'চেকআউট' : 'Checkout'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery Address Box */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <MapPin size={16} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>{t('deliveryAddress')}</Text>
            </View>
          </View>

          <TextInput
            style={styles.addressInput}
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter complete delivery address with PIN code"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        {/* Delivery Mode Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('deliveryOptions')}</Text>

          <View style={styles.deliverySelector}>
            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryType === 'delivery' && styles.deliveryOptionActive,
              ]}
              onPress={() => {
                triggerHaptic('light');
                setDeliveryType('delivery');
              }}
            >
              <Truck
                size={18}
                color={deliveryType === 'delivery' ? COLORS.primary : COLORS.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.optionTitle,
                    deliveryType === 'delivery' && styles.optionTitleActive,
                  ]}
                >
                  {t('homeDelivery')}
                </Text>
                <Text style={styles.optionSub}>{t('homeDeliveryDesc')}</Text>
              </View>
              {deliveryType === 'delivery' && <CheckCircle size={16} color={COLORS.primary} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.deliveryOption,
                deliveryType === 'pickup' && styles.deliveryOptionActive,
              ]}
              onPress={() => {
                triggerHaptic('light');
                setDeliveryType('pickup');
              }}
            >
              <Store
                size={18}
                color={deliveryType === 'pickup' ? COLORS.primary : COLORS.textSecondary}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.optionTitle,
                    deliveryType === 'pickup' && styles.optionTitleActive,
                  ]}
                >
                  {t('pickup')}
                </Text>
                <Text style={styles.optionSub}>{t('pickupDesc')}</Text>
              </View>
              {deliveryType === 'pickup' && <CheckCircle size={16} color={COLORS.primary} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('paymentMethod')}</Text>

          {/* UPI Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'upi' && styles.paymentOptionActive,
            ]}
            onPress={() => {
              triggerHaptic('light');
              setPaymentMethod('upi');
            }}
          >
            <Smartphone
              size={20}
              color={paymentMethod === 'upi' ? COLORS.primary : COLORS.textSecondary}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.paymentTitle,
                  paymentMethod === 'upi' && styles.paymentTitleActive,
                ]}
              >
                UPI (GPay / PhonePe / Paytm / BHIM)
              </Text>
              <Text style={styles.paymentSub}>Instant zero-fee local payment</Text>
            </View>
            {paymentMethod === 'upi' && <CheckCircle size={16} color={COLORS.primary} />}
          </TouchableOpacity>

          {/* Card / Netbanking */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'card' && styles.paymentOptionActive,
            ]}
            onPress={() => {
              triggerHaptic('light');
              setPaymentMethod('card');
            }}
          >
            <CreditCard
              size={20}
              color={paymentMethod === 'card' ? COLORS.primary : COLORS.textSecondary}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.paymentTitle,
                  paymentMethod === 'card' && styles.paymentTitleActive,
                ]}
              >
                Credit / Debit Card / Netbanking
              </Text>
              <Text style={styles.paymentSub}>All Indian banks supported</Text>
            </View>
            {paymentMethod === 'card' && <CheckCircle size={16} color={COLORS.primary} />}
          </TouchableOpacity>

          {/* Cash on Delivery */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cod' && styles.paymentOptionActive,
            ]}
            onPress={() => {
              triggerHaptic('light');
              setPaymentMethod('cod');
            }}
          >
            <Banknote
              size={20}
              color={paymentMethod === 'cod' ? COLORS.primary : COLORS.textSecondary}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.paymentTitle,
                  paymentMethod === 'cod' && styles.paymentTitleActive,
                ]}
              >
                {t('cashOnDelivery')}
              </Text>
              <Text style={styles.paymentSub}>Pay producer directly upon receipt</Text>
            </View>
            {paymentMethod === 'cod' && <CheckCircle size={16} color={COLORS.primary} />}
          </TouchableOpacity>
        </View>

        {/* Order Summary Breakdown */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            {language === 'as' ? 'বিলৰ বিৱৰণ' : 'Order Calculation'}
          </Text>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>{t('subtotal')}</Text>
            <Text style={styles.calcValue}>₹{subtotal}</Text>
          </View>

          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>{t('deliveryFee')}</Text>
            <Text style={[styles.calcValue, deliveryFee === 0 && styles.freeText]}>
              {deliveryFee === 0 ? t('freeDelivery') : `₹${deliveryFee}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('total')}</Text>
            <Text style={styles.totalValue}>₹{total}</Text>
          </View>

          <View style={styles.securityPill}>
            <ShieldCheck size={14} color={COLORS.success} />
            <Text style={styles.securityPillText}>
              PostgreSQL Atomic Lock & Server Stock Decrement
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Fixed Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View>
          <Text style={styles.payableLabel}>
            {language === 'as' ? 'পৰিশোধ কৰিবলগীয়া' : 'To Pay'}
          </Text>
          <Text style={styles.payableAmount}>₹{total}</Text>
        </View>

        <TouchableOpacity
          style={styles.placeOrderBtn}
          onPress={handlePlaceOrder}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.placeOrderBtnText}>{t('placeOrder')}</Text>
          )}
        </TouchableOpacity>
      </View>
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
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  addressInput: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 13,
    color: COLORS.text,
    textAlignVertical: 'top',
  },
  deliverySelector: {
    gap: 8,
  },
  deliveryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  deliveryOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  optionTitleActive: {
    color: COLORS.primary,
  },
  optionSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  paymentOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  paymentTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  paymentTitleActive: {
    color: COLORS.primary,
  },
  paymentSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calcLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  calcValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  freeText: {
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successLight,
    padding: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  securityPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.success,
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  payableLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  payableAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  placeOrderBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    ...SHADOWS.sm,
  },
  placeOrderBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
