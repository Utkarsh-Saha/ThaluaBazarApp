import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Search, Sparkles, MapPin, SlidersHorizontal, X, Mic } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { RadiusSlider } from '../../components/RadiusSlider';
import { CategoryPills } from '../../components/CategoryPills';
import { ProductCard } from '../../components/ProductCard';
import { FilterModal } from '../../components/FilterModal';
import { OfflineBanner } from '../../components/OfflineBanner';
import { AssameseVoiceSearchModal } from '../../components/AssameseVoiceSearchModal';
import { COLORS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useListings } from '../../context/ListingsContext';
import { useAuth } from '../../context/AuthContext';
import { triggerHaptic } from '../../lib/haptics';

export default function ExploreScreen() {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const {
    categories,
    radiusKm,
    setRadiusKm,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
    filteredListings,
  } = useListings();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  return (
    <View style={styles.container}>
      <Header />
      <OfflineBanner />

      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Welcome Greeting Banner */}
            <View style={styles.greetingBanner}>
              <View>
                <Text style={styles.greetingTitle}>
                  {user?.name ? `${t('helloUser')} ${user.name} 👋` : (language === 'as' ? 'থলুৱা বজাৰলৈ স্বাগতম 👋' : 'Welcome to Thaluwa Bazar 👋')}
                </Text>
                <Text style={styles.greetingSubtitle}>
                  {language === 'as'
                    ? 'ওচৰৰ গাঁৱৰ আত্মসহায়ক গোট আৰু উৎপাদকৰ পৰা সতেজ সামগ্ৰী'
                    : 'Fresh local produce directly from nearby village SHGs & farms'}
                </Text>
              </View>
            </View>

            {/* Search Input Bar with Voice Search & Filter Button */}
            <View style={styles.searchRow}>
              <View style={styles.searchContainer}>
                <Search size={18} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={language === 'as' ? 'সামগ্ৰী বিচাৰক বা কথা কওক...' : 'Search produce or tap mic...'}
                  placeholderTextColor={COLORS.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearSearchBtn}
                    onPress={() => {
                      triggerHaptic('light');
                      setSearchQuery('');
                    }}
                  >
                    <X size={15} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.voiceMicBtn}
                  onPress={() => {
                    triggerHaptic('medium');
                    setShowVoiceModal(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Mic size={17} color={COLORS.primary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.filterBtn, hasActiveFilters && styles.filterBtnActive]}
                onPress={() => {
                  triggerHaptic('light');
                  setShowFilterModal(true);
                }}
                activeOpacity={0.8}
              >
                <SlidersHorizontal
                  size={18}
                  color={hasActiveFilters ? '#FFFFFF' : COLORS.text}
                />
                {hasActiveFilters && <View style={styles.filterActiveDot} />}
              </TouchableOpacity>
            </View>

            {/* Active Filters Strip */}
            {hasActiveFilters && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activeFiltersStrip}
              >
                {filters.sortBy !== 'distance' && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterChipText}>
                      {filters.sortBy === 'price_asc'
                        ? '💰 Price: Low to High'
                        : filters.sortBy === 'price_desc'
                        ? '💎 Price: High to Low'
                        : filters.sortBy === 'rating'
                        ? '⭐ Top Rated'
                        : '🌾 Newest'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic('light');
                        setFilters((prev) => ({ ...prev, sortBy: 'distance' }));
                      }}
                    >
                      <X size={12} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {filters.organicOnly && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterChipText}>🌱 Organic Only</Text>
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic('light');
                        setFilters((prev) => ({ ...prev, organicOnly: false }));
                      }}
                    >
                      <X size={12} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {filters.inStockOnly && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterChipText}>📦 In Stock</Text>
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic('light');
                        setFilters((prev) => ({ ...prev, inStockOnly: false }));
                      }}
                    >
                      <X size={12} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                {filters.maxPrice !== null && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterChipText}>≤ ₹{filters.maxPrice}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        triggerHaptic('light');
                        setFilters((prev) => ({ ...prev, maxPrice: null }));
                      }}
                    >
                      <X size={12} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.clearAllFiltersBtn}
                  onPress={() => {
                    triggerHaptic('medium');
                    resetFilters();
                  }}
                >
                  <Text style={styles.clearAllFiltersText}>
                    {language === 'as' ? 'সকলো মচক' : 'Clear All'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}

            {/* Hyperlocal Radius Slider Filter */}
            <RadiusSlider radiusKm={radiusKm} onRadiusChange={setRadiusKm} />

            {/* Category Pills */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('categories')}</Text>
            </View>
            <CategoryPills
              categories={categories}
              selectedCategoryId={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            {/* Listings Section Header */}
            <View style={styles.sectionHeader}>
              <View style={styles.titleWithIcon}>
                <Sparkles size={16} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>{t('popularProducts')}</Text>
              </View>
              <Text style={styles.itemsCountBadge}>
                {filteredListings.length} {language === 'as' ? 'সামগ্ৰী' : 'items'}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <ProductCard listing={item} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MapPin size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'as'
                ? 'এই দূৰত্বত কোনো সামগ্ৰী পোৱা নগ’ল'
                : 'No products found within this radius'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'as'
                ? 'অনুগ্ৰহ কৰি দূৰত্বৰ সীমা (Radius) বৃদ্ধি কৰক'
                : 'Try expanding your hyperlocal radius filter up to 25 km'}
            </Text>
            <TouchableOpacity
              style={styles.expandRadiusBtn}
              onPress={() => setRadiusKm(25)}
            >
              <Text style={styles.expandRadiusText}>
                {language === 'as' ? '২৫ কিলোমিটাৰলৈ বৃদ্ধি কৰক' : 'Expand to 25 km'}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
      />

      <AssameseVoiceSearchModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSelectQuery={(query) => {
          setSearchQuery(query);
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
  listContent: {
    paddingBottom: 24,
  },
  greetingBanner: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  greetingSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  voiceMicBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterActiveDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  activeFiltersStrip: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  activeFilterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  clearAllFiltersBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
  },
  clearAllFiltersText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  itemsCountBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  columnWrapper: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48.5%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 18,
  },
  expandRadiusBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  expandRadiusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
