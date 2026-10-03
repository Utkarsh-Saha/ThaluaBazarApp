import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { ENV } from '../config/env.js';

const expo = new Expo({ accessToken: ENV.EXPO_ACCESS_TOKEN || undefined });

export interface PushNotificationPayload {
  to: string | string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

export async function sendPushNotification(payload: PushNotificationPayload): Promise<ExpoPushTicket[]> {
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const validTokens: string[] = [];

  for (const token of recipients) {
    if (Expo.isExpoPushToken(token)) {
      validTokens.push(token);
    } else {
      console.warn(`[PushNotification] Invalid Expo push token: ${token}`);
    }
  }

  if (validTokens.length === 0) {
    return [];
  }

  const messages: ExpoPushMessage[] = validTokens.map((token) => ({
    to: token,
    sound: payload.sound || 'default',
    title: payload.title,
    body: payload.body,
    data: payload.data || {},
    priority: payload.priority || 'high',
    channelId: payload.channelId || 'default',
  }));

  const chunks = expo.chunkPushNotifications(messages);
  const tickets: ExpoPushTicket[] = [];

  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error('[PushNotification] Error sending push notification chunk:', error);
    }
  }

  return tickets;
}
