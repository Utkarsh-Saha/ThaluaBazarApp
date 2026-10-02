import React from 'react';
import { ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ProductCategory } from '../types';
import { COLORS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';

interface CategoryPillsProps {
  categories: ProductCategory[];
  selectedCategoryId: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const { language } = useLanguage();

  const handleSelect = (id: string | null) => {
    triggerHaptic('light');
    onSelectCategory(id);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <TouchableOpacity
        style={[styles.pill, selectedCategoryId === null && styles.selectedPill]}
        onPress={() => handleSelect(null)}
        activeOpacity={0.7}
      >
        <Text style={[styles.pillText, selectedCategoryId === null && styles.selectedPillText]}>
          {language === 'as' ? 'সকলো' : 'All'}
        </Text>
      </TouchableOpacity>

      {categories.map((cat) => {
        const isSelected = selectedCategoryId === cat.id;
        const name = language === 'as' ? cat.name_as : cat.name_en;
        return (
          <TouchableOpacity
            key={cat.id}
            style={[styles.pill, isSelected && styles.selectedPill]}
            onPress={() => handleSelect(cat.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, isSelected && styles.selectedPillText]}>
              {name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedPill: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectedPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
