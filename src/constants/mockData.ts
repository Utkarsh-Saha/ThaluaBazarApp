import { Listing, ProductCategory, Order } from '../types';

export const INITIAL_CATEGORIES: ProductCategory[] = [
  { id: '1', slug: 'rice', name_en: 'Joha & Bora Rice', name_as: 'জোহা আৰু বৰা ধান', icon: 'wheat' },
  { id: '2', slug: 'silk', name_en: 'Muga & Eri Silk', name_as: 'মুগা আৰু এৰী কাপোৰ', icon: 'sparkles' },
  { id: '3', slug: 'bamboo', name_en: 'Bamboo & Cane', name_as: 'বাঁহ-বেতৰ শিল্প', icon: 'hammer' },
  { id: '4', slug: 'tea', name_en: 'CTC & Orthodox Tea', name_as: 'অসম চাহপাত', icon: 'coffee' },
  { id: '5', slug: 'fish', name_en: 'River Fish & Shutki', name_as: 'লোকেল মাছ আৰু শুকতি', icon: 'fish' },
  { id: '6', slug: 'vegetables', name_en: 'Organic Vegetables', name_as: 'সতেজ থলুৱা শাক-পাচলি', icon: 'salad' },
  { id: '7', slug: 'spices', name_en: 'Bhut Jolokia & Spices', name_as: 'ভোট জলকীয়া আৰু মচলা', icon: 'flame' },
  { id: '8', slug: 'dairy', name_en: 'Pure Buffalo Ghee', name_as: 'ম’হৰ খাঁটি ঘিউ-দৈ', icon: 'cup-soda' },
];

export const INITIAL_LISTINGS: Listing[] = [];

export const INITIAL_ORDERS: Order[] = [];
