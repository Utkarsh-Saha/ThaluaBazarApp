import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Share2,
  Heart,
  Plus,
  Minus,
  Sparkles,
  MapPin,
  Store,
  ShieldCheck,
  Check,
  ShoppingCart,
} from 'lucide-react-native';
import { MaskedContactButton } from '../../components/MaskedContactButton';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useListings } from '../../context/ListingsContext';
import { useCart } from '../../context/CartContext';
import { triggerHaptic } from '../../lib/haptics';

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { language, t } = useLanguage();
  const { getListingById } = useListings();
  const { cart, addToCart } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const listing = getListingById(id as string);

  if (!listing) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  const title = language === 'as' ? listing.title_as : listing.title_en;
  const description = language === 'as' ? listing.description_as : listing.description_en;
  const categoryName = language === 'as' ? listing.category_name_as : listing.category_name_en;

  const handleAddToCart = () => {
    triggerHaptic('medium');
    addToCart(listing, quantity);
  };

  const handleBuyNow = () => {
    triggerHaptic('heavy');
    addToCart(listing, quantity);
    router.push('/checkout');
  };

  return (
    <View style={styles.container}>
      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Header with Back & Share */}
        <View style={styles.imageHeader}>
          <Image source={{ uri: listing.image_url }} style={styles.productImage} resizeMode="cover" />

          <View style={[styles.topActions, { top: insets.top + 8 }]}>
            <TouchableOpacity
              style={styles.circleActionBtn}
              onPress={() => {
                triggerHaptic('light');
                router.back();
              }}
            >
              <ArrowLeft size={20} color={COLORS.text} />
            </TouchableOpacity>

            <View style={styles.topRightActions}>
              <TouchableOpacity
                style={styles.circleActionBtn}
                onPress={() => {
                  triggerHaptic('light');
                  setIsFavorite(!isFavorite);
                }}
              >
                <Heart
                  size={20}
                  color={isFavorite ? COLORS.error : COLORS.text}
                  fill={isFavorite ? COLORS.error : 'none'}
                />
              </TouchableOpacity>
            </View>
          </View>

          {listing.is_organic && (
            <View style={styles.organicFloatingBadge}>
              <Sparkles size={12} color="#FFFFFF" />
              <Text style={styles.organicFloatingText}>{t('organicCertified')}</Text>
            </View>
          )}
        </View>

        {/* Content Body */}
        <View style={styles.body}>
          {/* Category & Proximity */}
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryName}</Text>
            </View>
            <View style={styles.proximityBadge}>
              <MapPin size={12} color={COLORS.primary} />
              <Text style={styles.proximityText}>
                {listing.distance_km || 2.8} km {t('distanceAway')}
              </Text>
            </View>
          </View>

          {/* Title & Price */}
          <Text style={styles.productTitle}>{title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{listing.price}</Text>
            <Text style={styles.unit}>/ {listing.unit}</Text>
            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>
                {listing.stock > 0
                  ? `✓ ${listing.stock} ${listing.unit} ${t('inStock')}`
                  : t('outOfStock')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionLabel}>{t('quantity')}</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  triggerHaptic('light');
                  setQuantity(Math.max(1, quantity - 1));
                }}
              >
                <Minus size={16} color={COLORS.text} />
              </TouchableOpacity>
              <Text style={styles.qtyNumber}>{quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  triggerHaptic('light');
                  setQuantity(quantity + 1);
                }}
              >
                <Plus size={16} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t('description')}</Text>
            <Text style={styles.descriptionText}>{description}</Text>
          </View>

          <View style={styles.divider} />

          {/* Seller / SHG Card */}
          <View style={styles.sellerSection}>
            <Text style={styles.sectionLabel}>{t('sellerInfo')}</Text>
            <View style={styles.sellerCard}>
              <View style={styles.sellerIconBox}>
                <Store size={22} color={COLORS.primary} />
              </View>
              <View style={styles.sellerInfo}>
                <View style={styles.sellerTitleRow}>
                  <Text style={styles.sellerName}>{listing.seller_name}</Text>
                  <View style={styles.verifiedBadge}>
                    <ShieldCheck size={12} color={COLORS.success} />
                    <Text style={styles.verifiedText}>{t('verifiedSHG')}</Text>
                  </View>
                </View>
                <Text style={styles.sellerLocation}>
                  📍 {listing.village}, {listing.district}
                </Text>
                {listing.haat_name && (
                  <Text style={styles.haatLink}>
                    🏛️ Associated with {listing.haat_name}
                  </Text>
                )}
              </View>
            </View>

            {/* Masked Contact Privacy Action */}
            <MaskedContactButton
              listingId={listing.id}
              sellerId={listing.seller_id}
              sellerPhone={listing.seller_phone}
              sellerName={listing.seller_name}
            />
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Actions Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <ShoppingCart size={18} color={COLORS.primary} />
          <Text style={styles.cartBtnText}>{t('addToCart')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyNowBtn}
          onPress={handleBuyNow}
          activeOpacity={0.88}
        >
          <Text style={styles.buyNowBtnText}>{t('buyNow')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageHeader: {
    width: '100%',
    height: 320,
    position: 'relative',
    backgroundColor: COLORS.borderLight,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  topActions: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  circleActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  organicFloatingBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  organicFloatingText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  body: {
    padding: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: COLORS.secondaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  proximityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  proximityText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    lineHeight: 28,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
  },
  price: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.text,
  },
  unit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  stockBadge: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 16,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qtyBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNumber: {
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 12,
    color: COLORS.text,
  },
  section: {
    gap: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
  sellerSection: {
    gap: 8,
  },
  sellerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  sellerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  sellerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.success,
  },
  sellerLocation: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  haatLink: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '600',
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    ...SHADOWS.lg,
  },
  cartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(19, 117, 71, 0.2)',
  },
  cartBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  buyNowBtn: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    ...SHADOWS.sm,
  },
  buyNowBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
