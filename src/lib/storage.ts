import { supabase } from './supabase';

/**
 * Supported MIME types and maximum file size (5MB)
 */
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface UploadResult {
  success: boolean;
  url: string;
  path?: string;
  error?: string;
}

/**
 * Uploads an image or document from a local URI to Supabase Storage with strict validation.
 */
export async function uploadToSupabaseStorage(
  bucket: 'product-images' | 'seller-documents' | 'chat-audio',
  uri: string,
  prefix: string = 'file'
): Promise<string> {
  try {
    // 1. Validate file extension
    const cleanUri = uri.split('?')[0];
    const fileExt = (cleanUri.split('.').pop() || 'jpg').toLowerCase();
    
    if (!ALLOWED_EXTENSIONS.includes(fileExt) && bucket !== 'chat-audio') {
      console.warn(`[Storage] Rejected upload: unsupported extension ".${fileExt}"`);
      return uri;
    }

    // 2. Fetch binary data and validate size
    const response = await fetch(uri);
    const blob = await response.blob();

    if (blob.size > MAX_FILE_SIZE_BYTES) {
      console.warn(`[Storage] Rejected upload: file size ${blob.size} exceeds maximum 5MB limit`);
      return uri;
    }

    const arrayBuffer = await new Response(blob).arrayBuffer();
    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `${fileName}`;

    const mimeType =
      bucket === 'chat-audio'
        ? 'audio/m4a'
        : fileExt === 'pdf'
        ? 'application/pdf'
        : `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    // 3. Upload to target bucket
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.warn(`[Storage] Upload error:`, error.message);
      return uri; // Graceful fallback
    }

    // 4. Return appropriate URL based on bucket privacy
    if (bucket === 'product-images') {
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      return publicUrlData.publicUrl || uri;
    }

    // Private buckets (seller-documents, chat-audio): return path or signed URL
    const { data: signedData, error: signError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data.path, 60 * 60 * 24); // 24-hour signed access

    if (signError || !signedData?.signedUrl) {
      return data.path;
    }

    return signedData.signedUrl;
  } catch (err: any) {
    console.warn(`[Storage] Failed to upload asset:`, err.message);
    return uri; // Fallback to local URI
  }
}
