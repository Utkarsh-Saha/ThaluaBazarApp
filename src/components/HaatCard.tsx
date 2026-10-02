import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Calendar, Clock, Store, MapPin } from 'lucide-react-native';
import { HaatMarket } from '../types';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';

interface HaatCardProps {
  haat: HaatMarket;
  onPress?: () => void;
}

export const HaatCard: React.FC<HaatCardProps> = ({ haat, onPress }) => {
  const { language } = useLanguage();

  const name = language === 'as' ? haat.name_as : haat.name_en;
  const marketDay = language === 'as' ? haat.market_day_as : haat.market_day;
  const specialty = language === 'as' ? haat.specialty_as : haat.specialty_en;

  const handlePress = () => {
    triggerHaptic('light');
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.9}
    >
      <Image source={{ uri: haat.image_url }} style={styles.image} resizeMode="cover" />
      
      <View style={styles.overlay}>
        <View style={styles.badgeRow}>
          <View style={styles.sellersBadge}>
            <Store size={12} color="#FFFFFF" />
            <Text style={styles.badgeText}>
              {haat.active_sellers_count}+ {language === 'as' ? 'উৎপাদক' : 'Producers'}
            </Text>
          </View>

          <View style={styles.distanceBadge}>
            <MapPin size={12} color="#FFFFFF" />
            <Text style={styles.badgeText}>{haat.distance_km || 4.5} km</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.location}>📍 {haat.location}, {haat.district}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Calendar size={13} color={COLORS.secondary} />
              <Text style={styles.infoText}>{marketDay}</Text>
            </View>

            <View style={styles.infoItem}>
              <Clock size={13} color={COLORS.secondary} />
              <Text style={styles.infoText}>{haat.timings}</Text>
            </View>
          </View>

          <View style={styles.specialtyContainer}>
            <Text style={styles.specialtyLabel}>
              {language === 'as' ? 'বিশেষত্ব:' : 'Specialty:'}
            </Text>
            <Text style={styles.specialtyText} numberOfLines={1}>
              {specialty}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    height: 200,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    marginBottom: 16,
    ...SHADOWS.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    padding: 14,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sellersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(19, 117, 71, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    gap: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  location: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  specialtyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  specialtyText: {
    fontSize: 11,
    color: '#FFFFFF',
    flex: 1,
  },
});
