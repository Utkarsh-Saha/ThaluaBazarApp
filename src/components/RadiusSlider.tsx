import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Navigation } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';

interface RadiusSliderProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
}

const PRESETS = [3, 5, 10, 15, 25];

export const RadiusSlider: React.FC<RadiusSliderProps> = ({ radiusKm, onRadiusChange }) => {
  const { language } = useLanguage();

  const handleSelectPreset = (km: number) => {
    triggerHaptic('light');
    onRadiusChange(km);
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.leftLabel}>
          <MapPin size={16} color={COLORS.primary} />
          <Text style={styles.heading}>
            {language === 'as' ? 'স্থানীয় দূৰত্বৰ সীমা' : 'Hyperlocal Radius'}
          </Text>
        </View>
        <View style={styles.badge}>
          <Navigation size={12} color={COLORS.primary} />
          <Text style={styles.badgeText}>
            {radiusKm} km {language === 'as' ? 'ভিতৰত' : 'radius'}
          </Text>
        </View>
      </View>

      <View style={styles.presetsRow}>
        {PRESETS.map((preset) => {
          const isSelected = radiusKm === preset;
          return (
            <TouchableOpacity
              key={preset}
              style={[styles.presetChip, isSelected && styles.selectedPresetChip]}
              onPress={() => handleSelectPreset(preset)}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, isSelected && styles.selectedPresetText]}>
                {preset} km
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leftLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  presetChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  selectedPresetChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectedPresetText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
