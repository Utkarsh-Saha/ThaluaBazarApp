import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

export async function getCategories(req: Request, res: Response): Promise<void> {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({ success: true, categories: data || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
}
