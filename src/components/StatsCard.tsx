import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SHADOWS } from '../constants/theme';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: any;
  color?: string;
  bgColor?: string;
  subtext?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  icon: Icon,
  color = COLORS.primary,
  bgColor = COLORS.primaryLight,
  subtext,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.iconBox, { backgroundColor: bgColor }]}>
          <Icon size={16} color={color} />
        </View>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      {subtext && <Text style={styles.subtext}>{subtext}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '800',
  },
  subtext: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});
