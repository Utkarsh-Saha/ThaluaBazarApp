import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Header } from '../../components/Header';
import { HaatCard } from '../../components/HaatCard';
import { COLORS } from '../../constants/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useListings } from '../../context/ListingsContext';

export default function HaatsScreen() {
  const { language, t } = useLanguage();
  const { haats } = useListings();

  return (
    <View style={styles.container}>
      <Header
        subtitle={
          language === 'as'
            ? 'পৰম্পৰাগত সাপ্তাহিক বজাৰ আৰু কেন্দ্ৰ'
            : 'Traditional Weekly Rural Market Hubs'
        }
      />

      <FlatList
        data={haats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.introBox}>
            <Text style={styles.introTitle}>
              {language === 'as'
                ? 'অসমৰ প্ৰাচীন হাট সংস্কৃতি'
                : 'Assam’s Heritage Haat Culture'}
            </Text>
            <Text style={styles.introDescription}>
              {language === 'as'
                ? 'শতিকা পুৰণি সাপ্তাহিক হাটসমূহৰ পৰা পোনে পোনে থলুৱা উৎপাদকৰ সতেজ মাছ, জোহা চাউল, বাঁহৰ শিল্প আৰু মুগা কাপোৰ সংগ্ৰহ কৰক।'
                : 'Directly access historic weekly village markets where local farmers, fishermen, and handloom weavers assemble on specific market days.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => <HaatCard haat={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  introBox: {
    backgroundColor: COLORS.secondaryLight,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(198, 139, 23, 0.2)',
  },
  introTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.secondary,
    marginBottom: 4,
  },
  introDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
