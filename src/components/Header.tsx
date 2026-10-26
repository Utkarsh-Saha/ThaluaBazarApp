import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Globe,
  Bell,
  MessageCircle,
  MapPin,
  ChevronDown,
  Navigation,
  X,
  Search,
  Check,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useListings } from '../context/ListingsContext';
import { ASSAM_DISTRICTS } from '../lib/location';
import { triggerHaptic } from '../lib/haptics';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLanguageToggle?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showLanguageToggle = true,
}) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { language, toggleLanguage } = useLanguage();
  const {
    userCoords,
    isDetectingLocation,
    detectAndSetLocation,
    selectDistrictCoords,
  } = useListings();

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');

  const handleLanguageToggle = () => {
    triggerHaptic('light');
    toggleLanguage();
  };

  const handleDetectGPS = async () => {
    triggerHaptic('medium');
    await detectAndSetLocation();
    triggerHaptic('success');
    setShowLocationModal(false);
  };

  const handleSelectDistrict = (district: string) => {
    triggerHaptic('light');
    selectDistrictCoords(district);
    setShowLocationModal(false);
  };

  const filteredDistricts = ASSAM_DISTRICTS.filter((d) =>
    d.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const displayLocation = userCoords.village
    ? `${userCoords.village}, ${userCoords.district}`
    : `${userCoords.district} (Assam)`;

  return (
    <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.topRow}>
        <View style={styles.titleSection}>
          <Text style={styles.appName}>
            {title || (language === 'as' ? 'থলুৱা বজাৰ' : 'Thaluwa Bazar')}
          </Text>

          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : (
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => {
                triggerHaptic('light');
                setShowLocationModal(true);
              }}
              activeOpacity={0.7}
            >
              <MapPin size={12} color={COLORS.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {displayLocation}
              </Text>
              <ChevronDown size={12} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionsRow}>
          {showLanguageToggle && (
            <TouchableOpacity
              style={styles.langButton}
              onPress={handleLanguageToggle}
              activeOpacity={0.8}
            >
              <Globe size={15} color={COLORS.primary} />
              <Text style={styles.langText}>
                {language === 'en' ? 'অসমীয়া' : 'English'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => {
              triggerHaptic('light');
              router.push('/messages');
            }}
            activeOpacity={0.8}
          >
            <MessageCircle size={17} color={COLORS.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => {
              triggerHaptic('light');
              router.push('/notifications');
            }}
            activeOpacity={0.8}
          >
            <Bell size={17} color={COLORS.text} />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location / Assam District Picker Modal */}
      <Modal visible={showLocationModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {language === 'as' ? 'স্থান বাছক' : 'Choose Your Location'}
                </Text>
                <Text style={styles.modalSub}>
                  {language === 'as'
                    ? 'আপোনাৰ ওচৰৰ উৎপাদক আৰু আত্মসহায়ক গোটসমূহ বিচাৰক'
                    : 'Discover fresh produce within your vicinity'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowLocationModal(false)}
              >
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* GPS Auto-Detect Button */}
            <TouchableOpacity
              style={styles.gpsButton}
              onPress={handleDetectGPS}
              disabled={isDetectingLocation}
              activeOpacity={0.85}
            >
              <View style={styles.gpsIconCircle}>
                {isDetectingLocation ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Navigation size={18} color="#FFFFFF" />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsButtonTitle}>
                  {isDetectingLocation
                    ? language === 'as'
                      ? 'GPS স্থান চিনাক্ত কৰি থকা হৈছে...'
                      : 'Detecting Live GPS...'
                    : language === 'as'
                    ? 'বৰ্তমান GPS স্থান ব্যৱহাৰ কৰক'
                    : 'Use Current GPS Location'}
                </Text>
                <Text style={styles.gpsButtonSubtitle}>
                  {language === 'as'
                    ? 'স্বয়ংক্ৰিয়ভাৱে আপোনাৰ গাঁও/জিলাৰ দূৰত্ব নিৰ্ণয় কৰক'
                    : 'Auto-detect village & calculate live distances'}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>
                {language === 'as' ? 'বা অসমৰ জিলা নিৰ্বাচন কৰক' : 'OR SELECT ASSAM DISTRICT'}
              </Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Search Districts */}
            <View style={styles.searchBar}>
              <Search size={16} color={COLORS.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={language === 'as' ? 'জিলাৰ নাম সন্ধান কৰক...' : 'Search Assam district...'}
                placeholderTextColor={COLORS.textMuted}
                value={districtSearch}
                onChangeText={setDistrictSearch}
              />
              {districtSearch.length > 0 && (
                <TouchableOpacity onPress={() => setDistrictSearch('')}>
                  <X size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* District List */}
            <ScrollView style={styles.districtList} showsVerticalScrollIndicator={false}>
              {filteredDistricts.map((dist) => {
                const isSelected = userCoords.district.toLowerCase() === dist.toLowerCase();
                return (
                  <TouchableOpacity
                    key={dist}
                    style={[styles.districtItem, isSelected && styles.districtItemSelected]}
                    onPress={() => handleSelectDistrict(dist)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.districtItemLeft}>
                      <MapPin
                        size={16}
                        color={isSelected ? COLORS.primary : COLORS.textSecondary}
                      />
                      <Text
                        style={[
                          styles.districtItemText,
                          isSelected && styles.districtItemTextSelected,
                        ]}
                      >
                        {dist}
                      </Text>
                    </View>
                    {isSelected && <Check size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    maxWidth: 200,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(19, 117, 71, 0.2)',
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  notifBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(19, 117, 71, 0.3)',
    marginBottom: 16,
  },
  gpsIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsButtonTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gpsButtonSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    padding: 0,
  },
  districtList: {
    maxHeight: 280,
  },
  districtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  districtItemSelected: {
    backgroundColor: '#F5FCF7',
    borderRadius: 8,
  },
  districtItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  districtItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  districtItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
