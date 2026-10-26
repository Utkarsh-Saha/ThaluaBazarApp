import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';
import { supabase } from './supabase';
import { ChatMessage, Conversation, MessageType } from '../types';

const CONVERSATIONS_STORAGE_PREFIX = '@thaluwa_chat_conversations_';
const MESSAGES_STORAGE_PREFIX = '@thaluwa_chat_messages_';

/**
 * Returns a unique storage key for conversations based on user ID
 */
function getConversationsKey(userId: string): string {
  return `${CONVERSATIONS_STORAGE_PREFIX}${userId}`;
}

/**
 * Returns a unique storage key for messages in a conversation
 */
function getMessagesKey(conversationId: string): string {
  return `${MESSAGES_STORAGE_PREFIX}${conversationId}`;
}

/**
 * Find existing conversation between buyer and seller or create a new one
 */
export async function getOrCreateConversation(params: {
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  listingId?: string;
  listingTitle?: string;
}): Promise<Conversation> {
  const { buyerId, buyerName, sellerId, sellerName, sellerPhone, listingId, listingTitle } = params;

  // 1. Check local cache first
  const cachedConversations = await getCachedConversations(buyerId);
  const existingLocal = cachedConversations.find(
    (c) =>
      c.buyer_id === buyerId &&
      c.seller_id === sellerId &&
      (!listingId || c.listing_id === listingId)
  );

  try {
    // 2. Query Supabase
    let query = supabase
      .from('conversations')
      .select('*')
      .eq('buyer_id', buyerId)
      .eq('seller_id', sellerId);

    if (listingId) {
      query = query.eq('listing_id', listingId);
    }

    const { data, error } = await query.order('last_message_at', { ascending: false }).limit(1);

    if (!error && data && data.length > 0) {
      const conv = data[0] as Conversation;
      await saveConversationToCache(conv);
      return conv;
    }

    // 3. Create new conversation in Supabase
    const newConvData = {
      buyer_id: buyerId,
      buyer_name: buyerName,
      seller_id: sellerId,
      seller_name: sellerName,
      seller_phone: sellerPhone || null,
      listing_id: listingId || null,
      listing_title: listingTitle || null,
      last_message_text: listingTitle ? `Inquired about ${listingTitle}` : 'Started conversation',
      last_message_at: new Date().toISOString(),
      buyer_unread_count: 0,
      seller_unread_count: 1,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('conversations')
      .insert([newConvData])
      .select()
      .single();

    if (!insertError && inserted) {
      const conv = inserted as Conversation;
      await saveConversationToCache(conv);
      return conv;
    }
  } catch (err) {
    console.warn('[Chat] Supabase getOrCreateConversation error, using fallback:', err);
  }

  // 4. Fallback: return existing local or generate a local conversation
  if (existingLocal) {
    return existingLocal;
  }

  const fallbackConv: Conversation = {
    id: `local-conv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    buyer_id: buyerId,
    buyer_name: buyerName,
    seller_id: sellerId,
    seller_name: sellerName,
    seller_phone: sellerPhone,
    listing_id: listingId,
    listing_title: listingTitle,
    last_message_text: listingTitle ? `Inquired about ${listingTitle}` : 'Started conversation',
    last_message_at: new Date().toISOString(),
    buyer_unread_count: 0,
    seller_unread_count: 0,
    created_at: new Date().toISOString(),
  };

  await saveConversationToCache(fallbackConv);
  return fallbackConv;
}

/**
 * Fetch all conversations for a user (either as buyer or seller)
 */
export async function getUserConversations(
  userId: string,
  role: 'buyer' | 'seller'
): Promise<Conversation[]> {
  const localList = await getCachedConversations(userId);

  try {
    const column = role === 'seller' ? 'seller_id' : 'buyer_id';
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq(column, userId)
      .order('last_message_at', { ascending: false });

    if (!error && data) {
      const remoteList = data as Conversation[];
      // Merge remote and local (remote takes precedence by id)
      const mergedMap = new Map<string, Conversation>();
      for (const item of localList) {
        mergedMap.set(item.id, item);
      }
      for (const item of remoteList) {
        mergedMap.set(item.id, item);
      }
      const merged = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );
      await AsyncStorage.setItem(getConversationsKey(userId), JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('[Chat] Failed to fetch remote conversations, using local cache:', err);
  }

  return localList;
}

/**
 * Get messages for a given conversation
 */
export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const localMessages = await getCachedMessages(conversationId);

  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      const remoteMessages = data as ChatMessage[];
      const map = new Map<string, ChatMessage>();
      for (const msg of localMessages) {
        map.set(msg.id, msg);
      }
      for (const msg of remoteMessages) {
        map.set(msg.id, msg);
      }
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      await AsyncStorage.setItem(getMessagesKey(conversationId), JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('[Chat] Failed to fetch remote messages, using local cache:', err);
  }

  return localMessages;
}

/**
 * Send a message (text or audio voice note)
 */
export async function sendMessage(params: {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'buyer' | 'seller';
  recipientId: string;
  messageType: MessageType;
  text?: string;
  audioUrl?: string;
  audioDurationSeconds?: number;
  metadata?: ChatMessage['metadata'];
}): Promise<ChatMessage> {
  const {
    conversationId,
    senderId,
    senderName,
    senderRole,
    recipientId,
    messageType,
    text,
    audioUrl,
    audioDurationSeconds,
    metadata,
  } = params;

  const now = new Date().toISOString();
  const summaryText =
    messageType === 'audio'
      ? `🎙️ Voice Note (${audioDurationSeconds || 0}s)`
      : text || 'Sent an attachment';

  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    conversation_id: conversationId,
    sender_id: senderId,
    sender_name: senderName,
    sender_role: senderRole,
    recipient_id: recipientId,
    message_type: messageType,
    text: text || '',
    audio_url: audioUrl,
    audio_duration_seconds: audioDurationSeconds || 0,
    metadata: metadata || {},
    is_read: false,
    created_at: now,
  };

  // 1. Save locally immediately for 0-latency UI feedback
  await saveMessageToCache(newMsg);
  await updateConversationLastMessage(
    conversationId,
    summaryText,
    now,
    senderRole === 'buyer' ? 'seller' : 'buyer'
  );

  // 2. Sync to Supabase
  try {
    const payload = {
      conversation_id: conversationId,
      sender_id: senderId,
      sender_name: senderName,
      sender_role: senderRole,
      recipient_id: recipientId,
      message_type: messageType,
      text: text || null,
      audio_url: audioUrl || null,
      audio_duration_seconds: audioDurationSeconds || 0,
      metadata: metadata || {},
      is_read: false,
      created_at: now,
    };

    const { data, error } = await supabase.from('messages').insert([payload]).select().single();
    if (!error && data) {
      const saved = data as ChatMessage;
      await saveMessageToCache(saved);

      // Update conversation counters in Supabase
      const updateData: Record<string, unknown> = {
        last_message_text: summaryText,
        last_message_at: now,
      };
      if (senderRole === 'buyer') {
        // Increment seller unread
        updateData.seller_unread_count = 1;
      } else {
        updateData.buyer_unread_count = 1;
      }

      await supabase.from('conversations').update(updateData).eq('id', conversationId);
      return saved;
    }
  } catch (err) {
    console.warn('[Chat] Supabase sendMessage error, local message will sync later:', err);
  }

  return newMsg;
}

/**
 * Mark a conversation as read for the active user role
 */
export async function markConversationAsRead(
  conversationId: string,
  role: 'buyer' | 'seller',
  userId: string
): Promise<void> {
  // 1. Update local cache
  const cachedConversations = await getCachedConversations(userId);
  const updated = cachedConversations.map((c) => {
    if (c.id === conversationId) {
      return {
        ...c,
        [role === 'buyer' ? 'buyer_unread_count' : 'seller_unread_count']: 0,
      };
    }
    return c;
  });
  await AsyncStorage.setItem(getConversationsKey(userId), JSON.stringify(updated));

  // 2. Update Supabase
  try {
    const updateColumn = role === 'buyer' ? 'buyer_unread_count' : 'seller_unread_count';
    await supabase.from('conversations').update({ [updateColumn]: 0 }).eq('id', conversationId);
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);
  } catch (err) {
    console.warn('[Chat] Mark read error:', err);
  }
}

/**
 * Subscribe to realtime incoming messages for a conversation
 */
export function subscribeToConversation(
  conversationId: string,
  onMessage: (msg: ChatMessage) => void
) {
  const channel = supabase
    .channel(`chat_${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        if (payload.new) {
          const msg = payload.new as ChatMessage;
          saveMessageToCache(msg);
          onMessage(msg);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * WhatsApp Template Generator for Assam Rural Producers
 * Creates a pre-filled WhatsApp message for quick order inquiries or direct chats
 */
export function openWhatsAppChat(params: {
  phone: string;
  producerName: string;
  buyerName: string;
  listingTitle?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  customMessage?: string;
  language?: 'as' | 'en';
}) {
  const {
    phone,
    producerName,
    buyerName,
    listingTitle,
    quantity,
    unit,
    price,
    customMessage,
    language = 'en',
  } = params;

  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (!cleanPhone.startsWith('91') && cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  let text = '';
  if (language === 'as') {
    text = `নমস্কাৰ ${producerName || 'উৎপাদক'} ডাঙৰীয়া,\nমই থলুৱা বজাৰ (Thaluwa Bazar) এপৰ পৰা ${buyerName || 'গ্ৰাহক'}য়ে যোগাযোগ কৰিছোঁ।`;
    if (listingTitle) {
      text += `\nআপোনাৰ "${listingTitle}" ফচলৰ বিষয়ে জানিব বিচাৰিছোঁ।`;
      if (quantity && unit) {
        text += `\nমোক আনুমানিক ${quantity} ${unit} লাগিব${price ? ` (মুঠ: ₹${price * quantity})` : ''}।`;
      }
    }
    if (customMessage) {
      text += `\n\nপ্ৰশ্ন: ${customMessage}`;
    } else {
      text += '\nফচলৰ মজুত আৰু ডেলিভাৰীৰ বিষয়ে অনুগ্ৰহ কৰি জনাবনে?';
    }
    text += '\n\nধন্যবাদ!';
  } else {
    text = `Hello ${producerName || 'Producer'},\nI am ${buyerName || 'a buyer'} reaching out via Thaluwa Bazar app.`;
    if (listingTitle) {
      text += `\nI am interested in your produce: "${listingTitle}".`;
      if (quantity && unit) {
        text += `\nRequired quantity: ${quantity} ${unit}${price ? ` (Est. ₹${price * quantity})` : ''}.`;
      }
    }
    if (customMessage) {
      text += `\n\nQuery: ${customMessage}`;
    } else {
      text += '\nCould you please let me know about harvest availability and dispatch time?';
    }
    text += '\n\nThank you!';
  }

  const encoded = encodeURIComponent(text);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;

  Linking.openURL(waUrl).catch((err) => {
    console.warn('[WhatsApp] Failed to open WhatsApp URL:', err);
    // Fallback to phone dialer if whatsapp is not installed
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {});
  });
}

/**
 * Suggested bilingual quick questions for rural buyers & SHG producers
 */
export const QUICK_INQUIRY_PROMPTS = [
  {
    id: 'harvest_freshness',
    en: '🌱 When was this harvested?',
    as: '🌱 ফচল কেতিয়া তোলা হৈছে?',
  },
  {
    id: 'delivery_time',
    en: '⚡ Can I get delivery today or tomorrow?',
    as: '⚡ আজি বা কাইলৈ ডেলিভাৰী পোৱা যাবনে?',
  },
  {
    id: 'organic_proof',
    en: '📜 Is this 100% organic / pesticide-free?',
    as: '📜 এইটো সম্পূৰ্ণ খাঁটি আৰু বিষমুক্ত নেকি?',
  },
  {
    id: 'bulk_inquiry',
    en: '📦 Do you have wholesale/bulk quantity available?',
    as: '📦 অধিক পৰিমাণৰ পাইকাৰী মজুত আছেনে?',
  },
];

// Helper storage functions
async function getCachedConversations(userId: string): Promise<Conversation[]> {
  try {
    const raw = await AsyncStorage.getItem(getConversationsKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveConversationToCache(conv: Conversation): Promise<void> {
  try {
    const list = await getCachedConversations(conv.buyer_id);
    const existingIndex = list.findIndex((c) => c.id === conv.id);
    if (existingIndex >= 0) {
      list[existingIndex] = conv;
    } else {
      list.unshift(conv);
    }
    await AsyncStorage.setItem(getConversationsKey(conv.buyer_id), JSON.stringify(list));
    // Also save under seller key
    const sellerList = await getCachedConversations(conv.seller_id);
    const sIndex = sellerList.findIndex((c) => c.id === conv.id);
    if (sIndex >= 0) {
      sellerList[sIndex] = conv;
    } else {
      sellerList.unshift(conv);
    }
    await AsyncStorage.setItem(getConversationsKey(conv.seller_id), JSON.stringify(sellerList));
  } catch (err) {
    console.warn('[Chat] Failed to save conversation to cache:', err);
  }
}

async function getCachedMessages(conversationId: string): Promise<ChatMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(getMessagesKey(conversationId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveMessageToCache(msg: ChatMessage): Promise<void> {
  try {
    const list = await getCachedMessages(msg.conversation_id);
    if (!list.some((m) => m.id === msg.id)) {
      list.push(msg);
      await AsyncStorage.setItem(getMessagesKey(msg.conversation_id), JSON.stringify(list));
    }
  } catch (err) {
    console.warn('[Chat] Failed to save message to cache:', err);
  }
}

async function updateConversationLastMessage(
  conversationId: string,
  summaryText: string,
  timestamp: string,
  unreadForRole: 'buyer' | 'seller'
): Promise<void> {
  try {
    // Find in all conversation storages
    const allKeys = await AsyncStorage.getAllKeys();
    const convKeys = allKeys.filter((k) => k.startsWith(CONVERSATIONS_STORAGE_PREFIX));
    for (const key of convKeys) {
      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const list: Conversation[] = JSON.parse(raw);
        let updated = false;
        const modified = list.map((c) => {
          if (c.id === conversationId) {
            updated = true;
            return {
              ...c,
              last_message_text: summaryText,
              last_message_at: timestamp,
              [unreadForRole === 'buyer' ? 'buyer_unread_count' : 'seller_unread_count']:
                (c[unreadForRole === 'buyer' ? 'buyer_unread_count' : 'seller_unread_count'] || 0) +
                1,
            };
          }
          return c;
        });
        if (updated) {
          await AsyncStorage.setItem(key, JSON.stringify(modified));
        }
      }
    }
  } catch (err) {
    console.warn('[Chat] Failed to update conversation last message:', err);
  }
}
