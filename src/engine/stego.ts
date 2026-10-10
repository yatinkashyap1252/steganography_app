/**
 * On-Device Steganography Pixel Engine for Stealth Studio.
 * Implements Keyed PRNG Pixel Dispersion and LSB Embedding/Extraction on raw RGBA buffers.
 */

import { HEADER_PREFIX_LEN, MAGIC_HEADER } from './crypto';

/**
 * Calculates maximum cloaking payload capacity in bytes for a given image resolution.
 */
export function getMaxPayloadCapacityBytes(width: number, height: number): number {
  const totalRgbBits = width * height * 3;
  const overhead = HEADER_PREFIX_LEN + 16; // Header prefix + AES-GCM 128-bit tag
  return Math.max(0, Math.floor(totalRgbBits / 8) - overhead);
}

/**
 * Creates a deterministic pseudo-random number generator from a 32-byte seed.
 * Uses a Mulberry32 algorithm combined with XorShift for high entropy and speed.
 */
class KeyedPRNG {
  private state: number;

  constructor(seed: Uint8Array) {
    // Fold 32-byte seed into a 32-bit integer state
    let h = 0x811c9dc5;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed[i];
      h = Math.imul(h, 0x01000193);
    }
    this.state = h >>> 0;
  }

  // Returns pseudo-random float between 0 and 1
  nextFloat(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns integer in range [0, maxExclusive)
  nextInt(maxExclusive: number): number {
    return Math.floor(this.nextFloat() * maxExclusive);
  }
}

/**
 * Generates an array of RGB byte indices in the flat RGBA buffer [R, G, B, A, R, G, B, A...]
 * Alpha channel (indices ending in 3) is strictly excluded to prevent transparency corruption.
 */
function getShuffledRGBIndices(pixelCount: number, seed: Uint8Array, countNeeded: number): number[] {
  const totalSlots = pixelCount * 3;
  if (countNeeded > totalSlots) {
    throw new Error(`Payload requires ${countNeeded} bits, but image only has ${totalSlots} available RGB bits.`);
  }

  const prng = new KeyedPRNG(seed);

  // Generate mapping from slot (0..totalSlots-1) to actual RGBA byte index
  // slot % 3: 0 -> R (+0), 1 -> G (+1), 2 -> B (+2)
  // pixel = Math.floor(slot / 3) -> byteIndex = pixel * 4 + (slot % 3)
  const slotToByteIndex = (slot: number) => {
    const pixel = Math.floor(slot / 3);
    const channel = slot % 3;
    return pixel * 4 + channel;
  };

  // Modern Fisher-Yates partial shuffle to extract exactly 'countNeeded' indices
  // Using a sparse map to keep memory small (< 1 MB) even for high-res images
  const map = new Map<number, number>();
  const indices: number[] = new Array(countNeeded);

  for (let i = 0; i < countNeeded; i++) {
    const remaining = totalSlots - i;
    const randOffset = prng.nextInt(remaining);
    const chosenSlot = i + randOffset;

    const valChosen = map.has(chosenSlot) ? map.get(chosenSlot)! : chosenSlot;
    const valCurrent = map.has(i) ? map.get(i)! : i;

    map.set(chosenSlot, valCurrent);
    indices[i] = slotToByteIndex(valChosen);
  }

  return indices;
}

/**
 * Embeds a binary frame into an RGBA pixel array using Keyed PRNG LSB dispersion.
 *
 * @param rgba Raw RGBA pixel bytes (modified in-place and returned)
 * @param width Image width
 * @param height Image height
 * @param frame Binary frame (from encryptPayload)
 * @param stegoSeed Stego PRNG seed
 * @returns Modified RGBA pixel array
 */
export function embedFrame(
  rgba: Uint8Array,
  width: number,
  height: number,
  frame: Uint8Array,
  stegoSeed: Uint8Array
): Uint8Array {
  const pixelCount = width * height;
  const totalBitsNeeded = frame.length * 8;

  const targetIndices = getShuffledRGBIndices(pixelCount, stegoSeed, totalBitsNeeded);

  let bitIndex = 0;
  for (let byteIdx = 0; byteIdx < frame.length; byteIdx++) {
    const byteVal = frame[byteIdx];
    for (let bit = 7; bit >= 0; bit--) {
      const bitVal = (byteVal >> bit) & 1;
      const targetRgbaIdx = targetIndices[bitIndex++];
      // Replace Least Significant Bit (LSB)
      rgba[targetRgbaIdx] = (rgba[targetRgbaIdx] & 0xfe) | bitVal;
    }
  }

  return rgba;
}

/**
 * Extracts a binary frame from an RGBA pixel array using Keyed PRNG coordinates.
 */
export function extractFrame(
  rgba: Uint8Array,
  width: number,
  height: number,
  stegoSeed: Uint8Array
): Uint8Array {
  const pixelCount = width * height;
  const headerBitsNeeded = HEADER_PREFIX_LEN * 8;

  // Step 1: Extract header prefix (37 bytes)
  const headerIndices = getShuffledRGBIndices(pixelCount, stegoSeed, headerBitsNeeded);
  const headerBytes = new Uint8Array(HEADER_PREFIX_LEN);

  for (let i = 0; i < HEADER_PREFIX_LEN; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      const bitVal = rgba[headerIndices[i * 8 + b]] & 1;
      byteVal = (byteVal << 1) | bitVal;
    }
    headerBytes[i] = byteVal;
  }

  // Verify MAGIC signature
  for (let m = 0; m < 4; m++) {
    if (headerBytes[m] !== MAGIC_HEADER[m]) {
      throw new Error('Steganography signature missing. Image has no cloaked data or incorrect key.');
    }
  }

  // Read payload length (bytes 33..36 Big-Endian UInt32)
  const view = new DataView(headerBytes.buffer, headerBytes.byteOffset, headerBytes.byteLength);
  const payloadLen = view.getUint32(33, false);

  // Total frame size = HEADER_PREFIX_LEN + payloadLen + 16 (GCM auth tag)
  const totalFrameBytes = HEADER_PREFIX_LEN + payloadLen + 16;
  const totalBitsNeeded = totalFrameBytes * 8;

  // Step 2: Extract full frame (copy verified header and extract remaining payload bytes)
  const fullIndices = getShuffledRGBIndices(pixelCount, stegoSeed, totalBitsNeeded);
  const fullFrame = new Uint8Array(totalFrameBytes);
  fullFrame.set(headerBytes, 0);

  for (let i = HEADER_PREFIX_LEN; i < totalFrameBytes; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      const bitVal = rgba[fullIndices[i * 8 + b]] & 1;
      byteVal = (byteVal << 1) | bitVal;
    }
    fullFrame[i] = byteVal;
  }

  return fullFrame;
}

/**
 * Computes Peak Signal-to-Noise Ratio (PSNR) in dB between two RGBA buffers.
 * Scores > 50 dB represent mathematically imperceptible modifications.
 */
export function calculatePSNR(original: Uint8Array, stego: Uint8Array): number {
  if (original.length !== stego.length) return 0;

  let sumSquaredDiff = 0;
  let count = 0;

  for (let i = 0; i < original.length; i++) {
    // Only evaluate RGB channels, skip Alpha channel (i % 4 === 3)
    if (i % 4 !== 3) {
      const diff = original[i] - stego[i];
      sumSquaredDiff += diff * diff;
      count++;
    }
  }

  const mse = sumSquaredDiff / count;
  if (mse === 0) return 100.0; // Identical images

  const maxVal = 255.0;
  const psnr = 20 * Math.log10(maxVal / Math.sqrt(mse));
  return Math.round(psnr * 10) / 10;
}
