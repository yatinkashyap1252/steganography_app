import { NativeModules, Platform } from 'react-native';

const { FlagSecureModule } = NativeModules;

/**
 * Activates or deactivates Android FLAG_SECURE on the current window.
 * When enabled, hardware screenshots, screen recordings, and recents card previews
 * are completely blocked by the Android OS DRM system.
 */
export const setFlagSecure = async (enable: boolean): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  if (!FlagSecureModule) {
    console.warn('[FlagSecure] Native FlagSecureModule not found.');
    return false;
  }

  try {
    if (enable) {
      await FlagSecureModule.activate();
    } else {
      await FlagSecureModule.deactivate();
    }
    return true;
  } catch (err) {
    console.warn('[FlagSecure] Failed to toggle flag:', err);
    return false;
  }
};
