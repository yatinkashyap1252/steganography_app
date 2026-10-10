/**
 * In-Memory & Local Vault State for Stealth Studio.
 * Allows seamless sharing of encoded images between Encode, Decode, and Vault screens on device.
 */

export interface VaultImage {
  id: string;
  name: string;
  dataUri: string;
  width: number;
  height: number;
  rgba?: Uint8Array;
  psnr: number;
  payloadType: number;
  sizeBytes: number;
  timestamp: string;
}

const MAX_VAULT_ITEMS = 20;

// In-memory store initialized with a default test vault
let vaultImages: VaultImage[] = [];

export function addVaultImage(item: VaultImage) {
  // Cap at 20 items to prevent heap bloat (M-02 fix)
  vaultImages = [item, ...vaultImages].slice(0, MAX_VAULT_ITEMS);
}

export function getVaultImages(): VaultImage[] {
  return vaultImages;
}

export function getLatestVaultImage(): VaultImage | null {
  return vaultImages.length > 0 ? vaultImages[0] : null;
}
