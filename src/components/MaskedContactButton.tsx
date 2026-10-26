import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, Lock, Unlock, MessageCircle, Mic } from 'lucide-react-native';
import { COLORS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useListings } from '../context/ListingsContext';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../lib/haptics';
import { openWhatsAppChat } from '../lib/chat';

interface MaskedContactButtonProps {
  listingId: string;
  sellerId: string;
  sellerPhone: string;
  sellerName: string;
  listingTitle?: string;
}

export const MaskedContactButton: React.FC<MaskedContactButtonProps> = ({
  listingId,
  sellerId,
  sellerPhone,
  sellerName,
  listingTitle,
}) => {
  const router = useRouter();
  const { language } = useLanguage();
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

  const handleOpenChat = () => {
    triggerHaptic('light');
    router.push({
      pathname: `/chat/new-${sellerId}`,
      params: {
        sellerId,
        sellerName,
        sellerPhone,
        listingId,
        listingTitle,
      },
    });
  };

  const handleOpenWhatsApp = () => {
    triggerHaptic('light');
    openWhatsAppChat({
      phone: sellerPhone,
      producerName: sellerName,
      buyerName: user?.name || 'Customer',
      listingTitle,
      language,
    });
  };

  return (
    <View style={styles.container}>
      {/* Primary Action Buttons: In-App Chat & WhatsApp Direct */}
      <View style={styles.contactActionsRow}>
        <TouchableOpacity
          style={styles.chatActionBtn}
          onPress={handleOpenChat}
          activeOpacity={0.8}
        >
          <MessageCircle size={15} color="#FFFFFF" />
          <Text style={styles.chatActionBtnText}>
            {language === 'as' ? 'চাট / ভইচ নোট' : 'Chat & Voice Note'}
          </Text>
          <Mic size={13} color="rgba(255, 255, 255, 0.85)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.whatsappActionBtn}
          onPress={handleOpenWhatsApp}
          activeOpacity={0.8}
        >
          <MessageCircle size={15} color="#25D366" />
          <Text style={styles.whatsappActionBtnText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Phone Call / Privacy Unlock Section */}
      {isUnlocked ? (
        <View style={styles.unlockedBox}>
          <View style={styles.phoneInfo}>
            <View style={styles.unlockedBadge}>
              <Unlock size={11} color={COLORS.primary} />
              <Text style={styles.unlockedLabel}>
                {language === 'as' ? 'নম্বৰ উন্মুক্ত' : 'Contact Unlocked'}
              </Text>
            </View>
            <Text style={styles.phoneText}>{sellerPhone}</Text>
          </View>

          <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.8}>
            <Phone size={13} color="#FFFFFF" />
            <Text style={styles.callButtonText}>
              {language === 'as' ? 'কল কৰক' : 'Call'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.maskedBox}>
          <View style={styles.maskedRow}>
            <View style={styles.maskedTextContainer}>
              <Text style={styles.maskedTitle}>
                {language === 'as' ? 'প্ৰত্যক্ষ ফোন কল' : 'Direct Phone Call'}
              </Text>
              <Text style={styles.maskedPhoneText}>
                {sellerPhone.slice(0, 8) + ' •••••'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.unlockButton}
              onPress={handleUnlock}
              disabled={isUnlocking}
              activeOpacity={0.8}
            >
              <Lock size={13} color="#FFFFFF" />
              <Text style={styles.unlockButtonText}>
                {isUnlocking
                  ? language === 'as'
                    ? 'অনুমোদন...'
                    : 'Unlocking...'
                  : language === 'as'
                  ? 'নম্বৰ চাওক'
                  : 'Unlock Call'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.privacyNote}>
            🔒 {language === 'as' ? 'নিৰাপত্তা আৰু গোপনীয়তা সংৰক্ষিত' : 'Privacy protected & audit-logged'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 10,
    gap: 10,
  },
  contactActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chatActionBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  chatActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  whatsappActionBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  whatsappActionBtnText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '800',
  },
  unlockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DCFCE7',
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
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  callButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  maskedBox: {
    paddingTop: 2,
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
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 1,
    marginTop: 2,
  },
  unlockButton: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  unlockButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  privacyNote: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
});
