import { encryptionService, EncryptionKey } from './EncryptionService';
import { API_BASE_URL } from '../../constants';

export interface KeyExchange {
  keyId: string;
  publicKey: string;
  userId: string;
  timestamp: Date;
  signature: string;
}

export interface KeyBundle {
  identityKey: EncryptionKey;
  signedPreKey: EncryptionKey;
  oneTimeKeys: EncryptionKey[];
  timestamp: Date;
}

class KeyManagementService {
  private static instance: KeyManagementService;
  private keyBundles: Map<string, KeyBundle> = new Map();
  private baseUrl = `${API_BASE_URL}/keys`;

  static getInstance(): KeyManagementService {
    if (!KeyManagementService.instance) {
      KeyManagementService.instance = new KeyManagementService();
    }
    return KeyManagementService.instance;
  }

  /**
   * Generate a complete key bundle for a user
   */
  async generateKeyBundle(userId: string): Promise<KeyBundle> {
    const identityKey = encryptionService.generateKeyPair();
    const signedPreKey = encryptionService.generateKeyPair();
    const oneTimeKeys = Array.from({ length: 100 }, () => encryptionService.generateKeyPair());

    const keyBundle: KeyBundle = {
      identityKey,
      signedPreKey,
      oneTimeKeys,
      timestamp: new Date(),
    };

    this.keyBundles.set(userId, keyBundle);
    await this.uploadKeyBundle(userId, keyBundle);
    
    return keyBundle;
  }

  /**
   * Upload key bundle to server
   */
  private async uploadKeyBundle(userId: string, keyBundle: KeyBundle): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          keyBundle: {
            identityKey: {
              keyId: keyBundle.identityKey.keyId,
              publicKey: keyBundle.identityKey.publicKey,
            },
            signedPreKey: {
              keyId: keyBundle.signedPreKey.keyId,
              publicKey: keyBundle.signedPreKey.publicKey,
            },
            oneTimeKeys: keyBundle.oneTimeKeys.map(key => ({
              keyId: key.keyId,
              publicKey: key.publicKey,
            })),
            timestamp: keyBundle.timestamp.toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upload key bundle');
      }
    } catch (error) {
      console.error('Key bundle upload failed:', error);
      throw error;
    }
  }

  /**
   * Fetch key bundle for a user
   */
  async fetchKeyBundle(userId: string): Promise<KeyBundle | null> {
    try {
      const response = await fetch(`${this.baseUrl}/fetch/${userId}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return this.parseKeyBundle(data.keyBundle);
    } catch (error) {
      console.error('Failed to fetch key bundle:', error);
      return null;
    }
  }

  /**
   * Parse key bundle from server response
   */
  private parseKeyBundle(data: any): KeyBundle {
    return {
      identityKey: {
        keyId: data.identityKey.keyId,
        publicKey: data.identityKey.publicKey,
        privateKey: '', // Not included in server response
        createdAt: new Date(data.timestamp),
      },
      signedPreKey: {
        keyId: data.signedPreKey.keyId,
        publicKey: data.signedPreKey.publicKey,
        privateKey: '', // Not included in server response
        createdAt: new Date(data.timestamp),
      },
      oneTimeKeys: data.oneTimeKeys.map((key: any) => ({
        keyId: key.keyId,
        publicKey: key.publicKey,
        privateKey: '', // Not included in server response
        createdAt: new Date(data.timestamp),
      })),
      timestamp: new Date(data.timestamp),
    };
  }

  /**
   * Perform key exchange with another user
   */
  async performKeyExchange(userId: string, recipientId: string): Promise<KeyExchange> {
    const keyBundle = await this.fetchKeyBundle(recipientId);
    
    if (!keyBundle) {
      throw new Error('Recipient key bundle not found');
    }

    const keyExchange: KeyExchange = {
      keyId: keyBundle.identityKey.keyId,
      publicKey: keyBundle.identityKey.publicKey,
      userId: recipientId,
      timestamp: new Date(),
      signature: this.signKeyExchange(keyBundle.identityKey.publicKey),
    };

    return keyExchange;
  }

  /**
   * Sign a key exchange (simplified)
   */
  private signKeyExchange(publicKey: string): string {
    // In production, use proper digital signature
    return `signature_${publicKey.substr(0, 16)}`;
  }

  /**
   * Verify key exchange signature
   */
  verifyKeyExchange(keyExchange: KeyExchange): boolean {
    // In production, verify digital signature
    return keyExchange.signature.startsWith('signature_');
  }

  /**
   * Rotate one-time keys
   */
  async rotateOneTimeKeys(userId: string): Promise<void> {
    const keyBundle = this.keyBundles.get(userId);
    
    if (!keyBundle) {
      throw new Error('Key bundle not found');
    }

    // Generate new one-time keys
    const newOneTimeKeys = Array.from({ length: 50 }, () => encryptionService.generateKeyPair());
    
    // Update key bundle
    keyBundle.oneTimeKeys = [...keyBundle.oneTimeKeys, ...newOneTimeKeys];
    keyBundle.timestamp = new Date();

    // Upload updated bundle
    await this.uploadKeyBundle(userId, keyBundle);
  }

  /**
   * Get current key bundle for user
   */
  getKeyBundle(userId: string): KeyBundle | null {
    return this.keyBundles.get(userId) || null;
  }

  /**
   * Clean up expired keys
   */
  async cleanupExpiredKeys(): Promise<void> {
    const now = new Date();
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

    for (const [userId, keyBundle] of this.keyBundles.entries()) {
      if (now.getTime() - keyBundle.timestamp.getTime() > maxAge) {
        this.keyBundles.delete(userId);
      }
    }
  }
}

export const keyManagementService = KeyManagementService.getInstance();
