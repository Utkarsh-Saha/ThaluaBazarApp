import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const SYNC_QUEUE_KEY = '@thaluwa_sync_queue';
const CACHED_LISTINGS_KEY = '@thaluwa_cached_listings';
const CACHED_CATEGORIES_KEY = '@thaluwa_cached_categories';
const CACHED_ORDERS_KEY = '@thaluwa_cached_orders';
const MANUAL_OFFLINE_KEY = '@thaluwa_manual_offline_mode';

export type SyncActionType = 'CREATE_ORDER' | 'TOGGLE_WISHLIST' | 'SAVE_ADDRESS';

export interface SyncAction {
  id: string;
  type: SyncActionType;
  payload: any;
  createdAt: string;
  attempts: number;
}

export type SignalQuality = 'good' | 'low' | 'offline';

export interface NetworkState {
  isOnline: boolean;
  signalQuality: SignalQuality;
  isManualOffline: boolean;
}

type NetworkListener = (state: NetworkState) => void;
type QueueListener = (pendingCount: number) => void;

class OfflineSyncManager {
  private isOnlineStatus: boolean = true;
  private signalQualityStatus: SignalQuality = 'good';
  private isManualOfflineStatus: boolean = false;
  private consecutiveFailures: number = 0;
  private networkListeners: Set<NetworkListener> = new Set();
  private queueListeners: Set<QueueListener> = new Set();
  private checkInterval: any = null;
  private isProcessing: boolean = false;

  constructor() {
    this.initManualMode();
    this.initNetworkMonitoring();
  }

  private async initManualMode() {
    try {
      const saved = await AsyncStorage.getItem(MANUAL_OFFLINE_KEY);
      if (saved !== null) {
        this.isManualOfflineStatus = JSON.parse(saved);
        this.notifyNetworkListeners();
      }
    } catch {
      // Default to false (online)
    }
  }

  /**
   * Monitor internet connectivity using lightweight HTTP heartbeat pings
   */
  private initNetworkMonitoring() {
    this.checkConnectivity();
    // Poll connectivity every 15 seconds
    this.checkInterval = setInterval(() => {
      this.checkConnectivity();
    }, 15000);
  }

  public async checkConnectivity(): Promise<boolean> {
    const startTime = Date.now();
    let probeOk = false;

    // Primary: Google 204 endpoint (fastest, standard Android/Chrome connectivity test)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800);

      const res = await fetch('https://clients3.google.com/generate_204', {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (res.status === 204 || res.ok) {
        probeOk = true;
      }
    } catch {
      // Secondary fallback: 1.1.1.1 trace endpoint
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 2200);

        const res2 = await fetch('https://1.1.1.1/cdn-cgi/trace', {
          method: 'GET',
          signal: controller2.signal,
        });

        clearTimeout(timeoutId2);
        if (res2.ok) {
          probeOk = true;
        }
      } catch {
        probeOk = false;
      }
    }

    const latency = Date.now() - startTime;

