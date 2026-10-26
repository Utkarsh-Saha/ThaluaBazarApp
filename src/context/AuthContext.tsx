import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, SellerProfile, UserRole, SellerType } from '../types';
import { supabase } from '../lib/supabase';
import { apiRequest, TOKEN_STORAGE_KEY } from '../lib/api';
import { registerForPushNotificationsAsync } from '../lib/notifications';

export interface BuyerRegistrationData {
  phone: string;
  name: string;
  email?: string;
  district: string;
  village: string;
  address: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  language?: 'en' | 'as';
}

export interface VerifyOtpResult {
  success: boolean;
  isNewUser?: boolean;
  error?: string;
}

interface AuthContextType {
  user: User | null;
  sellerProfile: SellerProfile | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedEntryRole: 'buyer' | 'seller';
  setSelectedEntryRole: (role: 'buyer' | 'seller') => void;
  sendOtp: (phone: string) => Promise<{ success: boolean; isExistingUser?: boolean; testOtp?: string; error?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<VerifyOtpResult>;
  registerBuyer: (data: BuyerRegistrationData) => Promise<{ success: boolean; error?: string }>;
  updateBuyerProfile: (updates: Partial<User>) => Promise<boolean>;
  registerSeller: (data: {
    business_name: string;
    seller_type: SellerType;
    shg_code?: string;
    village: string;
    district: string;
    upi_id: string;
  }) => Promise<void>;
  uploadSellerDocuments: (docs: {
    id_proof_url?: string;
    address_proof_url?: string;
    shg_cert_url?: string;
    bank_proof_url?: string;
  }) => Promise<void>;
  toggleSellerOnline: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = '@thaluwa_user';
const SELLER_STORAGE_KEY = '@thaluwa_seller';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('buyer');
  const [selectedEntryRole, setSelectedEntryRole] = useState<'buyer' | 'seller'>('buyer');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load session from AsyncStorage
  const loadStoredSession = useCallback(async () => {
    try {
      const [storedUser, storedSeller, storedToken] = await Promise.all([
        AsyncStorage.getItem(USER_STORAGE_KEY),
        AsyncStorage.getItem(SELLER_STORAGE_KEY),
        AsyncStorage.getItem(TOKEN_STORAGE_KEY),
      ]);

      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (
          parsed.name === 'Assam Local Buyer' ||
          parsed.name === 'Local Producer' ||
          parsed.name === 'Assam Buyer' ||
          parsed.id?.startsWith('u-') ||
          parsed.id === 'usr-buyer-01' ||
          parsed.phone === '+91 98765 43210' ||
          parsed.phone === '9876543210'
        ) {
          await AsyncStorage.multiRemove([USER_STORAGE_KEY, SELLER_STORAGE_KEY, TOKEN_STORAGE_KEY]);
          setUser(null);
          setSellerProfile(null);
          setToken(null);
        } else {
          setUser(parsed);
          setRole(parsed.role || 'buyer');
        }
      } else {
        setUser(null);
      }
      if (storedSeller) {
        setSellerProfile(JSON.parse(storedSeller));
      }
      if (storedToken) {
        setToken(storedToken);
      }
    } catch (e) {
      console.warn('[AuthContext] Session load error', e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStoredSession();
  }, [loadStoredSession]);

  useEffect(() => {
    if (user?.id) {
      registerForPushNotificationsAsync(user.id).catch((err) => {
        console.warn('[AuthContext] Push notification registration skipped/failed:', err);
      });
    }
  }, [user?.id]);

  /**
   * Send OTP via Backend
   */
  const sendOtp = async (phone: string): Promise<{ success: boolean; isExistingUser?: boolean; testOtp?: string; error?: string }> => {
    try {
      const res = await apiRequest<{ success: boolean; isExistingUser: boolean; testOtp?: string; message?: string }>('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });

      if (res.success && res.data) {
        return {
          success: true,
          isExistingUser: res.data.isExistingUser,
          testOtp: res.data.testOtp || '123456',
        };
      }

      if (res.error) {
        return { success: false, error: res.error };
      }

      return { success: true, isExistingUser: false, testOtp: '123456' };
    } catch (err: any) {
      console.warn('[AuthContext] sendOtp error fallback:', err);
      return { success: true, isExistingUser: false, testOtp: '123456' };
    }
  };

  /**
   * Verify OTP via Backend
   */
  const verifyOtp = async (phone: string, otp: string): Promise<VerifyOtpResult> => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{
        success: boolean;
        isNewUser: boolean;
        user?: User;
        sellerProfile?: SellerProfile;
        token?: string;
        error?: string;
      }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });

      if (res.success && res.data) {
        const { isNewUser, user: dbUser, sellerProfile: dbSeller, token: sessionToken } = res.data;

        if (sessionToken) {
          setToken(sessionToken);
          await AsyncStorage.setItem(TOKEN_STORAGE_KEY, sessionToken);
        }

        if (isNewUser) {
          setIsLoading(false);
          return { success: true, isNewUser: true };
        }

        if (dbUser) {
          setUser(dbUser);
          setRole(dbUser.role || 'buyer');
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(dbUser));
        }

        if (dbSeller) {
          setSellerProfile(dbSeller);
          await AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(dbSeller));
        }

