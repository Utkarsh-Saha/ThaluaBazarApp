import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Image as ImageIcon, Sparkles, Check } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useListings } from '../../context/ListingsContext';
import { triggerHaptic } from '../../lib/haptics';

export default function AddProductScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { sellerProfile } = useAuth();
  const { categories, addNewListing } = useListings();

  const [titleEn, setTitleEn] = useState('Organic Kaji Nemu (Assam Lemon)');
  const [titleAs, setTitleAs] = useState('সতেজ অসমীয়া কাজি নেমু');
  const [descEn, setDescEn] = useState('Freshly plucked organic Assam lemon with intense aroma and juice.');
  const [descAs, setDescAs] = useState('বাৰীৰ সতেজ সুগন্ধি কাজি নেমু। অধিক ৰস আৰু ৰোগ প্ৰতিৰোধক ক্ষমতাযুক্ত।');
  const [categoryId, setCategoryId] = useState('6'); // Organic vegetables
  const [price, setPrice] = useState('60');
  const [unit, setUnit] = useState('kg');
  const [stock, setStock] = useState('25');
  const [isOrganic, setIsOrganic] = useState(true);
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=600&q=80'
  );

  const handleSubmit = () => {
    if (!titleEn || !price) return;
    triggerHaptic('success');

    const selectedCat = categories.find((c) => c.id === categoryId);

    addNewListing({
      seller_id: sellerProfile?.id || 's1',
      seller_name: sellerProfile?.business_name || 'Pragjyotishpur Mahila SHG',
      seller_phone: '+91 94350 12345',
      seller_type: sellerProfile?.seller_type || 'shg_member',
      category_id: categoryId,
      category_name_en: selectedCat?.name_en || 'Vegetables',
      category_name_as: selectedCat?.name_as || 'শাক-পাচলি',
      title_en: titleEn,
      title_as: titleAs,
      description_en: descEn,
      description_as: descAs,
      price: parseFloat(price) || 50,
      unit,
      stock: parseInt(stock, 10) || 10,
      image_url: imageUrl,
      lat: 26.435,
      lng: 92.03,
      village: sellerProfile?.village || 'Deomornoi',
      district: sellerProfile?.district || 'Darrang',
      rating: 5.0,
      status: 'active',
      is_organic: isOrganic,
    });

    router.replace('/seller/products');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: COLORS.surface }}
    >
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('addProduct')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Upload Box */}
        <Text style={styles.label}>Product Image (ম’বাইল ফটো)</Text>
        <View style={styles.imageUploadCard}>
          <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.imageActions}>
            <TouchableOpacity
              style={styles.imgBtn}
              onPress={() => {
                triggerHaptic('light');
                setImageUrl(
                  'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'
                );
              }}
            >
              <Camera size={16} color={COLORS.primary} />
              <Text style={styles.imgBtnText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imgBtn}
              onPress={() => {
                triggerHaptic('light');
                setImageUrl(
                  'https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=600&q=80'
                );
              }}
            >
              <ImageIcon size={16} color={COLORS.primary} />
              <Text style={styles.imgBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* English Title */}
        <Text style={styles.label}>Product Name (English)</Text>
        <TextInput
          style={styles.input}
          value={titleEn}
          onChangeText={setTitleEn}
          placeholder="e.g. Kola Joha Aromatic Rice"
          placeholderTextColor={COLORS.textMuted}
        />

        {/* Assamese Title */}
        <Text style={styles.label}>সামগ্ৰীৰ নাম (অসমীয়া)</Text>
        <TextInput
          style={styles.input}
          value={titleAs}
          onChangeText={setTitleAs}
          placeholder="যেনে: সুগন্ধি ক’লা জোহা চাউল"
          placeholderTextColor={COLORS.textMuted}
        />

        {/* Category Picker Chips */}
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map((cat) => {
            const isSelected = categoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, isSelected && styles.selectedCatChip]}
                onPress={() => {
                  triggerHaptic('light');
                  setCategoryId(cat.id);
                }}
              >
                <Text style={[styles.catChipText, isSelected && styles.selectedCatText]}>
                  {language === 'as' ? cat.name_as : cat.name_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Price & Unit & Stock */}
        <View style={styles.rowInputs}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Price (₹)</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="120"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Unit</Text>
            <TextInput
              style={styles.input}
              value={unit}
              onChangeText={setUnit}
              placeholder="kg / piece / pack"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Stock</Text>
            <TextInput
              style={styles.input}
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              placeholder="45"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        </View>

        {/* Organic Switch */}
        <View style={styles.switchRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Sparkles size={16} color={COLORS.primary} />
            <Text style={styles.switchLabel}>
              {language === 'as' ? 'থলুৱা জৈৱিক (Organic / Chemical-free)' : 'Local Organic / Chemical-free'}
            </Text>
          </View>
          <Switch
            value={isOrganic}
            onValueChange={setIsOrganic}
            trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
            thumbColor={isOrganic ? COLORS.primary : '#FFFFFF'}
          />
        </View>

        {/* English Description */}
        <Text style={styles.label}>Description (English)</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          multiline
          value={descEn}
          onChangeText={setDescEn}
          placeholder="Describe harvest method, freshness, origin village..."
          placeholderTextColor={COLORS.textMuted}
        />

        {/* Assamese Description */}
        <Text style={styles.label}>বিৱৰণ (অসমীয়া)</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          multiline
          value={descAs}
          onChangeText={setDescAs}
          placeholder="উৎপাদনৰ পদ্ধতি, সতেজতা, খেতিৰ তথ্য..."
          placeholderTextColor={COLORS.textMuted}
        />

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.88}>
          <Check size={18} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>
            {language === 'as' ? 'সামগ্ৰী তালিকাভুক্ত কৰক' : 'Publish to Hyperlocal Feed'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  content: {
    padding: 20,
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  imageUploadCard: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewImage: {
    width: '100%',
    height: 160,
  },
  imageActions: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
    backgroundColor: COLORS.surface,
  },
  imgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 8,
    borderRadius: 8,
  },
  imgBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  catScroll: {
    marginVertical: 4,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  selectedCatChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectedCatText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 16,
    ...SHADOWS.sm,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
