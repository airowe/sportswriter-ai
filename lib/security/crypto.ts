import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_ENV = 'DRIZZLE_ENCRYPTION_KEY';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = process.env[KEY_ENV];
  if (!key) {
    throw new Error(`${KEY_ENV} is not configured`);
  }

  const buffer = Buffer.from(key, 'base64');
  if (buffer.length !== 32) {
    throw new Error(`${KEY_ENV} must be a base64-encoded 32-byte value`);
  }
  return buffer;
}

export type EncryptedSecret = {
  ciphertext: Buffer;
  iv: Buffer;
  tag: Buffer;
};

export function encryptSecret(plain: string): EncryptedSecret {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return { ciphertext, iv, tag };
}

export function decryptSecret(payload: EncryptedSecret): string {
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, payload.iv);
  decipher.setAuthTag(payload.tag);
  const decrypted = Buffer.concat([
    decipher.update(payload.ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function maskSecret(value: string, visible = 4): string {
  if (!value) return '';
  const trimmed = value.trim();
  const tail = trimmed.slice(-visible);
  return `${'*'.repeat(Math.max(trimmed.length - visible, 0))}${tail}`;
}
