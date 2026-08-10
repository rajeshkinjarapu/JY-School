import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import toast from 'react-hot-toast';

export const shareFileNatively = async (blob: Blob, fileName: string, text: string, urlFallback?: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      // 1. Convert Blob to Base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]); // Remove data URL prefix
          } else {
            reject(new Error('Failed to convert blob'));
          }
        };
        reader.readAsDataURL(blob);
      });

      // 2. Write file to device cache directory
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache
      });

      // 3. Trigger Native Share Sheet with the saved file URI
      await Share.share({
        title: fileName,
        url: savedFile.uri,
        dialogTitle: 'Share with WhatsApp or others'
      });
      return true;
    } else {
      // PWA / Web fallback using Web Share API
      const file = new File([blob], fileName, { type: blob.type });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: fileName,
          files: [file]
        });
        return true;
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError' && err.message !== 'Share canceled') {
      console.error('Native share failed:', err);
      toast.error('Failed to share file natively.');
    }
  }
  return false; // Share didn't happen or fell back
};
