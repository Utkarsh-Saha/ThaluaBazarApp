import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode } from '../types';
import { TRANSLATIONS } from '../i18n/translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  toggleLanguage: () => void;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = '@thaluwa_bazar_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((saved) => {
      if (saved === 'as' || saved === 'en') {
        setLanguageState(saved);
      }
    });
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'as' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: keyof typeof TRANSLATIONS['en']): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['en'][key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
