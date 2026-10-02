import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Trash2,
  Sparkles,
  MapPin,
  Star,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useListings } from '../context/ListingsContext';
import { useCart } from '../context/CartContext';
import { triggerHaptic } from '../lib/haptics';

export default function WishlistScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { listings, wishlist, toggleWishlist } = useListings();
  const { addToCart } = useCart();

  const wishlistedItems = listings.filter((l) => wishlist.includes(l.id));

  const handleAddToCart = (item: any) => {
    triggerHaptic('success');
    addToCart(item, 1);
  };

  const handleRemove = (id: string) => {
    triggerHaptic('light');
    toggleWishlist(id);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {language === 'as' ? 'প্ৰিয় তালিকা' : 'My Wishlist'}
          </Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{wishlistedItems.length}</Text>
          </View>
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* Product List */}
      <FlatList
        data={wishlistedItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Heart size={44} color={COLORS.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>
              {language === 'as' ? 'আপোনাৰ প্ৰিয় তালিকা খালী' : 'Your Wishlist is Empty'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'as'
                ? 'বজাৰ অন্বেষণ কৰক আৰু মনপচন্দ সামগ্ৰী সংৰক্ষণ কৰক'
                : 'Explore local products from nearby Assam farmers & SHGs and save your favorites here'}
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)/explore')}
              activeOpacity={0.8}
            >
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.exploreBtnText}>
                {language === 'as' ? 'সামগ্ৰী চাওক' : 'Explore Market'}
              </Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const title = language === 'as' ? item.title_as : item.title_en;
          return (
            <TouchableOpacity
              style={styles.itemCard}
              onPress={() => router.push(`/product/${item.id}` as any)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: item.image_url }} style={styles.itemImage} />

              <View style={styles.itemInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemove(item.id)}
                    style={styles.heartBtn}
                    activeOpacity={0.7}
                  >
                    <Heart size={18} color={COLORS.error} fill={COLORS.error} />
                  </TouchableOpacity>
                </View>

                <View style={styles.sellerRow}>
                  <MapPin size={12} color={COLORS.textMuted} />
                  <Text style={styles.sellerName} numberOfLines={1}>
                    {item.seller_name} • {item.village}
                  </Text>
                </View>

                <View style={styles.ratingRow}>
                  <Star size={12} color={COLORS.secondary} fill={COLORS.secondary} />
                  <Text style={styles.ratingText}>{item.rating || '4.8'}</Text>
                  <Text style={styles.stockBadge}>
                    {item.stock > 0
                      ? language === 'as'
                        ? 'মজুত আছে'
                        : 'In Stock'
                      : language === 'as'
                      ? 'শেষ হৈছে'
                      : 'Out of Stock'}
                  </Text>
                </View>

                <View style={styles.bottomRow}>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceText}>₹{item.price}</Text>
                    <Text style={styles.unitText}>/{item.unit}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.addCartBtn}
                    onPress={() => handleAddToCart(item)}
                    activeOpacity={0.8}
                  >
                    <ShoppingCart size={14} color="#FFFFFF" />
                    <Text style={styles.addCartText}>
                      {language === 'as' ? 'কাৰ্টত যোগ' : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    padding: 6,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  countBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countBadgeText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    flex: 1,
  },
  heartBtn: {
    padding: 4,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  sellerName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  stockBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  unitText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  addCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
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
    maxWidth: 280,
    lineHeight: 18,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
    ...SHADOWS.md,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
