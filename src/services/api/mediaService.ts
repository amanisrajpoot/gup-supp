import { API_BASE_URL } from '../../constants';

class MediaService {
  private baseUrl = `${API_BASE_URL}/media`;

  async uploadImage(imageUri: string, token: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'image.jpg',
      } as any);

      const response = await fetch(`${this.baseUrl}/upload/image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload image');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while uploading image');
    }
  }

  async uploadVideo(videoUri: string, token: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4',
        name: 'video.mp4',
      } as any);

      const response = await fetch(`${this.baseUrl}/upload/video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload video');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while uploading video');
    }
  }

  async uploadDocument(documentUri: string, token: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('document', {
        uri: documentUri,
        type: 'application/pdf',
        name: 'document.pdf',
      } as any);

      const response = await fetch(`${this.baseUrl}/upload/document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while uploading document');
    }
  }

  async uploadAudio(audioUri: string, token: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);

      const response = await fetch(`${this.baseUrl}/upload/audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload audio');
      }

      const data = await response.json();
      return data.url;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while uploading audio');
    }
  }

  async deleteMedia(mediaUrl: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url: mediaUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete media');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error while deleting media');
    }
  }

  async getMediaInfo(mediaUrl: string, token: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/info?url=${encodeURIComponent(mediaUrl)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get media info');
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while getting media info');
    }
  }

  async generateThumbnail(videoUrl: string, token: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/thumbnail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ videoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate thumbnail');
      }

      const data = await response.json();
      return data.thumbnailUrl;
    } catch (error: any) {
      throw new Error(error.message || 'Network error while generating thumbnail');
    }
  }
}

export const mediaService = new MediaService();
