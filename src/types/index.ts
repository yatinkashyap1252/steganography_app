export type AppScreen = 
  | 'AUDIO_DISGUISE' 
  | 'INNOCENT_EQ' 
  | 'DURESS_DECOY' 
  | 'VAULT_DASHBOARD' 
  | 'ENCODE_STUDIO' 
  | 'DECODE_STUDIO' 
  | 'GHOST_CHAT';

export type PayloadType = 'text' | 'voice' | 'file';

export type StegoMode = 'ghost_stealth' | 'social_media';

export interface VolumeLevels {
  media: number;
  ring: number;
  alerts: number;
  alarm: number;
}

export interface CloakedVaultItem {
  id: string;
  name: string;
  type: string;
  size: string;
  timestamp: string;
  previewIcon: string;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'agent';
  imageUri: string;
  imageCaption: string;
  hiddenSecret: string;
  isUnlocked: boolean;
  timestamp: string;
  ttlRemaining?: number;
  isBurned?: boolean;
  burnDuration?: number;
}

