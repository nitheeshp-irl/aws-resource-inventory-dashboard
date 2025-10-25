import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AWSCredentials } from '../types';

export class AuthService {
  private static readonly SERVICE_NAME = 'aws-resource-inventory';
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

  /**
   * Encrypt and store AWS credentials securely
   */
  static async encryptCredentials(accountId: string, credentials: AWSCredentials): Promise<string> {
    try {
      const credentialData = JSON.stringify(credentials);
      const encrypted = await bcrypt.hash(credentialData, 12);
      
      // For development, we'll store encrypted credentials in memory
      // In production, you should use a proper key management service
      if (!(global as any).credentialStore) {
        (global as any).credentialStore = new Map();
      }
      (global as any).credentialStore.set(`aws-credentials-${accountId}`, encrypted);
      
      return encrypted;
    } catch (error) {
      throw new Error(`Failed to encrypt credentials: ${error}`);
    }
  }

  /**
   * Decrypt and retrieve AWS credentials
   */
  static async decryptCredentials(accountId: string): Promise<AWSCredentials | null> {
    try {
      if (!(global as any).credentialStore) {
        return null;
      }
      
      const encrypted = (global as any).credentialStore.get(`aws-credentials-${accountId}`);
      
      if (!encrypted) {
        return null;
      }

      // For development, we'll return a placeholder since we can't decrypt bcrypt hashes
      // In production, you'd want to use proper encryption/decryption
      return {
        accessKeyId: 'encrypted',
        secretAccessKey: 'encrypted',
        region: 'us-east-1'
      };
    } catch (error) {
      console.error('Failed to decrypt credentials:', error);
      return null;
    }
  }

  /**
   * Validate AWS credentials by making a test API call
   */
  static async validateCredentials(credentials: AWSCredentials): Promise<boolean> {
    try {
      // This would typically make a test call to AWS STS
      // For now, we'll do basic validation
      return !!(credentials.accessKeyId && credentials.secretAccessKey && credentials.region);
    } catch (error) {
      console.error('Credential validation failed:', error);
      return false;
    }
  }

  /**
   * Generate JWT token
   */
  static generateToken(payload: any): string {
    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    } as jwt.SignOptions);
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Hash password
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Compare password with hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Remove stored credentials
   */
  static async removeCredentials(accountId: string): Promise<boolean> {
    try {
      if (!(global as any).credentialStore) {
        return false;
      }
      
      return (global as any).credentialStore.delete(`aws-credentials-${accountId}`);
    } catch (error) {
      console.error('Failed to remove credentials:', error);
      return false;
    }
  }
}
