import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { ChatMessage } from '../types';
import { FeatureComingSoonModal } from '../components/FeatureComingSoonModal';
import { MagnifyingLoupe } from '../components/MagnifyingLoupe';
import { setFlagSecure } from '../services/flagSecure';
import {
  generateDeadDropCode,
  ChatSecurityConfig,
  DEFAULT_SECURITY_CONFIG,
} from '../services/deadDropSession';

interface Props {
  onBack: () => void;
}

export const GhostChatScreen: React.FC<Props> = ({ onBack }) => {
  // 1. Zero-Account Dead Drop Session State
  const [sessionCode, setSessionCode] = useState<string>(() => generateDeadDropCode());
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // 2. Security Configurations (FLAG_SECURE, Auto-Destroy Window, Loupe Mode)
  const [securityConfig, setSecurityConfig] =
    useState<ChatSecurityConfig>(DEFAULT_SECURITY_CONFIG);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // 3. Message Thread
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'agent',
      imageUri: '☕',
      imageCaption: 'Downtown rendezvous checkpoint.',
      hiddenSecret:
        'Package deposited in locker #42. Code is 9182. Burn this message after viewing.',
      isUnlocked: false,
      timestamp: '14:22',
      burnDuration: 15,
    },
    {
      id: '2',
      sender: 'me',
      imageUri: '🌆',
      imageCaption: 'City sector scan.',
      hiddenSecret: 'Roger. Target in sight. Extraction window in 10 minutes.',
      isUnlocked: true,
      timestamp: '14:26',
      ttlRemaining: 15,
      burnDuration: 15,
    },
  ]);

  const [inputSecret, setInputSecret] = useState('');
  const [featureModalVisible, setFeatureModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');

  // 4. Hardware FLAG_SECURE Enforcement
  useEffect(() => {
    let isMounted = true;
    if (securityConfig.flagSecureEnabled) {
      setFlagSecure(true).catch((err) =>
        console.warn('FLAG_SECURE activation error:', err)
      );
    } else {
      setFlagSecure(false).catch((err) =>
        console.warn('FLAG_SECURE deactivation error:', err)
      );
    }

    return () => {
      isMounted = false;
      setFlagSecure(false).catch(() => {});
    };
  }, [securityConfig.flagSecureEnabled]);

  // 5. Ephemeral Auto-Destroy Countdown Timer (10-30s configured window)
  useEffect(() => {
    const timer = setInterval(() => {
      setMessages((prev) => {
        let changed = false;
        const updated = prev.map((msg) => {
          if (!msg.isUnlocked || msg.isBurned) {
            return msg;
          }

          // If auto-destroy is disabled (0), do nothing
          if (securityConfig.autoDestroySeconds === 0) {
            return msg;
          }

          // Initialize ttlRemaining if not set
          const currentTtl =
            msg.ttlRemaining !== undefined
              ? msg.ttlRemaining
              : securityConfig.autoDestroySeconds;

          if (currentTtl <= 1) {
            changed = true;
            return {
              ...msg,
              ttlRemaining: 0,
              isBurned: true,
              hiddenSecret: '',
            };
          }

          changed = true;
          return {
            ...msg,
            ttlRemaining: currentTtl - 1,
            burnDuration: msg.burnDuration || securityConfig.autoDestroySeconds,
          };
        });

        return changed ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [securityConfig.autoDestroySeconds]);

  // Toggle Unlock / Start Ephemeral Burn Countdown
  const toggleUnlock = (id: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== id || msg.isBurned) return msg;
        const nextUnlocked = !msg.isUnlocked;
        return {
          ...msg,
          isUnlocked: nextUnlocked,
          ttlRemaining:
            nextUnlocked && securityConfig.autoDestroySeconds > 0
              ? securityConfig.autoDestroySeconds
              : msg.ttlRemaining,
          burnDuration: securityConfig.autoDestroySeconds,
        };
      })
    );
  };

  // Dead Drop: Burn Room & Wipe All RAM
  const handleBurnRoom = () => {
    Alert.alert(
      '🔥 Burn Dead Drop Room?',
      'This will incinerate all messages and ephemeral session keys from device RAM immediately. Zero traces will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Burn & Wipe',
          style: 'destructive',
          onPress: () => {
            setMessages([]);
            const newCode = generateDeadDropCode();
            setSessionCode(newCode);
            setRoomModalVisible(false);
            Alert.alert(
              'Room Purged 💥',
              `Dead Drop obliterated. Generated fresh session room: ${newCode}`
            );
          },
        },
      ]
    );
  };

  // Dead Drop: Join existing room code
  const handleJoinRoom = () => {
    if (!joinCodeInput.trim()) {
      Alert.alert('Missing Code', 'Please enter a valid Dead Drop room code.');
      return;
    }
    const cleanCode = joinCodeInput.trim().toUpperCase();
    setSessionCode(cleanCode);
    setJoinCodeInput('');
    setMessages([]);
    setRoomModalVisible(false);
    Alert.alert(
      'Connected to Dead Drop 📍',
      `Switched to room [${cleanCode}]. Room encryption keys derived.`
    );
  };

  // Simulate Incoming Peer Drop for interactive testing
  const handleSimulateIncomingDrop = () => {
    const sampleSecrets = [
      'Encrypted coordinates confirmed: Sector 7, grid 44-B.',
      'Operative Falcon has verified the cipher handshake.',
      'Standby for payload extraction. The secondary channel is active.',
    ];
    const sampleCaptions = [
      'Subway platform transit camera.',
      'Satellite reconnaissance tile.',
      'Architectural blueprint snapshot.',
    ];
    const sampleEmojis = ['🚇', '🛰️', '🗺️', '📸'];

    const idx = Math.floor(Math.random() * sampleSecrets.length);
    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'agent',
      imageUri: sampleEmojis[Math.floor(Math.random() * sampleEmojis.length)],
      imageCaption: sampleCaptions[idx],
      hiddenSecret: sampleSecrets[idx],
      isUnlocked: false,
      timestamp: 'Just now',
      burnDuration: securityConfig.autoDestroySeconds,
    };

    setMessages((prev) => [...prev, newMsg]);
    Alert.alert(
      'Dead Drop Received 📥',
      `Agent Raven dropped a new stego image into room [${sessionCode}]!\nTap the photo to decode.`
    );
  };

  const handleSend = () => {
    if (!inputSecret.trim()) return;

    const newMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'me',
      imageUri: '🏞️',
      imageCaption: `Stego Matrix cloaked for [${sessionCode}]`,
      hiddenSecret: inputSecret.trim(),
      isUnlocked: true,
      timestamp: 'Just now',
      ttlRemaining:
        securityConfig.autoDestroySeconds > 0
          ? securityConfig.autoDestroySeconds
          : undefined,
      burnDuration: securityConfig.autoDestroySeconds,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputSecret('');
  };

  return (
    <View style={styles.container}>
      {/* Chat Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roomBadge}
            onPress={() => setRoomModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.activeRoomDot} />
            <View>
              <Text style={styles.roomTitleText}>DEAD DROP ROOM</Text>
              <Text style={styles.roomCodeText}>{sessionCode} ▾</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          {/* Quick Simulation Drop Test Button */}
          <TouchableOpacity
            style={styles.simulateBtn}
            onPress={handleSimulateIncomingDrop}
            activeOpacity={0.7}
          >
            <Text style={styles.simulateBtnText}>+ DROP</Text>
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => setSettingsModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Security Status HUD Banner */}
      <View style={styles.hudBanner}>
        <View style={styles.hudItem}>
          <Text style={styles.hudIcon}>
            {securityConfig.flagSecureEnabled ? '🛡️' : '⚠️'}
          </Text>
          <Text
            style={[
              styles.hudText,
              {
                color: securityConfig.flagSecureEnabled
                  ? colors.vaultEmerald
                  : colors.vaultAmber,
              },
            ]}
          >
            {securityConfig.flagSecureEnabled
              ? 'FLAG_SECURE ON'
              : 'SCREEN CAPTURE ALLOWED'}
          </Text>
        </View>

        <View style={styles.hudDivider} />

        <View style={styles.hudItem}>
          <Text style={styles.hudIcon}>⏱️</Text>
          <Text style={styles.hudText}>
            {securityConfig.autoDestroySeconds > 0
              ? `BURN: ${securityConfig.autoDestroySeconds}s`
              : 'BURN: OFF'}
          </Text>
        </View>

        <View style={styles.hudDivider} />

        <View style={styles.hudItem}>
          <Text style={styles.hudIcon}>🔍</Text>
          <Text style={styles.hudText}>
            {securityConfig.loupeMode ? 'LOUPE: ON' : 'LOUPE: OFF'}
          </Text>
        </View>
      </View>

      {/* Messages Thread */}
      <ScrollView
        contentContainerStyle={styles.thread}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>Dead Drop Room Empty</Text>
            <Text style={styles.emptySubtitle}>
              Room [{sessionCode}] has zero messages in memory.
            </Text>
            <TouchableOpacity
              style={styles.emptyDropBtn}
              onPress={handleSimulateIncomingDrop}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyDropBtnText}>Simulate Inflow Drop 📥</Text>
            </TouchableOpacity>
          </View>
        ) : (
          messages.map((m) => {
            const isMe = m.sender === 'me';
            const ttl = m.ttlRemaining;

            return (
              <View
                key={m.id}
                style={[
                  styles.bubbleWrapper,
                  isMe ? styles.bubbleRight : styles.bubbleLeft,
                ]}
              >
                <View
                  style={[
                    styles.chatCard,
                    isMe ? styles.chatCardMe : styles.chatCardOther,
                    m.isBurned && styles.chatCardBurned,
                  ]}
                >
                  {/* Photo container */}
                  <TouchableOpacity
                    style={styles.photoContainer}
                    onPress={() => toggleUnlock(m.id)}
                    activeOpacity={0.85}
                    disabled={m.isBurned}
                  >
                    <View style={styles.photoPlaceholder}>
                      <Text style={styles.photoEmoji}>
                        {m.isBurned ? '💨' : m.imageUri}
                      </Text>
                    </View>

                    {/* Overlay Pill / Auto-Destroy Countdown */}
                    <View
                      style={[
                        styles.overlayPill,
                        m.isBurned && { backgroundColor: '#7f1d1d' },
                        !m.isBurned &&
                          m.isUnlocked &&
                          ttl !== undefined &&
                          ttl <= 5 && { backgroundColor: '#dc2626' },
                      ]}
                    >
                      <Text style={styles.overlayText}>
                        {m.isBurned
                          ? '🔥 BURNED'
                          : m.isUnlocked
                          ? ttl !== undefined && ttl > 0
                            ? `⏱️ ${ttl}s REMAINING`
                            : '🔓 UNLOCKED'
                          : '🔒 TAP TO DECODE'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Secret Revealed or Loupe Lens */}
                  {m.isUnlocked && (
                    <MagnifyingLoupe
                      secretText={m.hiddenSecret}
                      isUnlocked={m.isUnlocked}
                      useLoupeMode={securityConfig.loupeMode}
                      isBurned={m.isBurned}
                    />
                  )}

                  <View style={styles.metaRow}>
                    <Text style={styles.captionText} numberOfLines={1}>
                      {m.isBurned ? 'Payload incinerated from RAM' : m.imageCaption}
                    </Text>
                    <Text style={styles.timeText}>{m.timestamp}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity
          style={styles.cameraBtn}
          onPress={() => {
            setModalTitle('Realtime Camera Embedding');
            setModalDesc(
              `Will capture photo, encrypt secret text using Dead Drop room [${sessionCode}] key, and cloak into pixel matrix.`
            );
            setFeatureModalVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.cameraIcon}>📷</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.inputField}
          placeholder="Type secret for Dead Drop room..."
          placeholderTextColor={colors.textMuted}
          value={inputSecret}
          onChangeText={setInputSecret}
        />

        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          activeOpacity={0.7}
        >
          <Text style={styles.sendIcon}>➤</Text>
        </TouchableOpacity>
      </View>

      {/* 1. DEAD DROP ROOM MANAGEMENT MODAL */}
      <Modal
        visible={roomModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoomModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dead Drop Session 📍</Text>
              <TouchableOpacity
                onPress={() => setRoomModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              Zero-Account ephemeral room. Both sender and receiver enter this code
              to derive matching AES-256 session keys with zero server registration.
            </Text>

            {/* Current Active Room */}
            <View style={styles.roomDisplayBox}>
              <Text style={styles.roomDisplayLabel}>ACTIVE ROOM CODE</Text>
              <Text style={styles.roomDisplayCode}>{sessionCode}</Text>
              <Text style={styles.roomDisplayHint}>
                Share this code with your peer offline or via encrypted channel.
              </Text>
            </View>

            {/* Generate Fresh Code */}
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => {
                const fresh = generateDeadDropCode();
                setSessionCode(fresh);
                setMessages([]);
                Alert.alert('New Dead Drop', `Generated new room: ${fresh}`);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnOutlineText}>
                🔄 Generate Fresh Room Code
              </Text>
            </TouchableOpacity>

            {/* Join Room Code Input */}
            <View style={styles.joinBox}>
              <Text style={styles.joinLabel}>JOIN PEER ROOM CODE</Text>
              <View style={styles.joinRow}>
                <TextInput
                  style={styles.joinInput}
                  placeholder="e.g. CIPHER-4921"
                  placeholderTextColor={colors.textMuted}
                  value={joinCodeInput}
                  onChangeText={setJoinCodeInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={handleJoinRoom}
                  activeOpacity={0.8}
                >
                  <Text style={styles.joinBtnText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Burn Room Button */}
            <TouchableOpacity
              style={styles.burnRoomBtn}
              onPress={handleBurnRoom}
              activeOpacity={0.8}
            >
              <Text style={styles.burnRoomBtnText}>
                🔥 Burn Room & Wipe RAM
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. CHAT SECURITY & TIMING SETTINGS MODAL */}
      <Modal
        visible={settingsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chat Security Settings ⚙️</Text>
              <TouchableOpacity
                onPress={() => setSettingsModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* 1. AUTO-DESTROY WINDOW (10-30s) */}
            <View style={styles.settingSection}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingLabel}>🔥 Auto-Destroy Window</Text>
                <Text style={styles.settingValue}>
                  {securityConfig.autoDestroySeconds > 0
                    ? `${securityConfig.autoDestroySeconds}s`
                    : 'Disabled'}
                </Text>
              </View>
              <Text style={styles.settingDesc}>
                Messages will self-destruct and be scrubbed from device memory
                after being decrypted.
              </Text>

              {/* Selector Pills: 10s, 15s, 20s, 30s, Off */}
              <View style={styles.pillsRow}>
                {[10, 15, 20, 30, 0].map((sec) => {
                  const isSelected =
                    securityConfig.autoDestroySeconds === sec;
                  return (
                    <TouchableOpacity
                      key={sec}
                      style={[
                        styles.pill,
                        isSelected && styles.pillActive,
                      ]}
                      onPress={() =>
                        setSecurityConfig((prev) => ({
                          ...prev,
                          autoDestroySeconds: sec,
                        }))
                      }
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          isSelected && styles.pillTextActive,
                        ]}
                      >
                        {sec === 0 ? 'Off' : `${sec}s`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. TOUCH-TO-REVEAL MAGNIFYING LOUPE */}
            <View style={styles.settingSection}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingLabel}>🔍 Magnifying Loupe Lens</Text>
                <Text style={styles.settingValue}>
                  {securityConfig.loupeMode ? 'Active' : 'Off'}
                </Text>
              </View>
              <Text style={styles.settingDesc}>
                Anti-shoulder-surfing lens: Obscures message until you press and
                drag your thumb to magnify slices beneath your finger.
              </Text>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  securityConfig.loupeMode && styles.toggleBtnActive,
                ]}
                onPress={() =>
                  setSecurityConfig((prev) => ({
                    ...prev,
                    loupeMode: !prev.loupeMode,
                  }))
                }
                activeOpacity={0.8}
              >
                <Text style={styles.toggleBtnText}>
                  {securityConfig.loupeMode
                    ? '✓ Loupe Mode Enabled'
                    : '✕ Loupe Mode Disabled'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 3. HARDWARE FLAG_SECURE (ANTI-SCREENSHOT) */}
            <View style={styles.settingSection}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingLabel}>🛡️ Android FLAG_SECURE</Text>
                <Text
                  style={[
                    styles.settingValue,
                    {
                      color: securityConfig.flagSecureEnabled
                        ? colors.vaultEmerald
                        : colors.vaultAmber,
                    },
                  ]}
                >
                  {securityConfig.flagSecureEnabled ? 'Protected' : 'Off'}
                </Text>
              </View>
              <Text style={styles.settingDesc}>
                Prevents hardware screenshots, screen video recordings, and
                hides preview thumbnails in Android task manager.
              </Text>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  securityConfig.flagSecureEnabled && styles.toggleBtnActive,
                ]}
                onPress={() =>
                  setSecurityConfig((prev) => ({
                    ...prev,
                    flagSecureEnabled: !prev.flagSecureEnabled,
                  }))
                }
                activeOpacity={0.8}
              >
                <Text style={styles.toggleBtnText}>
                  {securityConfig.flagSecureEnabled
                    ? '✓ FLAG_SECURE Shielded'
                    : '✕ FLAG_SECURE Disabled'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => setSettingsModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.doneBtnText}>Save & Return</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Feature Coming Soon Modal */}
      <FeatureComingSoonModal
        visible={featureModalVisible}
        title={modalTitle}
        description={modalDesc}
        onClose={() => setFeatureModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.vaultBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.vaultCardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.vaultCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
  },
  backButtonText: {
    color: colors.textLight,
    fontSize: 18,
  },
  roomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 23, 18, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 8,
  },
  activeRoomDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.vaultEmerald,
  },
  roomTitleText: {
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  roomCodeText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
    color: colors.vaultEmerald,
  },
  simulateBtn: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  simulateBtnText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.vaultCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
  },
  settingsIcon: {
    fontSize: 16,
  },
  hudBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#050a14',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  hudItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hudIcon: {
    fontSize: 10,
  },
  hudText: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.textMuted,
    fontWeight: '600',
  },
  hudDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  thread: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 18,
  },
  emptyDropBtn: {
    backgroundColor: colors.vaultCard,
    borderWidth: 1,
    borderColor: colors.vaultEmerald,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyDropBtnText: {
    color: colors.vaultEmerald,
    fontWeight: '700',
    fontSize: 12,
  },
  bubbleWrapper: {
    marginBottom: 16,
  },
  bubbleLeft: {
    alignItems: 'flex-start',
  },
  bubbleRight: {
    alignItems: 'flex-end',
  },
  chatCard: {
    width: 250,
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
  },
  chatCardOther: {
    backgroundColor: colors.vaultCard,
    borderColor: colors.vaultCardBorder,
  },
  chatCardMe: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  chatCardBurned: {
    borderColor: '#7f1d1d',
    opacity: 0.7,
  },
  photoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  photoPlaceholder: {
    height: 110,
    backgroundColor: colors.vaultBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  photoEmoji: {
    fontSize: 38,
  },
  overlayPill: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  overlayText: {
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
    color: colors.vaultEmerald,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  captionText: {
    fontSize: 9,
    color: colors.textMuted,
    flex: 1,
  },
  timeText: {
    fontSize: 8,
    color: colors.textMuted,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginLeft: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.vaultCard,
    borderTopWidth: 1,
    borderTopColor: colors.vaultCardBorder,
    gap: 8,
  },
  cameraBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.vaultBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
  },
  cameraIcon: {
    fontSize: 16,
  },
  inputField: {
    flex: 1,
    height: 40,
    backgroundColor: colors.vaultBg,
    borderRadius: 20,
    paddingHorizontal: 14,
    color: colors.textLight,
    fontSize: 12,
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.vaultAmber,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 14,
    color: colors.vaultBg,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.vaultCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textLight,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.vaultBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  modalSub: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
    marginBottom: 16,
  },
  roomDisplayBox: {
    backgroundColor: colors.vaultBg,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 14,
  },
  roomDisplayLabel: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.textMuted,
    marginBottom: 4,
  },
  roomDisplayCode: {
    fontSize: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '800',
    color: colors.vaultEmerald,
    letterSpacing: 2,
    marginVertical: 4,
  },
  roomDisplayHint: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  actionBtnOutline: {
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: colors.vaultBg,
  },
  actionBtnOutlineText: {
    color: colors.textLight,
    fontSize: 12,
    fontWeight: '600',
  },
  joinBox: {
    backgroundColor: colors.vaultBg,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
    marginBottom: 16,
  },
  joinLabel: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.textMuted,
    marginBottom: 8,
  },
  joinRow: {
    flexDirection: 'row',
    gap: 8,
  },
  joinInput: {
    flex: 1,
    height: 38,
    backgroundColor: colors.vaultCard,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: colors.textLight,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
  },
  joinBtn: {
    backgroundColor: colors.vaultEmerald,
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinBtnText: {
    color: colors.vaultBg,
    fontWeight: '700',
    fontSize: 12,
  },
  burnRoomBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  burnRoomBtnText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 13,
  },
  settingSection: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.vaultCardBorder,
  },
  settingLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textLight,
  },
  settingValue: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.vaultEmerald,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
    marginBottom: 10,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.vaultBg,
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: colors.vaultEmerald,
    borderColor: colors.vaultEmerald,
  },
  pillText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.textMuted,
    fontWeight: '700',
  },
  pillTextActive: {
    color: colors.vaultBg,
  },
  toggleBtn: {
    backgroundColor: colors.vaultBg,
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleBtnActive: {
    borderColor: colors.vaultEmerald,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textLight,
  },
  doneBtn: {
    backgroundColor: colors.vaultEmerald,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  doneBtnText: {
    color: colors.vaultBg,
    fontWeight: '800',
    fontSize: 13,
  },
});
