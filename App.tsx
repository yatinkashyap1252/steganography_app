import React, { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { AppScreen } from './src/types';
import { AudioDisguiseScreen } from './src/screens/AudioDisguiseScreen';
import { InnocentEQScreen } from './src/screens/InnocentEQScreen';
import { DuressDecoyScreen } from './src/screens/DuressDecoyScreen';
import { VaultDashboardScreen } from './src/screens/VaultDashboardScreen';
import { EncodeStudioScreen } from './src/screens/EncodeStudioScreen';
import { DecodeStudioScreen } from './src/screens/DecodeStudioScreen';
import { GhostChatScreen } from './src/screens/GhostChatScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('AUDIO_DISGUISE');

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#090d16" translucent={false} />
      <View style={styles.screenWrapper}>
        {currentScreen === 'AUDIO_DISGUISE' && (
          <AudioDisguiseScreen
            onUnlockVault={() => setCurrentScreen('VAULT_DASHBOARD')}
            onUnlockDuress={() => setCurrentScreen('DURESS_DECOY')}
            onOpenEQ={() => setCurrentScreen('INNOCENT_EQ')}
          />
        )}

        {currentScreen === 'INNOCENT_EQ' && (
          <InnocentEQScreen onBack={() => setCurrentScreen('AUDIO_DISGUISE')} />
        )}

        {currentScreen === 'DURESS_DECOY' && (
          <DuressDecoyScreen onExit={() => setCurrentScreen('AUDIO_DISGUISE')} />
        )}

        {currentScreen === 'VAULT_DASHBOARD' && (
          <VaultDashboardScreen
            onNavigateEncode={() => setCurrentScreen('ENCODE_STUDIO')}
            onNavigateDecode={() => setCurrentScreen('DECODE_STUDIO')}
            onNavigateChat={() => setCurrentScreen('GHOST_CHAT')}
            onLock={() => setCurrentScreen('AUDIO_DISGUISE')}
          />
        )}

        {currentScreen === 'ENCODE_STUDIO' && (
          <EncodeStudioScreen onBack={() => setCurrentScreen('VAULT_DASHBOARD')} />
        )}

        {currentScreen === 'DECODE_STUDIO' && (
          <DecodeStudioScreen onBack={() => setCurrentScreen('VAULT_DASHBOARD')} />
        )}

        {currentScreen === 'GHOST_CHAT' && (
          <GhostChatScreen onBack={() => setCurrentScreen('VAULT_DASHBOARD')} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  screenWrapper: {
    flex: 1,
  },
});
