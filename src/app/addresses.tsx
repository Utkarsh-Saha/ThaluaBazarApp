import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Home,
  Briefcase,
  Sprout,
  Check,
  Trash2,
  Edit2,
  X,
} from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { triggerHaptic } from '../lib/haptics';

interface AddressItem {
  id: string;
  name: string;
  phone: string;
  type: 'home' | 'work' | 'farm';
  street: string;
  village: string;
  district: string;
  pincode: string;
  landmark?: string;
  isDefault: boolean;
}

const INITIAL_ADDRESSES: AddressItem[] = [
  {
    id: 'addr-1',
    name: 'John Doe',
    phone: '+91 98765 43210',
    type: 'home',
    street: 'Ward No 4, Hospital Road',
    village: 'Mangaldai Town',
    district: 'Darrang',
    pincode: '784125',
    landmark: 'Near Civil Hospital',
    isDefault: true,
  },
  {
    id: 'addr-2',
    name: 'John Doe (Farm)',
    phone: '+91 98765 43210',
    type: 'farm',
    street: 'Paddy Field Plot #12, Deomornoi Road',
    village: 'Deomornoi Village',
    district: 'Darrang',
    pincode: '784145',
    landmark: 'Behind Weekly Haat Ground',
    isDefault: false,
  },
];

