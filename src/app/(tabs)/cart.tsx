import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, Plus, Minus, ShoppingBag, ShieldCheck, ArrowRight, Truck, Store } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { triggerHaptic } from '../../lib/haptics';

export default function CartScreen() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryFee,
    total,
    deliveryType,
    setDeliveryType,
  } = useCart();

  const handleCheckout = () => {
    triggerHaptic('medium');
    router.push('/checkout');
  };

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <Header subtitle={t('myCart')} />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <ShoppingBag size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>{t('emptyCart')}</Text>
          <Text style={styles.emptySubtitle}>
            {language === 'as'
              ? 'আপোনাৰ ওচৰৰ থলুৱা উৎপাদকসকলৰ সতেজ সামগ্ৰী অন্বেষণ কৰক'
              : 'Discover fresh authentic local produce from verified rural producers'}
          </Text>
          <TouchableOpacity
            style={styles.startShopBtn}
            onPress={() => router.push('/(tabs)/explore')}
            activeOpacity={0.8}
          >
            <Text style={styles.startShopBtnText}>{t('startShopping')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header subtitle={`${cart.length} ${language === 'as' ? 'বিধ সামগ্ৰী' : 'items in cart'}`} />

      <FlatList
        data={cart}
        keyExtractor={(item) => item.listing.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Delivery Type Option Selector */}
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
                <View>
                  <Text
                    style={[
                      styles.deliveryOptionTitle,
                      deliveryType === 'delivery' && styles.deliveryOptionTitleActive,
                    ]}
                  >
                    {t('homeDelivery')}
                  </Text>
                  <Text style={styles.deliveryOptionSub}>
                    {subtotal >= 500 ? t('freeDelivery') : '₹30'}
                  </Text>
                </View>
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
                <View>
                  <Text
                    style={[
                      styles.deliveryOptionTitle,
                      deliveryType === 'pickup' && styles.deliveryOptionTitleActive,
                    ]}
                  >
                    {t('pickup')}
                  </Text>
                  <Text style={styles.deliveryOptionSub}>₹0 (Self collect)</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          const title = language === 'as' ? item.listing.title_as : item.listing.title_en;
          return (
            <View style={styles.cartItemCard}>
              <Image
                source={{ uri: item.listing.image_url }}
                style={styles.itemImage}
                resizeMode="cover"
              />

              <View style={styles.itemInfo}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => removeFromCart(item.listing.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Trash2 size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.itemSeller}>🌱 {item.listing.seller_name}</Text>

                <View style={styles.itemBottomRow}>
                  <Text style={styles.itemPrice}>
                    ₹{item.listing.price * item.quantity}
                    <Text style={styles.itemUnit}>
                      {' '}
                      (₹{item.listing.price}/{item.listing.unit})
                    </Text>
                  </Text>

                  {/* Quantity Stepper */}
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(item.listing.id, item.quantity - 1)}
                    >
                      <Minus size={14} color={COLORS.text} />
                    </TouchableOpacity>

                    <Text style={styles.stepQuantity}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={styles.stepBtn}
                      onPress={() => updateQuantity(item.listing.id, item.quantity + 1)}
                    >
                      <Plus size={14} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <View style={styles.billCard}>
            <Text style={styles.billHeader}>{language === 'as' ? 'মূল্য বিৱৰণ' : 'Price Details'}</Text>
            
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>{t('subtotal')}</Text>
              <Text style={styles.billVal}>₹{subtotal}</Text>
            </View>

            <View style={styles.billRow}>
              <Text style={styles.billLabel}>{t('deliveryFee')}</Text>
              <Text style={[styles.billVal, deliveryFee === 0 && styles.freeDeliveryText]}>
                {deliveryFee === 0 ? t('freeDelivery') : `₹${deliveryFee}`}
              </Text>
            </View>

            <View style={styles.billDivider} />

            <View style={styles.billRowTotal}>
              <Text style={styles.billTotalLabel}>{t('total')}</Text>
              <Text style={styles.billTotalVal}>₹{total}</Text>
            </View>

            <View style={styles.securityRow}>
              <ShieldCheck size={14} color={COLORS.success} />
              <Text style={styles.securityText}>
                {language === 'as'
                  ? 'চাৰ্ভাৰত সুৰক্ষিতভাৱে গণনা কৰা হৈছে (Trusted server calculations)'
                  : 'Zero-trust server price calculation & stock validation'}
              </Text>
            </View>
          </View>
        }
      />

      {/* Floating Checkout Button */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomTotalLabel}>{t('total')}</Text>
          <Text style={styles.bottomTotalValue}>₹{total}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handleCheckout}
          activeOpacity={0.88}
        >
          <Text style={styles.checkoutBtnText}>{t('proceedToCheckout')}</Text>
          <ArrowRight size={18} color="#FFFFFF" />
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
  listContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 12,
  },
  deliverySelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  deliveryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  deliveryOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  deliveryOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  deliveryOptionTitleActive: {
    color: COLORS.primary,
  },
  deliveryOptionSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cartItemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 6,
  },
  itemSeller: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  itemUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepQuantity: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 8,
  },
  billCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: 8,
    gap: 8,
    ...SHADOWS.sm,
  },
  billHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  billVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  freeDeliveryText: {
    color: COLORS.success,
  },
  billDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
  billRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  billTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.successLight,
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  securityText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '600',
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
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  bottomTotalLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  bottomTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.text,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    ...SHADOWS.sm,
  },
  checkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  startShopBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 20,
  },
  startShopBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
