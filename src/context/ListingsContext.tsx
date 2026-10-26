import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Listing, ProductCategory, ContactUnlock } from '../types';
import { INITIAL_LISTINGS, INITIAL_CATEGORIES } from '../constants/mockData';
import {
  calculateDistanceKm,
  DEFAULT_COORDS,
  UserCoords,
  getCurrentUserLocation,
  loadSavedUserCoords,
  saveUserCoordsToStorage,
  ASSAM_DISTRICT_CENTROIDS,
} from '../lib/location';
import { supabase } from '../lib/supabase';
import { offlineSyncManager } from '../lib/offlineSync';

export type SortOption = 'distance' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

export interface FilterOptions {
  organicOnly: boolean;
  inStockOnly: boolean;
  maxPrice: number | null;
  minRating: number | null;
  sortBy: SortOption;
}

export const DEFAULT_FILTERS: FilterOptions = {
  organicOnly: false,
  inStockOnly: false,
  maxPrice: null,
  minRating: null,
  sortBy: 'distance',
};

interface ListingsContextType {
  listings: Listing[];
  categories: ProductCategory[];
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
  selectedCategory: string | null;
  setSelectedCategory: (catId: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  filteredListings: Listing[];
  getListingById: (id: string) => Listing | undefined;
  addNewListing: (listingData: Omit<Listing, 'id' | 'created_at'>) => Promise<Listing>;
  toggleListingStatus: (id: string) => Promise<void>;
  unlockedContacts: Record<string, boolean>;
  unlockSellerContact: (listingId: string, buyerId: string, sellerId: string) => Promise<boolean>;
  wishlist: string[];
  toggleWishlist: (listingId: string) => void;
  isWishlisted: (listingId: string) => boolean;
  refreshListings: () => Promise<void>;
  isLoading: boolean;
  userCoords: UserCoords;
  setUserCoords: (coords: UserCoords) => void;
  isDetectingLocation: boolean;
  detectAndSetLocation: () => Promise<UserCoords>;
  selectDistrictCoords: (district: string) => void;
  isOffline: boolean;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

export const ListingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [categories, setCategories] = useState<ProductCategory[]>(INITIAL_CATEGORIES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Radius filter state (1km to 25km, default 15km)
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Advanced catalog filters
  const [filters, setFilters] = useState<FilterOptions>(DEFAULT_FILTERS);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.organicOnly ||
      filters.inStockOnly ||
      filters.maxPrice !== null ||
      filters.minRating !== null ||
      filters.sortBy !== 'distance'
    );
  }, [filters]);
  
  // Masked contact unlock records
  const [unlockedContacts, setUnlockedContacts] = useState<Record<string, boolean>>({});
  
  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>(['l1', 'l3']);

  // Dynamic User GPS Location State
  const [userCoords, setUserCoords] = useState<UserCoords>(DEFAULT_COORDS);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!offlineSyncManager.isOnline);

  // Initialize cached location on mount
  useEffect(() => {
    async function initLocation() {
      const cached = await loadSavedUserCoords();
      if (cached) {
        setUserCoords(cached);
      }
    }
    initLocation();
  }, []);

  const detectAndSetLocation = useCallback(async (): Promise<UserCoords> => {
    setIsDetectingLocation(true);
    try {
      const detected = await getCurrentUserLocation();
      setUserCoords(detected);
      return detected;
    } finally {
      setIsDetectingLocation(false);
    }
  }, []);

  const selectDistrictCoords = useCallback((district: string) => {
    const centroid = ASSAM_DISTRICT_CENTROIDS[district];
    if (centroid) {
      const newCoords: UserCoords = {
        lat: centroid.lat,
        lng: centroid.lng,
        district,
        village: centroid.village,
        formattedAddress: `${centroid.village}, ${district} (Assam)`,
        isCustomSelected: true,
      };
      setUserCoords(newCoords);
      saveUserCoordsToStorage(newCoords);
    }
  }, []);

  const mapDbListing = (row: any): Listing => ({
    id: row.id.toString(),
    seller_id: row.seller_id || 's1',
    seller_name: row.seller_name || 'Village Farmer',
    seller_type: row.seller_type || 'shg_member',
    seller_phone: row.seller_phone || '+91 94350 00000',
    category_id: row.category_id || 'c1',
    category_name_en: row.category_name_en || 'Vegetables',
    category_name_as: row.category_name_as || 'শাক-পাচলি',
    title_en: row.title_en,
    title_as: row.title_as,
    description_en: row.description_en || '',
    description_as: row.description_as || '',
    price: Number(row.price),
    unit: row.unit || 'kg',
    stock: row.stock || 10,
    image_url: row.image_url,
    lat: Number(row.lat || DEFAULT_COORDS.lat),
    lng: Number(row.lng || DEFAULT_COORDS.lng),
    village: row.village || 'Mangaldai',
    district: row.district || 'Darrang',
    rating: Number(row.rating || 4.8),
    status: row.status || 'active',
    is_organic: row.is_organic ?? true,
    created_at: row.created_at || new Date().toISOString(),
  });

  const fetchLiveListings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped = data.map(mapDbListing);
        setListings(mapped);
        offlineSyncManager.cacheListings(mapped);
      }
    } catch (err) {
      console.log('Supabase listings fetch error, using local/cached data:', err);
      const cached = await offlineSyncManager.getCachedListings();
      if (cached && cached.length > 0) {
        setListings(cached);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLiveCategories = async () => {
    try {
      const { data } = await supabase.from('categories').select('*');
      if (data && data.length > 0) {
        setCategories(data);
        offlineSyncManager.cacheCategories(data);
      }
    } catch {
      const cachedCats = await offlineSyncManager.getCachedCategories();
      if (cachedCats && cachedCats.length > 0) {
        setCategories(cachedCats);
      }
    }
  };

  // Fetch initial data from Supabase & Hydrate from Cache
  useEffect(() => {
    // 1. Immediately hydrate from cache so user sees produce instantly even offline
    offlineSyncManager.getCachedListings().then((cached) => {
      if (cached && cached.length > 0) {
        setListings(cached);
      }
    });

    offlineSyncManager.getCachedCategories().then((cachedCats) => {
      if (cachedCats && cachedCats.length > 0) {
        setCategories(cachedCats);
      }
    });

    // 2. Subscribe to network status
    const unsubNet = offlineSyncManager.subscribeToNetwork((online) => {
      setIsOffline(!online);
      if (online) {
        fetchLiveListings();
        fetchLiveCategories();
      }
    });

    fetchLiveListings();
    fetchLiveCategories();

    // Subscribe to realtime updates on listings
    const channel = supabase
      .channel('realtime_listings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = mapDbListing(payload.new);
            setListings((prev) => {
              const updated = [newItem, ...prev.filter((i) => i.id !== newItem.id)];
              offlineSyncManager.cacheListings(updated);
              return updated;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedItem = mapDbListing(payload.new);
            setListings((prev) => {
              const updatedList = prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
              offlineSyncManager.cacheListings(updatedList);
              return updatedList;
            });
          } else if (payload.eventType === 'DELETE') {
            setListings((prev) => {
              const updatedList = prev.filter((item) => item.id !== (payload.old as any).id);
              offlineSyncManager.cacheListings(updatedList);
              return updatedList;
            });
          }
        }
      )
      .subscribe();

    return () => {
      unsubNet();
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleWishlist = (listingId: string) => {
    setWishlist((prev) =>
      prev.includes(listingId)
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId]
    );
  };

  const isWishlisted = (listingId: string) => wishlist.includes(listingId);

  // Filter listings based on radius, category, search query and active status with real GPS distance
  const filteredListings = useMemo(() => {
    return listings
      .map((item) => {
        const dist = calculateDistanceKm(
          userCoords.lat,
          userCoords.lng,
          item.lat,
          item.lng
        );
        return {
          ...item,
          distance_km: dist,
        };
      })
      .filter((item) => {
        // Distance check
        const inRadius = item.distance_km <= radiusKm;

        // Category filter
        const matchesCategory = selectedCategory ? item.category_id === selectedCategory : true;

        // Search query filter (matches English or Assamese title / seller name / village / district)
        const matchesSearch = searchQuery
          ? item.title_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.title_as.includes(searchQuery) ||
            item.seller_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.district.toLowerCase().includes(searchQuery.toLowerCase())
          : true;

        // Organic certified filter
        const matchesOrganic = filters.organicOnly ? item.is_organic : true;

        // In-stock only filter
        const matchesInStock = filters.inStockOnly ? item.stock > 0 && item.status !== 'sold_out' : true;

        // Max price filter
        const matchesPrice = filters.maxPrice !== null ? item.price <= filters.maxPrice : true;

        // Min rating filter
        const matchesRating = filters.minRating !== null ? (item.rating || 0) >= filters.minRating : true;

        return (
          inRadius &&
          matchesCategory &&
          matchesSearch &&
          matchesOrganic &&
          matchesInStock &&
          matchesPrice &&
          matchesRating
        );
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'price_asc':
            return a.price - b.price;
          case 'price_desc':
            return b.price - a.price;
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case 'distance':
          default:
            return a.distance_km - b.distance_km;
        }
      });
  }, [listings, userCoords, radiusKm, selectedCategory, searchQuery, filters]);

  const getListingById = (id: string) => {
    return listings.find((l) => l.id === id);
  };

  const addNewListing = async (listingData: Omit<Listing, 'id' | 'created_at'>): Promise<Listing> => {
    const newListing: Listing = {
      ...listingData,
      id: `l-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    // Optimistic UI update
    setListings((prev) => [newListing, ...prev]);

    // Save to Supabase
    try {
      const { data, error } = await supabase.from('listings').insert([
        {
          seller_id: listingData.seller_id,
          seller_name: listingData.seller_name,
          seller_type: listingData.seller_type || 'shg_member',
          seller_phone: listingData.seller_phone,
          category_id: listingData.category_id,
          category_name_en: listingData.category_name_en,
          category_name_as: listingData.category_name_as,
          title_en: listingData.title_en,
          title_as: listingData.title_as,
          description_en: listingData.description_en,
          description_as: listingData.description_as,
          price: listingData.price,
          unit: listingData.unit,
          stock: listingData.stock,
          image_url: listingData.image_url,
          lat: listingData.lat,
          lng: listingData.lng,
          village: listingData.village,
          district: listingData.district,
          rating: 4.8,
          status: 'active',
          is_organic: listingData.is_organic ?? true,
        },
      ]).select().single();

      if (data && !error) {
        const saved = mapDbListing(data);
        setListings((prev) => prev.map((item) => (item.id === newListing.id ? saved : item)));
        return saved;
      }
    } catch (e) {
      console.log('Supabase insert listing fallback:', e);
    }

    return newListing;
  };

  const toggleListingStatus = async (id: string) => {
    const current = listings.find((l) => l.id === id);
    const nextStatus = current?.status === 'active' ? 'inactive' : 'active';

    setListings((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      await supabase
        .from('listings')
        .update({ status: nextStatus })
        .eq('id', id);
    } catch (e) {
      console.log('Supabase update status fallback:', e);
    }
  };

  const unlockSellerContact = async (
    listingId: string,
    buyerId: string,
    sellerId: string
  ): Promise<boolean> => {
    const record: ContactUnlock = {
      id: `cu-${Date.now()}`,
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: listingId,
      payment_status: 'free_tier',
      created_at: new Date().toISOString(),
    };

    setUnlockedContacts((prev) => ({ ...prev, [listingId]: true }));

    try {
      await supabase.from('contact_unlocks').insert([
        {
          buyer_id: buyerId,
          seller_id: sellerId,
          listing_id: listingId,
          payment_status: 'free_tier',
        },
      ]);
    } catch (e) {
      console.log('Supabase contact unlock audit fallback:', e);
    }

    return true;
  };

  const refreshListings = async () => {
    await fetchLiveListings();
  };

  return (
    <ListingsContext.Provider
      value={{
        listings,
        categories,
        radiusKm,
        setRadiusKm,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        filters,
        setFilters,
        resetFilters,
        hasActiveFilters,
        filteredListings,
        getListingById,
        addNewListing,
        toggleListingStatus,
        unlockedContacts,
        unlockSellerContact,
        wishlist,
        toggleWishlist,
        isWishlisted,
        refreshListings,
        isLoading,
        userCoords,
        setUserCoords,
        isDetectingLocation,
        detectAndSetLocation,
        selectDistrictCoords,
        isOffline,
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
