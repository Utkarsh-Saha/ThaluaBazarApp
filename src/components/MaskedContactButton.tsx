import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Phone, Lock, Unlock } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useListings } from '../context/ListingsContext';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../lib/haptics';

interface MaskedContactButtonProps {
  listingId: string;
  sellerId: string;
  sellerPhone: string;
  sellerName: string;
}

export const MaskedContactButton: React.FC<MaskedContactButtonProps> = ({
  listingId,
  sellerId,
  sellerPhone,
  sellerName,
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { unlockedContacts, unlockSellerContact } = useListings();
  const [isUnlocking, setIsUnlocking] = useState(false);

  const isUnlocked = unlockedContacts[listingId];

  const handleUnlock = async () => {
    triggerHaptic('medium');
    setIsUnlocking(true);
    try {
      await unlockSellerContact(listingId, user?.id || 'guest', sellerId);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleCall = () => {
    triggerHaptic('light');
    const cleanPhone = sellerPhone.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Calling unavailable', `Phone number: ${sellerPhone}`);
    });
  };

  if (isUnlocked) {
    return (
      <View style={styles.unlockedBox}>
        <View style={styles.phoneInfo}>
          <View style={styles.unlockedBadge}>
            <Unlock size={12} color={COLORS.primary} />
            <Text style={styles.unlockedLabel}>
              {language === 'as' ? 'নম্বৰ উন্মুক্ত' : 'Contact Unlocked'}
            </Text>
          </View>
          <Text style={styles.phoneText}>{sellerPhone}</Text>
        </View>

        <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.8}>
          <Phone size={14} color="#FFFFFF" />
          <Text style={styles.callButtonText}>
            {language === 'as' ? 'কল কৰক' : 'Call Producer'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Masked phone format (e.g. +91 94350 •••••)
  const maskedPhone = sellerPhone.slice(0, 8) + ' •••••';

  return (
    <View style={styles.container}>
      <View style={styles.maskedRow}>
        <View style={styles.maskedTextContainer}>
          <Text style={styles.maskedTitle}>
            {language === 'as' ? 'উৎপাদকৰ যোগাযোগ' : 'Producer Contact'}
          </Text>
          <Text style={styles.maskedPhoneText}>{maskedPhone}</Text>
        </View>

        <TouchableOpacity
          style={styles.unlockButton}
          onPress={handleUnlock}
          disabled={isUnlocking}
          activeOpacity={0.8}
        >
          <Lock size={14} color="#FFFFFF" />
          <Text style={styles.unlockButtonText}>
            {isUnlocking
              ? language === 'as'
                ? 'অনুমোদন...'
                : 'Unlocking...'
              : language === 'as'
              ? 'নম্বৰ চাওক'
              : 'Unlock Contact'}
          </Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.privacyNote}>
        🔒 {language === 'as' ? 'নিৰাপত্তা আৰু গোপনীয়তা সংৰক্ষিত' : 'Privacy protected & audit-logged'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 10,
  },
  maskedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  maskedTextContainer: {
    flex: 1,
  },
  maskedTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  maskedPhoneText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  unlockButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  privacyNote: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  unlockedBox: {
    backgroundColor: COLORS.primaryLight,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(19, 117, 71, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  phoneInfo: {
    flex: 1,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  unlockedLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  callButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
