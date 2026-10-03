import { supabase } from './supabase';

/**
 * Uploads an image or document from a local URI to Supabase Storage.
 * Returns the public URL of the uploaded asset, or falls back gracefully to the original URI.
 */
export async function uploadToSupabaseStorage(
  bucket: 'product-images' | 'seller-documents',
  uri: string,
  prefix: string = 'file'
): Promise<string> {
  try {
    const fileExt = uri.split('.').pop() || 'jpg';
    const fileName = `${prefix}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, arrayBuffer, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
        upsert: true,
      });

    if (error) {
      console.warn(`[Storage] Upload error:`, error.message);
      return uri; // Graceful fallback
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl || uri;
  } catch (err: any) {
    console.warn(`[Storage] Failed to upload asset:`, err.message);
    return uri; // Fallback to local URI
  }
}
