import { Platform, Alert } from 'react-native';
import DocumentPicker from '@react-native-documents/picker';
import ImagePicker from 'react-native-image-picker';
import { FILE_UPLOAD, MESSAGE_TYPES } from '../../constants';

export interface MediaFile {
  uri: string;
  type: string;
  name: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number; // for video/audio
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface MediaUploadResult {
  url: string;
  thumbnailUrl?: string;
  size: number;
  type: string;
  duration?: number;
  width?: number;
  height?: number;
}

class MediaService {
  private static instance: MediaService;
  private baseUrl = `${__DEV__ ? 'http://localhost:3000' : 'https://gup-supp-api.com'}/api/media`;

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  /**
   * Pick image from gallery or camera
   */
  async pickImage(source: 'gallery' | 'camera' = 'gallery'): Promise<MediaFile | null> {
    try {
      const options = {
        mediaType: 'photo' as const,
        quality: 0.8 as const,
        maxWidth: 1920,
        maxHeight: 1080,
        includeBase64: false,
        storageOptions: {
          skipBackup: true,
          path: 'images',
        },
      };

      const result = await ImagePicker.launchImageLibrary(options);
      
      if (result.didCancel || result.errorMessage) {
        return null;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `image_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          width: asset.width,
          height: asset.height,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to pick image:', error);
      Alert.alert('Error', 'Failed to pick image');
      return null;
    }
  }

  /**
   * Take photo with camera
   */
  async takePhoto(): Promise<MediaFile | null> {
    try {
      const options = {
        mediaType: 'photo' as const,
        quality: 0.8 as const,
        maxWidth: 1920,
        maxHeight: 1080,
        includeBase64: false,
        storageOptions: {
          skipBackup: true,
          path: 'images',
        },
      };

      const result = await ImagePicker.launchCamera(options);
      
      if (result.didCancel || result.errorMessage) {
        return null;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          size: asset.fileSize || 0,
          width: asset.width,
          height: asset.height,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to take photo:', error);
      Alert.alert('Error', 'Failed to take photo');
      return null;
    }
  }

  /**
   * Pick video from gallery or camera
   */
  async pickVideo(source: 'gallery' | 'camera' = 'gallery'): Promise<MediaFile | null> {
    try {
      const options = {
        mediaType: 'video' as const,
        quality: 0.8 as const,
        maxWidth: 1920,
        maxHeight: 1080,
        durationLimit: 300, // 5 minutes
        includeBase64: false,
        storageOptions: {
          skipBackup: true,
          path: 'videos',
        },
      };

      const result = await ImagePicker.launchImageLibrary(options);
      
      if (result.didCancel || result.errorMessage) {
        return null;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri || '',
          type: asset.type || 'video/mp4',
          name: asset.fileName || `video_${Date.now()}.mp4`,
          size: asset.fileSize || 0,
          width: asset.width,
          height: asset.height,
          duration: asset.duration,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to pick video:', error);
      Alert.alert('Error', 'Failed to pick video');
      return null;
    }
  }

  /**
   * Record video with camera
   */
  async recordVideo(): Promise<MediaFile | null> {
    try {
      const options = {
        mediaType: 'video' as const,
        quality: 0.8 as const,
        maxWidth: 1920,
        maxHeight: 1080,
        durationLimit: 300, // 5 minutes
        includeBase64: false,
        storageOptions: {
          skipBackup: true,
          path: 'videos',
        },
      };

      const result = await ImagePicker.launchCamera(options);
      
      if (result.didCancel || result.errorMessage) {
        return null;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return {
          uri: asset.uri || '',
          type: asset.type || 'video/mp4',
          name: asset.fileName || `video_${Date.now()}.mp4`,
          size: asset.fileSize || 0,
          width: asset.width,
          height: asset.height,
          duration: asset.duration,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to record video:', error);
      Alert.alert('Error', 'Failed to record video');
      return null;
    }
  }

  /**
   * Pick document
   */
  async pickDocument(): Promise<MediaFile | null> {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'cachesDirectory',
      });

      if (result.length > 0) {
        const file = result[0];
        return {
          uri: file.fileCopyUri || file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name || 'document',
          size: file.size || 0,
        };
      }

      return null;
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return null;
      }
      console.error('Failed to pick document:', error);
      Alert.alert('Error', 'Failed to pick document');
      return null;
    }
  }

  /**
   * Validate file size and type
   */
  validateFile(file: MediaFile): { isValid: boolean; error?: string } {
    // Check file size
    if (file.type.startsWith('image/') && file.size > FILE_UPLOAD.MAX_IMAGE_SIZE) {
      return {
        isValid: false,
        error: `Image size must be less than ${FILE_UPLOAD.MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
      };
    }

    if (file.type.startsWith('video/') && file.size > FILE_UPLOAD.MAX_VIDEO_SIZE) {
      return {
        isValid: false,
        error: `Video size must be less than ${FILE_UPLOAD.MAX_VIDEO_SIZE / (1024 * 1024)}MB`,
      };
    }

    if (file.type.startsWith('application/') && file.size > FILE_UPLOAD.MAX_DOCUMENT_SIZE) {
      return {
        isValid: false,
        error: `Document size must be less than ${FILE_UPLOAD.MAX_DOCUMENT_SIZE / (1024 * 1024)}MB`,
      };
    }

    // Check file type
    if (file.type.startsWith('image/') && !FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
      return {
        isValid: false,
        error: 'Image type not supported',
      };
    }

    if (file.type.startsWith('video/') && !FILE_UPLOAD.ALLOWED_VIDEO_TYPES.includes(file.type as any)) {
      return {
        isValid: false,
        error: 'Video type not supported',
      };
    }

    if (file.type.startsWith('application/') && !FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES.includes(file.type as any)) {
      return {
        isValid: false,
        error: 'Document type not supported',
      };
    }

    return { isValid: true };
  }

  /**
   * Upload media file
   */
  async uploadMedia(
    file: MediaFile,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);

      if (file.width) formData.append('width', file.width.toString());
      if (file.height) formData.append('height', file.height.toString());
      if (file.duration) formData.append('duration', file.duration.toString());

      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload media');
      }

