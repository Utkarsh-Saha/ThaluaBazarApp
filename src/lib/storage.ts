import { supabase } from './supabase';

/**
 * Uploads a local image (URI) to Supabase Storage bucket.
 * Supports image files from expo-image-picker / camera.
 */
export async function uploadToSupabaseStorage(
  bucketName: 'product-images' | 'seller-documents',
  fileUri: string,
  folder: string = 'uploads'
): Promise<string> {
  try {
    if (!fileUri || fileUri.startsWith('http://') || fileUri.startsWith('https://')) {
      return fileUri;
    }

    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
    
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.warn(`Supabase storage upload error on ${bucketName}:`, error.message);
      return fileUri;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn('Storage upload error fallback:', err);
    return fileUri;
  }
}
