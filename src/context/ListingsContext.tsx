import React, { createContext, useContext, useState } from 'react';
import { Listing, ProductCategory, HaatMarket, ContactUnlock } from '../types';
import { INITIAL_LISTINGS, INITIAL_CATEGORIES, INITIAL_HAATS } from '../constants/mockData';
import { calculateDistanceKm, DEFAULT_COORDS } from '../lib/location';

interface ListingsContextType {
  listings: Listing[];
  categories: ProductCategory[];
  haats: HaatMarket[];
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
  selectedCategory: string | null;
  setSelectedCategory: (catId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredListings: Listing[];
  getListingById: (id: string) => Listing | undefined;
  addNewListing: (listingData: Omit<Listing, 'id' | 'created_at'>) => void;
  toggleListingStatus: (id: string) => void;
  unlockedContacts: Record<string, boolean>;
  unlockSellerContact: (listingId: string, buyerId: string, sellerId: string) => Promise<boolean>;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

export const ListingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [categories] = useState<ProductCategory[]>(INITIAL_CATEGORIES);
  const [haats] = useState<HaatMarket[]>(INITIAL_HAATS);
  
  // Radius filter state (1km to 25km, default 15km)
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Masked contact unlock records
  const [unlockedContacts, setUnlockedContacts] = useState<Record<string, boolean>>({});

  // Filter listings based on radius, category, search query and active status
  const filteredListings = listings.filter((item) => {
    // Distance check
    const dist = calculateDistanceKm(
      DEFAULT_COORDS.lat,
      DEFAULT_COORDS.lng,
      item.lat,
      item.lng
    );
    const inRadius = dist <= radiusKm;

    // Category filter
    const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;

    // Search query filter (matches English or Assamese title / seller name / village)
    const matchesSearch = searchQuery
      ? item.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title_as.includes(searchQuery) ||
        item.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.village.toLowerCase().includes(searchQuery.toLowerCase())
      : true;

    return inRadius && matchesCategory && matchesSearch;
  });

  const getListingById = (id: string) => {
    return listings.find((l) => l.id === id);
  };

  const addNewListing = (listingData: Omit<Listing, 'id' | 'created_at'>) => {
    const newListing: Listing = {
      ...listingData,
      id: `l-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setListings((prev) => [newListing, ...prev]);
  };

  const toggleListingStatus = (id: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' }
          : item
      )
    );
  };

  const unlockSellerContact = async (
    listingId: string,
    buyerId: string,
    sellerId: string
  ): Promise<boolean> => {
    // Simulated PostGIS / Supabase contact_unlocks audit record insertion
    const record: ContactUnlock = {
      id: `cu-${Date.now()}`,
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: listingId,
      payment_status: 'free_tier',
      created_at: new Date().toISOString(),
    };
    console.log('Audited contact unlock created:', record);
    setUnlockedContacts((prev) => ({ ...prev, [listingId]: true }));
    return true;
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        categories,
        haats,
        radiusKm,
        setRadiusKm,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        filteredListings,
        getListingById,
        addNewListing,
        toggleListingStatus,
        unlockedContacts,
        unlockSellerContact,
      }}
    >
      {children}
    </ListingsContext.Provider>
  );
};

export const useListings = () => {
  const context = useContext(ListingsContext);
  if (!context) {
    throw new Error('useListings must be used within a ListingsProvider');
  }
  return context;
};