    if (probeOk) {
      this.consecutiveFailures = 0;
      // If latency is high (>2500ms), categorize as low signal
      const quality: SignalQuality = latency > 2500 ? 'low' : 'good';
      this.updateConnectionState(true, quality);
      return true;
    } else {
      this.consecutiveFailures += 1;
      // Only declare fully offline after 2 consecutive probe failures
      if (this.consecutiveFailures >= 2) {
        this.updateConnectionState(false, 'offline');
        return false;
      } else {
        // First transient hiccup: classify as low signal rather than kicking immediately into full offline
        this.updateConnectionState(true, 'low');
        return true;
      }
    }
  }

  private updateConnectionState(online: boolean, quality: SignalQuality) {
    const statusChanged = this.isOnlineStatus !== online || this.signalQualityStatus !== quality;
    if (statusChanged) {
      const wasOffline = !this.isOnlineStatus;
      this.isOnlineStatus = online;
      this.signalQualityStatus = quality;
      this.notifyNetworkListeners();

      if (wasOffline && online && !this.isManualOfflineStatus) {
        // Automatically flush queue when internet connectivity is restored
        this.processSyncQueue();
      }
    }
  }

  public async setManualOfflineMode(enabled: boolean): Promise<void> {
    this.isManualOfflineStatus = enabled;
    try {
      await AsyncStorage.setItem(MANUAL_OFFLINE_KEY, JSON.stringify(enabled));
    } catch (e) {
      console.warn('[OfflineSync] Failed to persist manual offline mode', e);
    }
    this.notifyNetworkListeners();

    if (!enabled && this.isOnlineStatus) {
      this.processSyncQueue();
    }
  }

  public get isManualOffline(): boolean {
    return this.isManualOfflineStatus;
  }

  public get isOnline(): boolean {
    return this.isOnlineStatus;
  }

  public get signalQuality(): SignalQuality {
    return this.signalQualityStatus;
  }

  public get isEffectivelyOffline(): boolean {
    return this.isManualOfflineStatus || !this.isOnlineStatus;
  }

  public get networkState(): NetworkState {
    return {
      isOnline: this.isOnlineStatus,
      signalQuality: this.signalQualityStatus,
      isManualOffline: this.isManualOfflineStatus,
    };
  }

  private notifyNetworkListeners() {
    const state = this.networkState;
    this.networkListeners.forEach((fn) => fn(state));
  }

  public subscribeToNetwork(listener: NetworkListener): () => void {
    this.networkListeners.add(listener);
    listener(this.networkState);
    return () => {
      this.networkListeners.delete(listener);
    };
  }

  public subscribeToQueue(listener: QueueListener): () => void {
    this.queueListeners.add(listener);
    this.getQueueCount().then((cnt) => listener(cnt));
    return () => {
      this.queueListeners.delete(listener);
    };
  }

  private async notifyQueueChanged() {
    const count = await this.getQueueCount();
    this.queueListeners.forEach((fn) => fn(count));
  }

  /**
   * Enqueue action to be executed when back online
   */
  public async enqueueAction(type: SyncActionType, payload: any): Promise<SyncAction> {
    const action: SyncAction = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    const current = await this.getQueue();
    current.push(action);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(current));
    await this.notifyQueueChanged();

    // If online right now, try processing immediately
    if (this.isOnlineStatus) {
      this.processSyncQueue();
    }

    return action;
  }

  public async getQueue(): Promise<SyncAction[]> {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public async getQueueCount(): Promise<number> {
    const list = await this.getQueue();
    return list.length;
  }

  /**
   * Process all queued offline actions sequentially
   */
  public async processSyncQueue(): Promise<{ synced: number; failed: number }> {
    if (this.isProcessing) return { synced: 0, failed: 0 };
    this.isProcessing = true;

    let synced = 0;
    let failed = 0;

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        this.isProcessing = false;
        return { synced: 0, failed: 0 };
      }

      const remaining: SyncAction[] = [];

      for (const item of queue) {
        try {
          const success = await this.executeAction(item);
          if (success) {
            synced++;
          } else {
            item.attempts += 1;
            if (item.attempts < 5) {
              remaining.push(item);
            }
            failed++;
          }
        } catch {
          item.attempts += 1;
          if (item.attempts < 5) {
            remaining.push(item);
          }
          failed++;
        }
      }

      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
      await this.notifyQueueChanged();
    } finally {
      this.isProcessing = false;
    }

    return { synced, failed };
  }

  private async executeAction(action: SyncAction): Promise<boolean> {
    switch (action.type) {
      case 'CREATE_ORDER': {
        const { order, orderItems } = action.payload;
        const { error: ordErr } = await supabase.from('orders').insert([order]);
        if (ordErr) return false;
        if (orderItems && orderItems.length > 0) {
          await supabase.from('order_items').insert(orderItems);
        }
        return true;
      }

      case 'SAVE_ADDRESS': {
        const { address } = action.payload;
        const { error } = await supabase.from('user_addresses').insert([address]);
        return !error;
      }

      case 'TOGGLE_WISHLIST': {
        // Wishlist is already saved in local storage
        return true;
      }

      default:
        return true;
    }
  }

  // --- Offline Storage Caching Helpers ---

  public async cacheListings(listings: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHED_LISTINGS_KEY, JSON.stringify(listings));
    } catch (e) {
      console.warn('[OfflineSync] Failed to cache listings:', e);
    }
  }

  public async getCachedListings(): Promise<any[] | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHED_LISTINGS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public async cacheCategories(categories: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHED_CATEGORIES_KEY, JSON.stringify(categories));
    } catch (e) {
      console.warn('[OfflineSync] Failed to cache categories:', e);
    }
  }

  public async getCachedCategories(): Promise<any[] | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHED_CATEGORIES_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public async cacheOrders(orders: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHED_ORDERS_KEY, JSON.stringify(orders));
    } catch (e) {
      console.warn('[OfflineSync] Failed to cache orders:', e);
    }
  }

  public async getCachedOrders(): Promise<any[] | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHED_ORDERS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export const offlineSyncManager = new OfflineSyncManager();