export default function AddressesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();

  const [addresses, setAddresses] = useState<AddressItem[]>(INITIAL_ADDRESSES);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    type: 'home' as 'home' | 'work' | 'farm',
    street: '',
    village: '',
    district: 'Darrang',
    pincode: '',
    landmark: '',
  });

  const handleSetDefault = (id: string) => {
    triggerHaptic('success');
    setAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      }))
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      language === 'as' ? 'ঠিকনা মচি পেলাব নে?' : 'Delete Address?',
      language === 'as'
        ? 'আপুনি নিশ্চিতনে এই ঠিকনা মচি পেলাব খোজে?'
        : 'Are you sure you want to remove this delivery address?',
      [
        { text: language === 'as' ? 'বাতিল' : 'Cancel', style: 'cancel' },
        {
          text: language === 'as' ? 'মচক' : 'Delete',
          style: 'destructive',
          onPress: () => {
            triggerHaptic('medium');
            setAddresses((prev) => prev.filter((a) => a.id !== id));
          },
        },
      ]
    );
  };

  const handleSaveAddress = () => {
    if (!formData.name || !formData.street || !formData.village || !formData.pincode) {
      Alert.alert(
        language === 'as' ? 'তথ্য অপূৰ্ণ' : 'Incomplete Details',
        language === 'as'
          ? 'অনুগ্ৰহ কৰি নাম, ঠিকনা, গাঁও আৰু পিন কোড পূৰণ কৰক।'
          : 'Please enter your name, street address, village and PIN code.'
      );
      return;
    }

    triggerHaptic('success');
    const newAddr: AddressItem = {
      id: `addr-${Date.now()}`,
      name: formData.name,
      phone: formData.phone || '+91 98765 43210',
      type: formData.type,
      street: formData.street,
      village: formData.village,
      district: formData.district,
      pincode: formData.pincode,
      landmark: formData.landmark,
      isDefault: addresses.length === 0,
    };

    setAddresses((prev) => [newAddr, ...prev]);
    setModalVisible(false);
    setFormData({
      name: '',
      phone: '',
      type: 'home',
      street: '',
      village: '',
      district: 'Darrang',
      pincode: '',
      landmark: '',
    });
  };

  const getTypeIcon = (type: AddressItem['type']) => {
    switch (type) {
      case 'farm':
        return <Sprout size={16} color={COLORS.secondary} />;
      case 'work':
        return <Briefcase size={16} color={COLORS.accent} />;
      default:
        return <Home size={16} color={COLORS.primary} />;
    }
  };

  const getTypeBadgeBg = (type: AddressItem['type']) => {
    switch (type) {
      case 'farm':
        return COLORS.secondaryLight;
      case 'work':
        return COLORS.accentLight;
      default:
        return COLORS.primaryLight;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {language === 'as' ? 'সংৰক্ষিত ঠিকনাসমূহ' : 'Delivery Addresses'}
        </Text>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            triggerHaptic('light');
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Plus size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Address List */}
      <FlatList
        data={addresses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MapPin size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>
              {language === 'as' ? 'কোনো ঠিকনা নাই' : 'No saved addresses'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'as'
                ? 'অনুগ্ৰহ কৰি সামগ্ৰী ডেলিভাৰীৰ বাবে নতুন ঠিকনা যোগ কৰক'
                : 'Add delivery addresses to order fresh local products easily'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.addressCard, item.isDefault && styles.defaultCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={[styles.typeBadge, { backgroundColor: getTypeBadgeBg(item.type) }]}>
                  {getTypeIcon(item.type)}
                  <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
                </View>
                {item.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>
                      {language === 'as' ? 'ডিফল্ট' : 'Default'}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={styles.deleteBtn}
                activeOpacity={0.7}
              >
                <Trash2 size={16} color={COLORS.error} />
              </TouchableOpacity>
            </View>

            <Text style={styles.nameText}>{item.name}</Text>
            <Text style={styles.addressLine}>
              {item.street}, {item.village}
            </Text>
            <Text style={styles.addressLine}>
              {item.district}, Assam - {item.pincode}
            </Text>
            {item.landmark ? (
              <Text style={styles.landmarkText}>
                {language === 'as' ? 'চিন:' : 'Landmark:'} {item.landmark}
              </Text>
            ) : null}
            <Text style={styles.phoneText}>📞 {item.phone}</Text>

            {!item.isDefault && (
              <TouchableOpacity
                style={styles.setDefaultBtn}
                onPress={() => handleSetDefault(item.id)}
                activeOpacity={0.8}
              >
                <Check size={14} color={COLORS.primary} />
                <Text style={styles.setDefaultText}>
                  {language === 'as' ? 'ডিফল্ট ঠিকনা হিচাপে নিৰ্ধাৰণ কৰক' : 'Set as Default Address'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Add Address Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'as' ? 'নতুন ঠিকনা যোগ কৰক' : 'Add New Address'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              {/* Type selector */}
              <Text style={styles.inputLabel}>{language === 'as' ? 'ঠিকনাৰ প্ৰকাৰ' : 'Address Type'}</Text>
              <View style={styles.typeSelector}>
                {(['home', 'farm', 'work'] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeOption, formData.type === t && styles.activeTypeOption]}
                    onPress={() => setFormData({ ...formData, type: t })}
                  >
                    {getTypeIcon(t)}
                    <Text
                      style={[
                        styles.typeOptionText,
                        formData.type === t && styles.activeTypeOptionText,
                      ]}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{language === 'as' ? 'পূৰ্ণ নাম' : 'Full Name'}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Biren Das"
                value={formData.name}
                onChangeText={(t) => setFormData({ ...formData, name: t })}
              />

              <Text style={styles.inputLabel}>{language === 'as' ? 'ফোন নম্বৰ' : 'Phone Number'}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 9876543210"
                keyboardType="phone-pad"
                value={formData.phone}
                onChangeText={(t) => setFormData({ ...formData, phone: t })}
              />

              <Text style={styles.inputLabel}>
                {language === 'as' ? 'ঘৰ/ৰাস্তা/চুক' : 'House No / Street / Ward'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Ward No 2, Main Road"
                value={formData.street}
                onChangeText={(t) => setFormData({ ...formData, street: t })}
              />

              <Text style={styles.inputLabel}>{language === 'as' ? 'গাঁও / চহৰ' : 'Village / Town'}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Sipajhar / Mangaldai"
                value={formData.village}
                onChangeText={(t) => setFormData({ ...formData, village: t })}
              />

              <View style={styles.rowInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{language === 'as' ? 'জিলা' : 'District'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Darrang"
                    value={formData.district}
                    onChangeText={(t) => setFormData({ ...formData, district: t })}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.inputLabel}>{language === 'as' ? 'পিন কোড' : 'PIN Code'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 784125"
                    keyboardType="number-pad"
                    value={formData.pincode}
                    onChangeText={(t) => setFormData({ ...formData, pincode: t })}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>
                {language === 'as' ? 'চিনাকি স্থান (ঐচ্ছিক)' : 'Landmark (Optional)'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Near Namghar / LP School"
                value={formData.landmark}
                onChangeText={(t) => setFormData({ ...formData, landmark: t })}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveAddress}
                activeOpacity={0.85}
              >
                <Text style={styles.saveBtnText}>
                  {language === 'as' ? 'ঠিকনা সংৰক্ষণ কৰক' : 'Save Address'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  addBtn: {
    padding: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  addressCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  defaultCard: {
    borderColor: 'rgba(19, 117, 71, 0.4)',
    backgroundColor: '#F9FDFB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.text,
  },
  defaultBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteBtn: {
    padding: 4,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  landmarkText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  phoneText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 8,
  },
  setDefaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  setDefaultText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  activeTypeOption: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  typeOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  activeTypeOptionText: {
    color: COLORS.primary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    ...SHADOWS.md,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
