import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '../engine/crypto';

const CODE_WORDS = [
  'GHOST',
  'PHANTOM',
  'RAVEN',
  'CIPHER',
  'HYDRA',
  'SHADOW',
  'VIPER',
  'APEX',
  'STEALTH',
  'NEBULA',
];

/**
 * Generates an ephemeral human-readable Dead Drop room code like "RAVEN-4821".
 */
export const generateDeadDropCode = (): string => {
  const word = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${word}-${num}`;
};

/**
 * Derives a 256-bit AES encryption key deterministically from the Dead Drop session code.
 * Both peers who share the room code can encrypt/decrypt stego payloads without any server auth.
 */
export const deriveDeadDropKey = (roomCode: string): Uint8Array => {
  const normalized = roomCode.trim().toUpperCase();
  const salt = utf8ToBytes('STEGO_DEAD_DROP_SALT_V1');
  return pbkdf2(sha256, utf8ToBytes(normalized), salt, { c: 2048, dkLen: 32 });
};

export interface ChatSecurityConfig {
  autoDestroySeconds: number; // 10, 15, 20, 30, or 0 (off)
  loupeMode: boolean; // touch-to-reveal magnifying loupe
  flagSecureEnabled: boolean; // hardware screenshot prevention
}

export const DEFAULT_SECURITY_CONFIG: ChatSecurityConfig = {
  autoDestroySeconds: 15, // Default 15s auto-destroy
  loupeMode: true, // Default enabled for anti-shoulder surfing
  flagSecureEnabled: true, // Default enabled
};
