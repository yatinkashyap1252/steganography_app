/**
 * On-Device Cryptographic Engine for Stealth Studio.
 * 100% Client-Side. Zero Server. Zero Data Leaks.
 * Implements PBKDF2-HMAC-SHA256 key derivation and AES-256-GCM authenticated encryption.
 */

import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import * as Crypto from 'expo-crypto';

export const MAGIC_HEADER = new Uint8Array([0x53, 0x54, 0x47, 0x4f]); // "STGO"
export const SALT_SIZE = 16;
export const IV_SIZE = 12;
export const PBKDF2_ROUNDS = 100_000;
export const HEADER_PREFIX_LEN = 37; // 4 (MAGIC) + 16 (SALT) + 12 (IV) + 1 (TYPE) + 4 (LEN)

export interface EncryptResult {
  frame: Uint8Array;
  stegoSeed: Uint8Array;
}

export interface DecryptResult {
  data: Uint8Array;
  payloadType: number; // 0=Text, 1=Audio, 2=File
}

/**
 * Universal UTF-8 string to bytes encoder.
 * Works on React Native, Hermes, iOS, Android, and Web without relying on global TextEncoder.
 */
export function utf8ToBytes(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const binary = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Universal UTF-8 bytes to string decoder.
 * Works on React Native, Hermes, iOS, Android, and Web without relying on global TextDecoder.
 */
export function bytesToUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    try {
      return new TextDecoder().decode(bytes);
    } catch (_) {}
  }
  let out = '';
  let i = 0;
  const len = bytes.length;
  while (i < len) {
    const c = bytes[i++];
    if (c > 127) {
      if (c > 191 && c < 224) {
        if (i >= len) break;
        const c2 = bytes[i++];
        out += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
      } else if (c > 223 && c < 240) {
        if (i + 1 >= len) break;
        const c2 = bytes[i++];
        const c3 = bytes[i++];
        out += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      } else if (c > 239 && c <= 247) {
        if (i + 2 >= len) break;
        const c2 = bytes[i++];
        const c3 = bytes[i++];
        const c4 = bytes[i++];
        const u = (((c & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) - 0x10000;
        out += String.fromCharCode((u >> 10) + 0xd800, (u & 0x3ff) + 0xdc00);
      }
    } else {
      out += String.fromCharCode(c);
    }
  }
  return out;
}

/**
 * Derives a deterministic 256-bit Stego PRNG seed from the passphrase
 * using PBKDF2-HMAC-SHA256 with a dedicated domain-separation salt.
 * This guarantees the decoder can always locate pixel coordinates without
 * needing the per-message AES salt first.
 */
export const STEGO_DOMAIN_SALT = utf8ToBytes('STEALTH_STUDIO_PRNG_DOMAIN_V1');

export function deriveStegoSeed(passphrase: string): Uint8Array {
  const passBytes = utf8ToBytes(passphrase);
  return pbkdf2(sha256, passBytes, STEGO_DOMAIN_SALT, {
    c: PBKDF2_ROUNDS,
    dkLen: 32,
  });
}

/**
 * Derives a 256-bit AES encryption key using the per-message random salt.
 */
export function deriveEncryptionKey(passphrase: string, salt: Uint8Array): Uint8Array {
  const passBytes = utf8ToBytes(passphrase);
  return pbkdf2(sha256, passBytes, salt, {
    c: PBKDF2_ROUNDS,
    dkLen: 32,
  });
}

/**
 * Derives both AES key and Stego seed for compatibility.
 */
export function deriveKeys(
  passphrase: string,
  salt?: Uint8Array
): { salt: Uint8Array; aesKey: Uint8Array; stegoSeed: Uint8Array } {
  const finalSalt = salt || cryptoGetRandomValues(new Uint8Array(SALT_SIZE));
  const aesKey = deriveEncryptionKey(passphrase, finalSalt);
  const stegoSeed = deriveStegoSeed(passphrase);
  return { salt: finalSalt, aesKey, stegoSeed };
}

/**
 * Encrypts arbitrary binary data using AES-256-GCM and packages it into a binary frame.
 */
export function encryptPayload(
  data: Uint8Array,
  passphrase: string,
  payloadType: number = 0
): EncryptResult {
  const salt = cryptoGetRandomValues(new Uint8Array(SALT_SIZE));
  const aesKey = deriveEncryptionKey(passphrase, salt);
  const stegoSeed = deriveStegoSeed(passphrase);
  const iv = cryptoGetRandomValues(new Uint8Array(IV_SIZE));

  const payloadLen = data.length;

  // Header format: [4B MAGIC] [16B SALT] [12B IV] [1B TYPE] [4B LEN]
  const headerPrefix = new Uint8Array(HEADER_PREFIX_LEN);
  headerPrefix.set(MAGIC_HEADER, 0);
  headerPrefix.set(salt, 4);
  headerPrefix.set(iv, 20);
  headerPrefix[32] = payloadType;

  // Write payload length as Big-Endian UInt32
  const view = new DataView(headerPrefix.buffer, headerPrefix.byteOffset, headerPrefix.byteLength);
  view.setUint32(33, payloadLen, false);

  // Encrypt with AES-256-GCM using header prefix as Authenticated Additional Data (AAD)
  const cipher = gcm(aesKey, iv, headerPrefix);
  const ciphertextAndTag = cipher.encrypt(data);

  // Full binary frame
  const frame = new Uint8Array(headerPrefix.length + ciphertextAndTag.length);
  frame.set(headerPrefix, 0);
  frame.set(ciphertextAndTag, headerPrefix.length);

  return { frame, stegoSeed };
}

/**
 * Verifies and decrypts a binary frame extracted from an image.
 */
export function decryptPayload(frame: Uint8Array, passphrase: string): DecryptResult {
  // Ensure buffer ownership to prevent DataView offset mismatches (M-06)
  const ownedFrame = frame.slice(0);

  if (ownedFrame.length < HEADER_PREFIX_LEN + 16) {
    throw new Error('Invalid frame: Data length is too short.');
  }

  // Check MAGIC signature
  for (let i = 0; i < 4; i++) {
    if (ownedFrame[i] !== MAGIC_HEADER[i]) {
      throw new Error('Steganography signature missing. Image has no cloaked data or wrong key.');
    }
  }

  const salt = ownedFrame.slice(4, 20);
  const iv = ownedFrame.slice(20, 32);
  const payloadType = ownedFrame[32];

  const view = new DataView(ownedFrame.buffer, ownedFrame.byteOffset, ownedFrame.byteLength);
  const payloadLen = view.getUint32(33, false);

  const headerPrefix = ownedFrame.slice(0, HEADER_PREFIX_LEN);
  const ciphertextAndTag = ownedFrame.slice(HEADER_PREFIX_LEN);

  // Re-derive AES key from passphrase + extracted salt
  const aesKey = deriveEncryptionKey(passphrase, salt);

  try {
    const cipher = gcm(aesKey, iv, headerPrefix);
    const decryptedData = cipher.decrypt(ciphertextAndTag);
    return { data: decryptedData, payloadType };
  } catch (err) {
    throw new Error('Decryption failed: Incorrect passphrase or image data has been tampered with.');
  }
}

/**
 * Cross-platform CSPRNG random bytes generator.
 * Uses expo-crypto (hardware SecureRandom on Android/iOS) and WebCrypto.
 */
function cryptoGetRandomValues(arr: Uint8Array): Uint8Array {
  if (typeof Crypto !== 'undefined' && Crypto.getRandomValues) {
    return Crypto.getRandomValues(arr);
  }
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(arr);
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    return globalThis.crypto.getRandomValues(arr);
  }
  throw new Error(
    'Cryptographically secure random number generator (CSPRNG) is unavailable. Refusing to operate with weak entropy.'
  );
}
