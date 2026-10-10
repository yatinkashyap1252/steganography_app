/**
 * On-Device PNG Parser & Generator for Stealth Studio.
 * Uses upng-js for lossless PNG decoding/encoding and data URI conversions.
 */

// @ts-ignore - upng-js has untyped default export in some environments
import UPNG from 'upng-js';

export interface DecodedImage {
  width: number;
  height: number;
  rgba: Uint8Array;
}

/**
 * Decodes a PNG ArrayBuffer into width, height, and raw RGBA Uint8Array.
 */
export function decodePNG(buffer: ArrayBuffer): DecodedImage {
  const img = UPNG.decode(buffer);
  const rgbaBuffers = UPNG.toRGBA8(img);
  const rgba = new Uint8Array(rgbaBuffers[0]);
  return {
    width: img.width,
    height: img.height,
    rgba,
  };
}

/**
 * Encodes an RGBA Uint8Array into a lossless PNG ArrayBuffer.
 */
export function encodePNG(rgba: Uint8Array, width: number, height: number): ArrayBuffer {
  // 0 = Lossless compression, cnum 0
  return UPNG.encode([rgba.buffer], width, height, 0);
}

/**
 * Generates an in-memory realistic cover image (smooth color gradients and ambient light).
 */
export function generateSyntheticCover(width: number = 300, height: number = 300): DecodedImage {
  const rgba = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = Math.floor(180 * (x / width) + 40 * Math.sin(y / 15));
      const g = Math.floor(140 * (y / height) + 50 * Math.cos(x / 20));
      const b = Math.floor(220 * (1 - (x + y) / (width + height)));

      rgba[idx] = Math.min(255, Math.max(0, r));
      rgba[idx + 1] = Math.min(255, Math.max(0, g));
      rgba[idx + 2] = Math.min(255, Math.max(0, b));
      rgba[idx + 3] = 255; // 100% Opacity
    }
  }

  return { width, height, rgba };
}

/**
 * Converts an ArrayBuffer to a base64 data URI for React Native Image rendering.
 * Optimized with 8192-byte chunking to avoid O(n^2) string allocations (M-04 fix).
 */
export function arrayBufferToDataUri(buffer: ArrayBuffer, mimeType: string = 'image/png'): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK_SIZE = 8192;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
  }
  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Converts a base64 data URI back into an ArrayBuffer for PNG decoding.
 */
export function dataUriToArrayBuffer(dataUri: string): ArrayBuffer {
  const base64 = dataUri.includes(',') ? dataUri.split(',')[1] : dataUri;
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
