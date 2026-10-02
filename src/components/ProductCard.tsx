import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Check, MapPin, Sparkles } from 'lucide-react-native';
import { Listing } from '../types';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { triggerHaptic } from '../lib/haptics';

interface ProductCardProps {
  listing: Listing;
  layout?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ listing, layout = 'grid' }) => {
  const router = useRouter();
  const { language } = useLanguage();
  const { cart, addToCart } = useCart();

  const cartItem = cart.find((item) => item.listing.id === listing.id);
  const isInCart = !!cartItem;

  const title = language === 'as' ? listing.title_as : listing.title_en;

  const handlePress = () => {
    triggerHaptic('light');
    router.push(`/product/${listing.id}`);
  };

  const handleAdd = (e: any) => {
    e.stopPropagation?.();
    addToCart(listing, 1);
  };

  return (
    <TouchableOpacity
      style={[styles.card, layout === 'list' && styles.listCard]}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: listing.image_url }} style={styles.image} resizeMode="cover" />
        
        {listing.is_organic && (
          <View style={styles.badgeOrganic}>
            <Sparkles size={10} color="#FFFFFF" />
            <Text style={styles.badgeText}>Organic</Text>
          </View>
        )}

        <View style={styles.distanceBadge}>
          <MapPin size={10} color={COLORS.primary} />
          <Text style={styles.distanceText}>{listing.distance_km || 3.2} km</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{listing.price}</Text>
          <Text style={styles.unit}>/{listing.unit}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.sellerName} numberOfLines={1}>
          🌱 {listing.seller_name}
        </Text>

        <View style={styles.footerRow}>
          <Text style={styles.villageText} numberOfLines={1}>
            📍 {listing.village}
          </Text>

          <TouchableOpacity
            style={[styles.addButton, isInCart && styles.addedButton]}
            onPress={handleAdd}
            activeOpacity={0.7}
          >
            {isInCart ? (
              <View style={styles.addedBadge}>
                <Check size={14} color="#FFFFFF" />
                <Text style={styles.addedText}>{cartItem.quantity}</Text>
              </View>
            ) : (
              <Plus size={16} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    marginBottom: 12,
  },
  listCard: {
    flexDirection: 'row',
    height: 120,
  },
  imageContainer: {
    height: 135,
    width: '100%',
    backgroundColor: COLORS.borderLight,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeOrganic: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  content: {
    padding: 10,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  unit: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginVertical: 4,
    lineHeight: 17,
  },
  sellerName: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  villageText: {
    fontSize: 10,
    color: COLORS.textMuted,
    flex: 1,
    marginRight: 4,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addedButton: {
    backgroundColor: COLORS.secondary,
    width: 'auto',
    paddingHorizontal: 8,
  },
  addedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  addedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
