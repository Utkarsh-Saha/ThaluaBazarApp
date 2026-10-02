import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Edit2, Sparkles } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useListings } from '../../context/ListingsContext';
import { triggerHaptic } from '../../lib/haptics';

export default function SellerProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { listings, toggleListingStatus } = useListings();

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = listings.filter((item) => {
    if (activeTab === 'active') return item.status === 'active';
    if (activeTab === 'inactive') return item.status === 'inactive';
    return true;
  });

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
        <Text style={styles.headerTitle}>{t('myProducts')}</Text>
        <TouchableOpacity
          style={styles.addSmallBtn}
          onPress={() => router.push('/seller/add-product')}
        >
          <Plus size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'all' && styles.activeTabChip]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('all');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            {language === 'as' ? 'সকলো' : 'All'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'active' && styles.activeTabChip]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('active');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
            {language === 'as' ? 'সক্ৰিয় (Active)' : 'Active'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'inactive' && styles.activeTabChip]}
          onPress={() => {
            triggerHaptic('light');
            setActiveTab('inactive');
          }}
        >
          <Text style={[styles.tabText, activeTab === 'inactive' && styles.activeTabText]}>
            {language === 'as' ? 'নিষ্ক্ৰিয় (Inactive)' : 'Inactive'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const title = language === 'as' ? item.title_as : item.title_en;
          const isActive = item.status === 'active';

          return (
            <View style={styles.productCard}>
              <Image source={{ uri: item.image_url }} style={styles.productImage} />

              <View style={styles.productInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.productTitle} numberOfLines={1}>
                    {title}
                  </Text>
                </View>

                <Text style={styles.priceText}>
                  ₹{item.price} <Text style={styles.unitText}>/{item.unit}</Text>
                </Text>

                <Text style={styles.stockText}>
                  {language === 'as' ? 'মজুত:' : 'Stock:'} {item.stock} {item.unit}
                </Text>

                <View style={styles.statusRow}>
                  <Text style={[styles.statusLabel, isActive ? styles.activeStatus : styles.inactiveStatus]}>
                    {isActive ? 'Active & Listed' : 'Paused'}
                  </Text>

                  <Switch
                    value={isActive}
                    onValueChange={() => {
                      triggerHaptic('light');
                      toggleListingStatus(item.id);
                    }}
                    trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                    thumbColor={isActive ? COLORS.primary : '#FFFFFF'}
                  />
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* Floating Add Product CTA */}
      <TouchableOpacity
        style={[styles.fabBtn, { bottom: insets.bottom + 20 }]}
        onPress={() => {
          triggerHaptic('medium');
          router.push('/seller/add-product');
        }}
        activeOpacity={0.88}
      >
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.fabBtnText}>{t('addProduct')}</Text>
      </TouchableOpacity>
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
  addSmallBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTabChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  productImage: {
    width: 85,
    height: 85,
    borderRadius: 12,
    backgroundColor: COLORS.borderLight,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  unitText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '400',
  },
  stockText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  activeStatus: {
    color: COLORS.success,
  },
  inactiveStatus: {
    color: COLORS.textMuted,
  },
  fabBtn: {
    position: 'absolute',
    right: 20,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    ...SHADOWS.lg,
  },
  fabBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
