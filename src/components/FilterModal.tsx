import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, RotateCcw, Sparkles, SlidersHorizontal, ArrowUpDown } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useListings, SortOption, FilterOptions } from '../context/ListingsContext';
import { triggerHaptic } from '../lib/haptics';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
}

const PRICE_PRESETS: { label: string; labelAs: string; value: number | null }[] = [
  { label: 'Any Price', labelAs: 'সকলো মূল্য', value: null },
  { label: 'Under ₹50', labelAs: '₹৫০ ৰ তলত', value: 50 },
  { label: 'Under ₹100', labelAs: '₹১০০ ৰ তলত', value: 100 },
  { label: 'Under ₹250', labelAs: '₹২৫০ ৰ তলত', value: 250 },
  { label: 'Under ₹500', labelAs: '₹৫০০ ৰ তলত', value: 500 },
];

const SORT_OPTIONS: { id: SortOption; label: string; labelAs: string; icon: string }[] = [
  { id: 'distance', label: 'Nearest First', labelAs: 'ওচৰৰ পৰা (GPS)', icon: '📍' },
  { id: 'price_asc', label: 'Price: Low to High', labelAs: 'কম মূল্যৰ পৰা', icon: '💰' },
  { id: 'price_desc', label: 'Price: High to Low', labelAs: 'বেছি মূল্যৰ পৰা', icon: '💎' },
  { id: 'rating', label: 'Top Rated', labelAs: 'সৰ্বাধিক নম্বৰপ্ৰাপ্ত', icon: '⭐' },
  { id: 'newest', label: 'Fresh Harvest', labelAs: 'সদ্য চপোৱা সামগ্ৰী', icon: '🌾' },
];

export const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { filters, setFilters, resetFilters, filteredListings } = useListings();

  // Local draft state while modal is open
  const [draftFilters, setDraftFilters] = useState<FilterOptions>(filters);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setDraftFilters(filters);
    }
  }

  const handleApply = () => {
    triggerHaptic('success');
    setFilters(draftFilters);
    onClose();
  };

  const handleReset = () => {
    triggerHaptic('medium');
    resetFilters();
    setDraftFilters({
      organicOnly: false,
      inStockOnly: false,
      maxPrice: null,
      minRating: null,
      sortBy: 'distance',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {/* Top Drag Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleRow}>
              <SlidersHorizontal size={20} color={COLORS.primary} />
              <Text style={styles.headerTitle}>
                {language === 'as' ? 'ফিল্টাৰ আৰু সজোৱা' : 'Filter & Sort Produce'}
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.7}>
                <RotateCcw size={14} color={COLORS.primary} />
                <Text style={styles.resetBtnText}>
                  {language === 'as' ? 'পূৰ্বৰ অৱস্থালৈ' : 'Reset'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Sort Options */}
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <ArrowUpDown size={15} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>
                  {language === 'as' ? 'ক্ৰম সজোৱা' : 'Sort Order'}
                </Text>
              </View>

              <View style={styles.chipsWrap}>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = draftFilters.sortBy === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.sortChip, isSelected && styles.sortChipActive]}
                      onPress={() => {
                        triggerHaptic('light');
                        setDraftFilters((prev) => ({ ...prev, sortBy: opt.id }));
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chipIcon}>{opt.icon}</Text>
                      <Text
                        style={[styles.sortChipText, isSelected && styles.sortChipTextActive]}
                      >
                        {language === 'as' ? opt.labelAs : opt.label}
                      </Text>
                      {isSelected && <Check size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Quality & Certification Toggles */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'as' ? 'প্ৰমাণীকৰণ আৰু মজুত' : 'Certification & Availability'}
              </Text>

              {/* Organic toggle card */}
              <View style={styles.toggleCard}>
                <View style={styles.toggleCardLeft}>
                  <Text style={styles.toggleCardIcon}>🌱</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>
                      {language === 'as' ? 'কেৱল জৈৱিক প্ৰমাণিত' : 'Organic & Jaivik Only'}
                    </Text>
                    <Text style={styles.toggleSub}>
                      {language === 'as'
                        ? 'ৰাসায়নিক সাৰবিহীন সতেজ স্থানীয় ফচল'
                        : '100% naturally grown without synthetic chemicals'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={draftFilters.organicOnly}
                  onValueChange={(val) => {
                    triggerHaptic('light');
                    setDraftFilters((prev) => ({ ...prev, organicOnly: val }));
                  }}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={draftFilters.organicOnly ? COLORS.primary : '#FFFFFF'}
                />
              </View>

              {/* In-Stock toggle card */}
              <View style={[styles.toggleCard, { marginTop: 10 }]}>
                <View style={styles.toggleCardLeft}>
                  <Text style={styles.toggleCardIcon}>📦</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleTitle}>
                      {language === 'as' ? 'কেৱল মজুত থকা সামগ্ৰী' : 'In-Stock Only'}
                    </Text>
                    <Text style={styles.toggleSub}>
                      {language === 'as'
                        ? 'বৰ্তমান ক্ৰয়ৰ বাবে সাজু থকা সামগ্ৰীসমূহ'
                        : 'Hide items that are sold out or pending harvest'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={draftFilters.inStockOnly}
                  onValueChange={(val) => {
                    triggerHaptic('light');
                    setDraftFilters((prev) => ({ ...prev, inStockOnly: val }));
                  }}
                  trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                  thumbColor={draftFilters.inStockOnly ? COLORS.primary : '#FFFFFF'}
                />
              </View>
            </View>

            {/* Max Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {language === 'as' ? 'মূল্যৰ পৰিসীমা' : 'Price Limit'}
              </Text>

              <View style={styles.chipsWrap}>
                {PRICE_PRESETS.map((preset, idx) => {
                  const isSelected = draftFilters.maxPrice === preset.value;
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.priceChip, isSelected && styles.priceChipActive]}
                      onPress={() => {
                        triggerHaptic('light');
                        setDraftFilters((prev) => ({ ...prev, maxPrice: preset.value }));
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[styles.priceChipText, isSelected && styles.priceChipTextActive]}
                      >
                        {language === 'as' ? preset.labelAs : preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Apply CTA Bar */}
          <View style={styles.ctaRow}>
            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.88}>
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.applyBtnText}>
                {language === 'as'
                  ? `ফিল্টাৰ প্ৰয়োগ কৰক (${filteredListings.length} সামগ্ৰী)`
                  : `Apply Filters (${filteredListings.length} items)`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
    ...SHADOWS.lg,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.borderLight,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingVertical: 16,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.2,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  sortChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  sortChipTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  toggleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  toggleCardIcon: {
    fontSize: 22,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  toggleSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  priceChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  priceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  priceChipTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  ctaRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  applyBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    ...SHADOWS.sm,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
