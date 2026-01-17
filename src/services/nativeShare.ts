import { Share, Platform } from 'react-native';
import * as Sharing from 'expo-sharing';

export interface ShareOptions {
  message: string;
  url?: string;
  imageUri?: string;
  title?: string;
}

/**
 * Share content using native share sheet
 * - On iOS/Android: Uses native share panel (Messenger, Line, WhatsApp, etc.)
 * - On Web: Uses Web Share API or falls back to clipboard
 */
export async function shareContent(options: ShareOptions): Promise<boolean> {
  try {
    // If sharing an image (for result sharing)
    if (options.imageUri && Platform.OS !== 'web') {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(options.imageUri, {
          mimeType: 'image/png',
          dialogTitle: options.title || 'Share',
        });
        return true;
      }
    }

    // Text/URL sharing
    if (Platform.OS === 'web') {
      // Web: Try Web Share API first
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: options.title,
          text: options.message,
          url: options.url,
        });
        return true;
      }
      // Fallback: return false to show modal
      return false;
    }

    // iOS/Android: Use React Native Share
    const shareOptions: { message: string; url?: string; title?: string } = {
      message: Platform.OS === 'android'
        ? `${options.message}${options.url ? '\n' + options.url : ''}`
        : options.message,
      title: options.title,
    };

    // iOS supports separate URL field
    if (Platform.OS === 'ios' && options.url) {
      shareOptions.url = options.url;
    }

    const result = await Share.share(shareOptions);
    return result.action === Share.sharedAction;
  } catch (error) {
    console.error('Share failed:', error);
    return false;
  }
}

/**
 * Share an image file with optional text
 */
export async function shareImage(
  imageUri: string,
  message?: string,
  title?: string
): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      // Web doesn't support direct image sharing
      return false;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.warn('Sharing is not available on this device');
      return false;
    }

    await Sharing.shareAsync(imageUri, {
      mimeType: 'image/png',
      dialogTitle: title || 'Share Result',
    });
    return true;
  } catch (error) {
    console.error('Image share failed:', error);
    return false;
  }
}

/**
 * Check if native sharing is available
 */
export async function isSharingAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' && !!navigator.share;
  }
  return Sharing.isAvailableAsync();
}
