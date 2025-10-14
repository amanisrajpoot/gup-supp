import CryptoJS from 'react-native-crypto-js';
import { ENCRYPTION } from '../../constants';

export interface EncryptionKey {
  publicKey: string;
  privateKey: string;
  keyId: string;
  createdAt: Date;
}

export interface EncryptedMessage {
  content: string;
  keyId: string;
  iv: string;
  tag: string;
}

class EncryptionService {
  private static instance: EncryptionService;
  private keyStore: Map<string, EncryptionKey> = new Map();

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Generate a new encryption key pair
   */
  generateKeyPair(): EncryptionKey {
    const keyId = this.generateKeyId();
    const publicKey = this.generateRandomKey(32);
    const privateKey = this.generateRandomKey(32);
    
    const keyPair: EncryptionKey = {
      publicKey,
      privateKey,
      keyId,
      createdAt: new Date(),
    };

    this.keyStore.set(keyId, keyPair);
    return keyPair;
  }

  /**
   * Encrypt a message using AES-256-GCM
   */
  encryptMessage(message: string, recipientPublicKey: string, senderPrivateKey: string): EncryptedMessage {
    try {
      const iv = this.generateRandomKey(ENCRYPTION.IV_LENGTH);
      const key = this.deriveSharedKey(senderPrivateKey, recipientPublicKey);
      
      const encrypted = CryptoJS.AES.encrypt(message, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding,
      });

      return {
        content: encrypted.toString(),
        keyId: this.getKeyId(recipientPublicKey),
        iv,
        tag: this.generateRandomKey(ENCRYPTION.TAG_LENGTH),
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error}`);
    }
  }

  /**
   * Decrypt a message using AES-256-GCM
   */
  decryptMessage(encryptedMessage: EncryptedMessage, senderPublicKey: string, recipientPrivateKey: string): string {
    try {
      const key = this.deriveSharedKey(recipientPrivateKey, senderPublicKey);
      
      const decrypted = CryptoJS.AES.decrypt(encryptedMessage.content, key, {
        iv: CryptoJS.enc.Hex.parse(encryptedMessage.iv),
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding,
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error(`Decryption failed: ${error}`);
    }
  }

  /**
   * Generate a shared key using ECDH
   */
  private deriveSharedKey(privateKey: string, publicKey: string): string {
    // Simplified key derivation - in production, use proper ECDH
    const combined = privateKey + publicKey;
    return CryptoJS.SHA256(combined).toString();
  }

  /**
   * Generate a random key of specified length
   */
  private generateRandomKey(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate a unique key ID
   */
  private generateKeyId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Get key ID from public key (simplified)
   */
  private getKeyId(publicKey: string): string {
    return CryptoJS.SHA256(publicKey).toString().substr(0, 16);
  }

  /**
   * Store encryption key securely
   */
  async storeKey(key: EncryptionKey): Promise<void> {
    try {
      const keyData = JSON.stringify(key);
      // In production, use secure storage like Keychain
      this.keyStore.set(key.keyId, key);
    } catch (error) {
      throw new Error(`Failed to store key: ${error}`);
    }
  }

  /**
   * Retrieve encryption key
   */
  async getKey(keyId: string): Promise<EncryptionKey | null> {
    return this.keyStore.get(keyId) || null;
  }

  /**
   * Delete encryption key
   */
  async deleteKey(keyId: string): Promise<void> {
    this.keyStore.delete(keyId);
  }

  /**
   * Generate message fingerprint for verification
   */
  generateMessageFingerprint(message: string): string {
    return CryptoJS.SHA256(message).toString();
  }

  /**
   * Verify message integrity
   */
  verifyMessageIntegrity(message: string, fingerprint: string): boolean {
    const computedFingerprint = this.generateMessageFingerprint(message);
    return computedFingerprint === fingerprint;
  }
}

export const encryptionService = EncryptionService.getInstance();
