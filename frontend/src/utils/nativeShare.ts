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
      const file = new File([blob], fileName, { type: blob.type || 'application/pdf' });
      if (navigator.share) {
        // Try sharing with files and text
        try {
          if (navigator.canShare && !navigator.canShare({ files: [file] })) {
             console.warn("Browser says it cannot share this file type, trying anyway...");
          }
          await navigator.share({
            title: fileName,
            text: text,
            files: [file]
          });
          return true;
        } catch (err: any) {
           console.error("First share attempt failed", err);
           // Sometimes text + file fails on certain Android versions, try only file
           try {
             await navigator.share({
               title: fileName,
               files: [file]
             });
             return true;
           } catch (err2: any) {
             console.error("Second share attempt failed", err2);
             throw err2; // Let the outer catch handle it
           }
        }
      }
    }
  } catch (err: any) {
    if (err.name !== 'AbortError' && err.message !== 'Share canceled' && !err.message?.includes('AbortError')) {
      console.error('Native share failed:', err);
      toast.error('Failed to share file natively: ' + (err.message || 'Unknown error'));
    }
  }
  return false; // Share didn't happen or fell back
};
