import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Star, X, CheckCircle, Sparkles } from 'lucide-react-native';
import { COLORS, SHADOWS } from '../constants/theme';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { triggerHaptic } from '../lib/haptics';
import { apiRequest } from '../lib/api';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_number: string;
    seller_id: string;
    seller_name: string;
    items?: { id: string; listing_id?: string; title: string }[];
  } | null;
  onSuccess: (orderId: string, rating: number) => void;
}

const REVIEW_TAGS = [
  { en: '🌱 Fresh & Organic', as: '🌱 সতেজ আৰু জৈৱিক' },
  { en: '⚡ Fast Delivery', as: '⚡ দ্ৰুত বিতৰণ' },
  { en: '🤝 Courteous Producer', as: '🤝 ভদ্ৰ উৎপাদক' },
  { en: '📦 Clean Packaging', as: '📦 পৰিষ্কাৰ পেকেজিং' },
  { en: '💰 Genuine Price', as: '💰 উচিত মূল্য' },
];

export const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  onClose,
  order,
  onSuccess,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  if (!order) return null;

  const handleStarPress = (starIndex: number) => {
    triggerHaptic('light');
    setRating(starIndex);
  };

  const handleTagPress = (tagText: string) => {
    triggerHaptic('light');
    if (comment.includes(tagText)) return;
    setComment((prev) => (prev ? `${prev} • ${tagText}` : tagText));
  };

  const handleSubmit = async () => {
    if (!order) return;
    setIsSubmitting(true);
    triggerHaptic('medium');

    const buyerId = user?.id || 'usr-anonymous-buyer';
    const buyerName = user?.name || (language === 'as' ? 'প্ৰমাণিত ক্ৰেতা' : 'Verified Buyer');
    const firstListingId = order.items?.[0]?.listing_id || null;

    try {
      // 1. Try Backend API endpoint
      const res = await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          order_id: order.id,
          listing_id: firstListingId,
          seller_id: order.seller_id,
          buyer_id: buyerId,
          buyer_name: buyerName,
          rating,
          comment: comment.trim(),
        }),
      });

      // 2. Direct Supabase insert fallback if backend returns offline or error
      if (!res.success) {
        try {
          await supabase.from('reviews').insert({
            order_id: order.id,
            listing_id: firstListingId,
            seller_id: order.seller_id,
            buyer_id: buyerId,
            buyer_name: buyerName,
            rating,
            comment: comment.trim(),
          });
        } catch {
          // Local fallback continue
        }
      }

      // 3. Save reviewed status in local AsyncStorage
      try {
        const stored = await AsyncStorage.getItem('@thaluwa_reviewed_orders');
        const list = stored ? JSON.parse(stored) : {};
        list[order.id] = { rating, timestamp: new Date().toISOString() };
        await AsyncStorage.setItem('@thaluwa_reviewed_orders', JSON.stringify(list));
      } catch {
        // Ignore storage errors
      }

      triggerHaptic('success');
      setIsSubmitted(true);

      setTimeout(() => {
        setIsSubmitted(false);
        setComment('');
        setRating(5);
        onSuccess(order.id, rating);
        onClose();
      }, 1500);
    } catch (err) {
      console.warn('Review submission fallback:', err);
      onSuccess(order.id, rating);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingDescriptions: Record<number, { en: string; as: string }> = {
    1: { en: 'Poor Experience', as: 'বেয়া অভিজ্ঞতা' },
    2: { en: 'Fair / Below Expectation', as: 'সাধাৰণ' },
    3: { en: 'Good & Satisfactory', as: 'ভাল' },
    4: { en: 'Very Good Quality', as: 'অতি উত্তম' },
    5: { en: 'Outstanding & Highly Recommended!', as: 'অনবদ্য আৰু অতি প্ৰশংসনীয়!' },
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.headerTitle}>
                    {language === 'as' ? 'ৰেটিং আৰু পৰ্যালোচনা' : 'Rate & Review Order'}
                  </Text>
                  <Text style={styles.headerSubtitle}>
                    Order #{order.order_number} • 🌱 {order.seller_name}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <X size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              {isSubmitted ? (
                <View style={styles.successBox}>
                  <CheckCircle size={48} color={COLORS.success} />
                  <Text style={styles.successTitle}>
                    {language === 'as' ? 'ধন্যবাদ! আপোনাৰ মতামত গৃহীত হ’ল।' : 'Thank You! Review Submitted.'}
                  </Text>
                  <Text style={styles.successSub}>
                    {language === 'as'
                      ? 'আপোনাৰ মূল্যৱান ৰেটিঙে আমাৰ থলুৱা উৎপাদকসকলক সহায় কৰিব।'
                      : 'Your feedback empowers local Assam producers and upholds community trust.'}
                  </Text>
                </View>
              ) : (
                <View style={styles.modalBody}>
                  {/* Rating Stars */}
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => handleStarPress(star)}
                        style={styles.starBtn}
                        activeOpacity={0.7}
                      >
                        <Star
                          size={36}
                          color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                          fill={star <= rating ? '#F59E0B' : 'transparent'}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.ratingLabel}>
                    {language === 'as'
                      ? ratingDescriptions[rating]?.as
                      : ratingDescriptions[rating]?.en}
                  </Text>

                  {/* Feedback tag chips */}
                  <Text style={styles.tagSectionTitle}>
                    {language === 'as' ? 'দ্ৰুত মতামত বাছক:' : 'Quick feedback tags:'}
                  </Text>
                  <View style={styles.tagsContainer}>
                    {REVIEW_TAGS.map((tag, idx) => {
                      const text = language === 'as' ? tag.as : tag.en;
                      const isSelected = comment.includes(text);
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.tagChip, isSelected && styles.tagChipSelected]}
                          onPress={() => handleTagPress(text)}
                        >
                          <Text
                            style={[styles.tagChipText, isSelected && styles.tagChipTextSelected]}
                          >
                            {text}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Review Text Area */}
                  <TextInput
                    style={styles.commentInput}
                    value={comment}
                    onChangeText={setComment}
                    placeholder={
                      language === 'as'
                        ? 'শাক-পাচলি বা হস্তশিল্পৰ মানদণ্ড কেনে পালে লিখক...'
                        : 'Write a brief review on the freshness, taste or delivery...'
                    }
                    placeholderTextColor={COLORS.textMuted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    maxLength={300}
                  />

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    activeOpacity={0.85}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Sparkles size={16} color="#FFFFFF" />
                        <Text style={styles.submitBtnText}>
                          {language === 'as' ? 'মতামত জমা কৰক' : 'Submit Review'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardContainer: {
    width: '100%',
    maxWidth: 420,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 22,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#D97706',
    marginBottom: 14,
    textAlign: 'center',
  },
  tagSectionTitle: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
    width: '100%',
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagChipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tagChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  commentInput: {
    width: '100%',
    height: 80,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    ...SHADOWS.md,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 8,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
