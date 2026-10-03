import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { sendPushNotification } from '../services/notificationService.js';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';

export async function getUserNotifications(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const unreadCount = (data || []).filter((n) => !n.is_read).length;

    res.json({
      success: true,
      unreadCount,
      notifications: data || [],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function markNotificationAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, notification: data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userId } = req.body;

    const { error } = await supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}

export async function sendManualPush(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { to, title, body, data } = req.body;

    if (!to || !title || !body) {
      res.status(400).json({ success: false, error: 'to, title, and body are required' });
      return;
    }

    const tickets = await sendPushNotification({ to, title, body, data });
    res.json({ success: true, tickets });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
