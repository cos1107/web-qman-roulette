import { db, storage } from './firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Platform } from 'react-native';

// Types
export type ThemeId = 'classic' | 'pink' | 'fresh';
export type GameType = 'wheel' | 'poke';

export interface SharedOption {
  id: string;
  type: 'text' | 'image';
  content: string;
  label?: string;
}

// Result data for result sharing
export interface SharedResult {
  optionId: string;
  optionContent: string;
  optionType: 'text' | 'image';
  optionLabel?: string;
  timestamp: number;
}

export interface SharedConfig {
  id: string;
  type: GameType;
  name: string;
  customGreeting: string;
  options: SharedOption[];
  themeId: ThemeId;
  createdAt: Timestamp;
  // Optional: result for result-sharing
  sharedResult?: SharedResult;
  // Optional: preview image URL
  previewImageUrl?: string;
}

// Generate 6-character alphanumeric ID
export function generateShareId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Convert image URI to blob for upload
async function uriToBlob(uri: string): Promise<Blob> {
  if (Platform.OS === 'web') {
    // Web: fetch the URI directly
    const response = await fetch(uri);
    return await response.blob();
  } else {
    // Native: use XMLHttpRequest
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function () {
        reject(new Error('Failed to convert URI to blob'));
      };
      xhr.responseType = 'blob';
      xhr.open('GET', uri, true);
      xhr.send(null);
    });
  }
}

// Upload single image to Firebase Storage
async function uploadImage(
  uri: string,
  shareId: string,
  nameOrIndex: number | string
): Promise<string> {
  try {
    const blob = await uriToBlob(uri);
    const fileName = typeof nameOrIndex === 'string' ? nameOrIndex : `image_${nameOrIndex}`;
    const imageRef = ref(storage, `shares/${shareId}/${fileName}.jpg`);
    await uploadBytes(imageRef, blob);
    const downloadUrl = await getDownloadURL(imageRef);
    return downloadUrl;
  } catch (error) {
    console.error('Failed to upload image:', error);
    throw error;
  }
}

// Create a share document
export async function createShare(
  config: {
    name: string;
    customGreeting: string;
    options: SharedOption[];
    themeId: ThemeId;
  },
  type: GameType
): Promise<string> {
  console.log('[createShare] Starting with config:', config.name, 'type:', type);
  const shareId = generateShareId();
  console.log('[createShare] Generated shareId:', shareId);

  // Process options - upload images if needed
  const processedOptions: SharedOption[] = [];

  for (let i = 0; i < config.options.length; i++) {
    const option = config.options[i];

    if (option.type === 'image' && option.content) {
      // Check if it's already a Firebase URL (in case of re-sharing)
      if (option.content.includes('firebasestorage.googleapis.com') ||
          option.content.includes('firebasestorage.app')) {
        processedOptions.push(option);
      } else {
        // Upload local image to Firebase Storage
        try {
          const imageUrl = await uploadImage(option.content, shareId, i);
          processedOptions.push({
            ...option,
            content: imageUrl,
          });
        } catch (error) {
          console.error(`Failed to upload image ${i}:`, error);
          // Skip failed images or convert to text
          processedOptions.push({
            ...option,
            type: 'text',
            content: option.label || `Image ${i + 1}`,
          });
        }
      }
    } else {
      processedOptions.push(option);
    }
  }

  // Create Firestore document
  const shareData: SharedConfig = {
    id: shareId,
    type,
    name: config.name,
    customGreeting: config.customGreeting,
    options: processedOptions,
    themeId: config.themeId,
    createdAt: Timestamp.now(),
  };

  console.log('[createShare] Saving to Firestore...');
  try {
    await setDoc(doc(db, 'shares', shareId), shareData);
    console.log('[createShare] Saved successfully');
  } catch (firestoreError) {
    console.error('[createShare] Firestore error:', firestoreError);
    throw firestoreError;
  }

  return shareId;
}

// Load a shared config by ID
export async function loadShare(shareId: string): Promise<SharedConfig | null> {
  try {
    const docRef = doc(db, 'shares', shareId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as SharedConfig;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Failed to load share:', error);
    return null;
  }
}

// Generate share URL
export function getShareUrl(shareId: string): string {
  // Use current origin for flexibility
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/s/${shareId}`;
  }
  // Default to production URL
  return `https://web-qman-roulette.vercel.app/s/${shareId}`;
}

// Helper: Process options and upload images
async function processOptions(
  options: SharedOption[],
  shareId: string
): Promise<SharedOption[]> {
  const processedOptions: SharedOption[] = [];

  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    if (option.type === 'image' && option.content) {
      // Check if it's already a Firebase URL
      if (
        option.content.includes('firebasestorage.googleapis.com') ||
        option.content.includes('firebasestorage.app')
      ) {
        processedOptions.push(option);
      } else {
        // Upload local image to Firebase Storage
        try {
          const imageUrl = await uploadImage(option.content, shareId, i);
          processedOptions.push({
            ...option,
            content: imageUrl,
          });
        } catch (error) {
          console.error(`Failed to upload image ${i}:`, error);
          processedOptions.push({
            ...option,
            type: 'text',
            content: option.label || `Image ${i + 1}`,
          });
        }
      }
    } else {
      processedOptions.push(option);
    }
  }

  return processedOptions;
}

// Create a share with result (for result sharing)
export async function createShareWithResult(
  config: {
    name: string;
    customGreeting: string;
    options: SharedOption[];
    themeId: ThemeId;
  },
  type: GameType,
  result: SharedResult,
  previewImageUri?: string
): Promise<string> {
  const shareId = generateShareId();

  // Process options
  const processedOptions = await processOptions(config.options, shareId);

  // Upload preview image if provided
  let previewImageUrl: string | undefined;
  if (previewImageUri) {
    try {
      previewImageUrl = await uploadImage(previewImageUri, shareId, 'preview');
    } catch (error) {
      console.error('Failed to upload preview image:', error);
    }
  }

  // Create Firestore document with result
  // Note: Firestore doesn't accept undefined values, so we only include fields that have values
  const shareData: Record<string, any> = {
    id: shareId,
    type,
    name: config.name,
    customGreeting: config.customGreeting,
    options: processedOptions,
    themeId: config.themeId,
    createdAt: Timestamp.now(),
    sharedResult: result,
  };

  // Only add previewImageUrl if it exists
  if (previewImageUrl) {
    shareData.previewImageUrl = previewImageUrl;
  }

  await setDoc(doc(db, 'shares', shareId), shareData);
  return shareId;
}
