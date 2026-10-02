import React, { createContext, useContext, useState, useEffect } from 'react';
import { Listing, ProductCategory, HaatMarket, ContactUnlock } from '../types';
import { INITIAL_LISTINGS, INITIAL_CATEGORIES, INITIAL_HAATS } from '../constants/mockData';
import { calculateDistanceKm, DEFAULT_COORDS } from '../lib/location';
import { supabase } from '../lib/supabase';

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
  addNewListing: (listingData: Omit<Listing, 'id' | 'created_at'>) => Promise<Listing>;
  toggleListingStatus: (id: string) => Promise<void>;
  unlockedContacts: Record<string, boolean>;
  unlockSellerContact: (listingId: string, buyerId: string, sellerId: string) => Promise<boolean>;
  wishlist: string[];
  toggleWishlist: (listingId: string) => void;
  isWishlisted: (listingId: string) => boolean;
  refreshListings: () => Promise<void>;
  isLoading: boolean;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

export const ListingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [listings, setListings] = useState<Listing[]>(INITIAL_LISTINGS);
  const [categories, setCategories] = useState<ProductCategory[]>(INITIAL_CATEGORIES);
  const [haats, setHaats] = useState<HaatMarket[]>(INITIAL_HAATS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Radius filter state (1km to 25km, default 15km)
  const [radiusKm, setRadiusKm] = useState<number>(15);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Masked contact unlock records
  const [unlockedContacts, setUnlockedContacts] = useState<Record<string, boolean>>({});
  
  // Wishlist state
  const [wishlist, setWishlist] = useState<string[]>(['l1', 'l3']);

  // Fetch initial data from Supabase
  useEffect(() => {
    fetchLiveListings();
    fetchLiveCategoriesAndHaats();

    // Subscribe to realtime updates on listings
    const channel = supabase
      .channel('realtime_listings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listings' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = mapDbListing(payload.new);
            setListings((prev) => [newItem, ...prev.filter((i) => i.id !== newItem.id)]);
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDbListing(payload.new);
            setListings((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
          } else if (payload.eventType === 'DELETE') {
            setListings((prev) => prev.filter((item) => item.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
    haat_name: row.haat_name,
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

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapDbListing);
        // Merge with initial mock data if mock data has items not in db
        setListings(mapped);
      }
    } catch (err) {
      console.log('Supabase listings fetch error, using local data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLiveCategoriesAndHaats = async () => {
    try {
      const [catsRes, haatsRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('haat_markets').select('*'),
      ]);

      if (catsRes.data && catsRes.data.length > 0) {
        setCategories(catsRes.data);
      }
      if (haatsRes.data && haatsRes.data.length > 0) {
        setHaats(
          haatsRes.data.map((h: any) => ({
            ...h,
            lat: Number(h.lat),
            lng: Number(h.lng),
          }))
        );
      }
    } catch (e) {
      // offline fallback
    }
  };

  const toggleWishlist = (listingId: string) => {
    setWishlist((prev) =>
      prev.includes(listingId)
        ? prev.filter((id) => id !== listingId)
        : [...prev, listingId]
    );
  };

  const isWishlisted = (listingId: string) => wishlist.includes(listingId);

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
          haat_name: listingData.haat_name,
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
        wishlist,
        toggleWishlist,
        isWishlisted,
        refreshListings,
        isLoading,
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