      const result: MediaUploadResult = await response.json();
      return result;
    } catch (error: any) {
      console.error('Failed to upload media:', error);
      throw new Error(error.message || 'Failed to upload media');
    }
  }

  /**
   * Generate thumbnail for video
   */
  async generateVideoThumbnail(videoUri: string, timeMs: number = 1000): Promise<string> {
    try {
      // In a real implementation, use a video thumbnail library
      // For now, return the video URI as placeholder
      return videoUri;
    } catch (error) {
      console.error('Failed to generate video thumbnail:', error);
      return videoUri;
    }
  }

  /**
   * Compress image
   */
  async compressImage(file: MediaFile, quality: number = 0.8): Promise<MediaFile> {
    try {
      // In a real implementation, use an image compression library
      // For now, return the original file
      return file;
    } catch (error) {
      console.error('Failed to compress image:', error);
      return file;
    }
  }

  /**
   * Get media type from file
   */
  getMediaType(file: MediaFile): string {
    if (file.type.startsWith('image/')) {
      return MESSAGE_TYPES.IMAGE;
    } else if (file.type.startsWith('video/')) {
      return MESSAGE_TYPES.VIDEO;
    } else if (file.type.startsWith('audio/')) {
      return MESSAGE_TYPES.AUDIO;
    } else {
      return MESSAGE_TYPES.DOCUMENT;
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format duration
   */
  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Delete media file
   */
  async deleteMedia(mediaUrl: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: mediaUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete media');
      }
    } catch (error: any) {
      console.error('Failed to delete media:', error);
      throw new Error(error.message || 'Failed to delete media');
    }
  }
}

export const mediaService = MediaService.getInstance();
