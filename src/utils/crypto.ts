/**
 * Web Cryptography API AES-GCM 256-bit encryption module
 * Guarantees encrypted event logs for offline review and zero-knowledge storage
 */

const SALT = new TextEncoder().encode('HGUARD_SENIOR_SECURE_SALT_2026');

async function getKeyFromPin(pin: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin || '8888'),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Helper to convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt arbitrary plain text or Base64 data URL
 */
export async function encryptData(plainText: string, pin: string): Promise<{ ciphertext: string; iv: string }> {
  try {
    const key = await getKeyFromPin(pin);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plainText);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      encoded
    );

    return {
      ciphertext: bufferToBase64(encrypted),
      iv: bufferToBase64(iv.buffer),
    };
  } catch (err) {
    console.error('Encryption failed:', err);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt ciphertext using PIN and IV
 */
export async function decryptData(ciphertextBase64: string, ivBase64: string, pin: string): Promise<string> {
  try {
    const key = await getKeyFromPin(pin);
    const encryptedBuf = base64ToBuffer(ciphertextBase64);
    const ivBuf = base64ToBuffer(ivBase64);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuf),
      },
      key,
      encryptedBuf
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error('Decryption failed:', err);
    throw new Error('Incorrect PIN or corrupted data');
  }
}
