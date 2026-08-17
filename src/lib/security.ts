import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

/**
 * Derives a consistent 32-byte key from the environment variable.
 */
const getEncryptionKey = (): Buffer => {
  const secret = process.env.ENCRYPTION_KEY || 'default-insecure-dev-key-change-in-prod-omega-ultra';
  return crypto.createHash('sha256').update(String(secret)).digest();
};

/**
 * Encrypts a plain text string using AES-256-GCM.
 * This is used for encrypting PII like Bank Account Numbers, PAN, GSTINs.
 * 
 * @param text The plain text to encrypt.
 * @returns A string in the format "iv:encryptedData:authTag"
 */
export function encryptPII(text: string | null | undefined): string | null {
  if (!text) return null;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

/**
 * Decrypts a previously encrypted PII string using AES-256-GCM.
 * 
 * @param encryptedText The encrypted text in the format "iv:encryptedData:authTag"
 * @returns The decrypted plain text, or the original text if it doesn't look like our encrypted format.
 */
export function decryptPII(encryptedText: string | null | undefined): string | null {
  if (!encryptedText) return null;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // If it's not in the expected format, it might be unencrypted legacy data.
      return encryptedText;
    }
    
    const [ivHex, encryptedData, authTagHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed for PII data:', error);
    // Depending on strictness, we might throw or return null.
    return null;
  }
}
