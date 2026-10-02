import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Search, Sparkles, MapPin, SlidersHorizontal } from 'lucide-react-native';
import { Header } from '../../components/Header';
import { RadiusSlider } from '../../components/RadiusSlider';
import { CategoryPills } from '../../components/CategoryPills';
import { ProductCard } from '../../components/ProductCard';
import { COLORS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useListings } from '../../context/ListingsContext';
import { useAuth } from '../../context/AuthContext';

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
    filteredListings,
  } = useListings();

  return (
    <View style={styles.container}>
      <Header />

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
                  {t('helloUser')} {user?.name || 'Assam Buyer'} 👋
                </Text>
                <Text style={styles.greetingSubtitle}>
                  {language === 'as'
                    ? 'ওচৰৰ গাঁৱৰ আত্মসহায়ক গোট আৰু উৎপাদকৰ পৰা সতেজ সামগ্ৰী'
                    : 'Fresh local produce directly from nearby village SHGs & farms'}
                </Text>
              </View>
            </View>

            {/* Search Input Bar */}
            <View style={styles.searchContainer}>
              <Search size={18} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('search')}
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
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