        setIsLoading(false);
        return { success: true, isNewUser: false };
      }

      if (res.error) {
        setIsLoading(false);
        return { success: false, error: res.error };
      }

      // Offline fallback ONLY if OTP is 123456
      if (otp.trim() === '123456') {
        setIsLoading(false);
        return { success: true, isNewUser: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Invalid verification code. Please enter 123456.' };
    } catch (err: any) {
      console.warn('[AuthContext] verifyOtp error fallback:', err);
      setIsLoading(false);
      return { success: false, error: err.message || 'Verification error' };
    }
  };

  /**
   * Register Buyer Profile
   */
  const registerBuyer = async (data: BuyerRegistrationData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ success: boolean; user: User; token: string }>('/auth/register-buyer', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res.success && res.data?.user) {
        const newUser = res.data.user;
        setUser(newUser);
        setRole('buyer');
        if (res.data.token) {
          setToken(res.data.token);
          await AsyncStorage.setItem(TOKEN_STORAGE_KEY, res.data.token);
        }
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        setIsLoading(false);
        return { success: true };
      }

      // Local Fallback
      const fallbackUser: User = {
        id: `usr-${Date.now()}`,
        phone: data.phone,
        name: data.name,
        email: data.email,
        role: 'buyer',
        language: data.language || 'en',
        lat: data.lat || 26.4350,
        lng: data.lng || 92.0300,
        address: data.address,
        village: data.village,
        district: data.district,
        verified: true,
        created_at: new Date().toISOString(),
      };

      setUser(fallbackUser);
      setRole('buyer');
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(fallbackUser));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      console.warn('[AuthContext] registerBuyer fallback:', err);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  };

  /**
   * Update Profile
   */
  const updateBuyerProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    const updated = { ...user, ...updates };
    setUser(updated);
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));

    try {
      await apiRequest('/auth/sync', {
        method: 'POST',
        body: JSON.stringify({
          phone: user.phone,
          ...updates,
        }),
      });
    } catch (e) {
      console.log('[AuthContext] sync profile offline:', e);
    }
    return true;
  };

  /**
   * Register Seller
   */
  const registerSeller = async (data: {
    business_name: string;
    seller_type: SellerType;
    shg_code?: string;
    village: string;
    district: string;
    upi_id: string;
  }) => {
    if (!user) return;

    try {
      const res = await apiRequest<{ success: boolean; seller_profile: SellerProfile }>('/seller/register', {
        method: 'POST',
        body: JSON.stringify({
          user_id: user.id,
          phone: user.phone,
          business_name: data.business_name,
          seller_type: data.seller_type,
          shg_code: data.shg_code,
          village: data.village,
          district: data.district,
          upi_id: data.upi_id,
        }),
      });

      if (res.success && res.data?.seller_profile) {
        const profile = res.data.seller_profile;
        setSellerProfile(profile);
        setRole('seller');
        const updatedUser: User = { ...user, role: 'seller' };
        setUser(updatedUser);
        await AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(profile));
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        return;
      }
    } catch (e) {
      console.warn('[AuthContext] Backend registerSeller notice:', e);
    }

    // Local fallback if offline
    const newProfile: SellerProfile = {
      id: `sel-${Date.now()}`,
      user_id: user.id,
      business_name: data.business_name,
      seller_type: data.seller_type,
      shg_code: data.shg_code,
      village: data.village,
      district: data.district,
      upi_id: data.upi_id,
      verification_status: 'pending',
      rating: 5.0,
      reviews_count: 0,
      delivery_radius_km: 15,
      is_online: true,
      today_sales: 0,
      total_orders: 0,
      created_at: new Date().toISOString(),
    };

    setSellerProfile(newProfile);
    setRole('seller');
    const updatedUser: User = { ...user, role: 'seller' };
    setUser(updatedUser);

    await AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(newProfile));
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  };

  /**
   * Upload Seller Documents
   */
  const uploadSellerDocuments = async (docs: {
    id_proof_url?: string;
    address_proof_url?: string;
    shg_cert_url?: string;
    bank_proof_url?: string;
  }) => {
    if (!sellerProfile) return;
    const updated: SellerProfile = {
      ...sellerProfile,
      documents: {
        ...sellerProfile.documents,
        ...docs,
      },
      verification_status: 'pending',
    };
    setSellerProfile(updated);
    await AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(updated));

    try {
      await supabase
        .from('seller_profiles')
        .update({
          id_proof_url: docs.id_proof_url,
          address_proof_url: docs.address_proof_url,
          shg_cert_url: docs.shg_cert_url,
          bank_proof_url: docs.bank_proof_url,
          verification_status: 'pending',
        })
        .eq('user_id', user?.id);
    } catch (e) {
      console.log('[AuthContext] Supabase doc update fallback:', e);
    }
  };

  const toggleSellerOnline = async () => {
    if (!sellerProfile) return;
    const nextStatus = !sellerProfile.is_online;
    const updated: SellerProfile = {
      ...sellerProfile,
      is_online: nextStatus,
    };
    setSellerProfile(updated);
    await AsyncStorage.setItem(SELLER_STORAGE_KEY, JSON.stringify(updated));

    try {
      await supabase
        .from('seller_profiles')
        .update({ is_online: nextStatus })
        .eq('id', sellerProfile.id);
    } catch (e) {
      console.log('[AuthContext] toggle status fallback:', e);
    }
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      const res = await apiRequest<{ success: boolean; user: User }>(`/auth/profile/${user.id}`);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.data.user));
      }
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    await AsyncStorage.removeItem(SELLER_STORAGE_KEY);
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setSellerProfile(null);
    setToken(null);
    setRole('buyer');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        sellerProfile,
        role,
        token,
        isAuthenticated: !!user,
        isLoading,
        selectedEntryRole,
        setSelectedEntryRole,
        sendOtp,
        verifyOtp,
        registerBuyer,
        updateBuyerProfile,
        registerSeller,
        uploadSellerDocuments,
        toggleSellerOnline,
        switchRole,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
