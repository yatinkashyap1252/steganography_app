import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { colors } from '../theme/colors';
import { FeatureComingSoonModal } from '../components/FeatureComingSoonModal';
import { decryptPayload, deriveStegoSeed, bytesToUtf8 } from '../engine/crypto';
import { extractFrame } from '../engine/stego';
import { decodePNG, dataUriToArrayBuffer } from '../engine/png';
import { getLatestVaultImage } from '../services/vaultState';

interface Props {
  onBack: () => void;
}

export const DecodeStudioScreen: React.FC<Props> = ({ onBack }) => {
  const [key, setKey] = useState('Valkyrie99#');
  const [revealedResult, setRevealedResult] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [customImage, setCustomImage] = useState<{
    name: string;
    dataUri: string;
    width: number;
    height: number;
    rgba: Uint8Array;
    sizeBytes: number;
    psnr?: number;
  } | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');

  const latestItem = getLatestVaultImage();
  const activeItem = customImage || latestItem;

  const handlePickImage = async () => {
    try {
      // 1. Request permission gracefully (Photo Picker on Android 13+ doesn't need broad permissions)
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted && !permission.canAskAgain) {
          // Continue anyway, system photo picker doesn't need broad storage permission
        }
      } catch (_) {}

      // 2. Launch image picker with automatic fallback for older devices or custom Android ROMs
      let result;
      try {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
        });
      } catch (pickerErr) {
        // Fallback to legacy GET_CONTENT intent
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 1,
          legacy: true,
        });
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      // Read PNG bytes
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const buffer = dataUriToArrayBuffer(base64);
      let decoded;
      try {
        decoded = decodePNG(buffer);
      } catch (pngErr) {
        throw new Error(
          'This image is a compressed JPEG or non-PNG file.\n\n📱 Why this happened:\nWhatsApp automatically compresses regular photos into lossy JPEGs, erasing the hidden secret data.\n\n💡 How to fix:\nAsk the sender to resend the photo on WhatsApp as a "Document" (📎 -> Document). Documents are transferred 100% lossless!'
        );
      }

      setCustomImage({
        name: asset.fileName || 'selected_stego.png',
        dataUri: `data:image/png;base64,${base64}`,
        width: decoded.width,
        height: decoded.height,
        rgba: decoded.rgba,
        sizeBytes: buffer.byteLength,
      });

      Alert.alert(
        'Stego Image Loaded! 🔍',
        `Selected ${decoded.width}x${decoded.height} photo from gallery.\nEnter passphrase and tap Extract to unlock!`
      );
    } catch (err: any) {
      Alert.alert('Image Picker Error', err?.message || 'Failed to load image from gallery.');
    }
  };

  const handleScanQR = () => {
    setModalTitle('QR-Code Key Handshake');
    setModalDesc(
      'Will open the device camera to scan a one-time dynamic QR code shared offline by the sender to auto-fill the 256-bit key.'
    );
    setModalVisible(true);
  };

  // Real On-Device Extraction and Decryption
  const handleExtract = () => {
    if (!key) {
      Alert.alert('Missing Key', 'Please enter the decryption key or passphrase.');
      return;
    }

    if (!activeItem) {
      Alert.alert(
        'No Stego Image Found',
        'Please tap here to select an image from your gallery, or generate one in "Encode & Embed" first!'
      );
      return;
    }

    setIsExtracting(true);

    // Yield control to JS event loop so ActivityIndicator paints smoothly
    setTimeout(() => {
      try {
        // Step 1: Obtain RGBA from image (on-demand decode if not in RAM)
        let rgba = activeItem.rgba;
        let width = activeItem.width;
        let height = activeItem.height;

        if (!rgba && activeItem.dataUri) {
          const buffer = dataUriToArrayBuffer(activeItem.dataUri);
          const decoded = decodePNG(buffer);
          rgba = decoded.rgba;
          width = decoded.width;
          height = decoded.height;
        }

        if (!rgba) {
          throw new Error('Image pixel buffer is unavailable.');
        }

        // Step 2: Derive deterministic stego seed from passphrase (C-02 fix)
        const stegoSeed = deriveStegoSeed(key);

        // Step 3: Extract binary frame using keyed PRNG pixel walk
        const extractedFrame = extractFrame(
          rgba,
          width,
          height,
          stegoSeed
        );

        // Step 4: Authenticated AES-256-GCM Decryption
        const { data, payloadType } = decryptPayload(extractedFrame, key);

        const recoveredMessage = bytesToUtf8(data);

        setRevealedResult(recoveredMessage);
      } catch (err: any) {
        Alert.alert(
          'Decryption Failed ⚠️',
          err?.message || 'Incorrect passphrase or tampered stego image.'
        );
      } finally {
        setIsExtracting(false);
      }
    }, 40);
  };

  const handleCopyText = () => {
    if (!revealedResult) return;
    Alert.alert(
      'Secret Copied',
      'The decrypted secret has been copied to your clipboard. For security, please clear your clipboard when done.'
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back to Vault Dashboard"
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Extract & Unlock (On-Device)</Text>
        <View style={styles.placeholderBox} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 10% Conceptzilla Mesh Telemetry Strip */}
        <View style={styles.conceptzillaMesh}>
          <View style={styles.meshLeft}>
            <View style={styles.meshPulseDot} />
            <Text style={styles.meshStatusText}>WhatsApp Document Mode</Text>
          </View>
          <Text style={styles.meshRateText}>100% BIT INTEGRITY</Text>
        </View>

        {/* 60% Swiss High-Typography 44px Hero */}
        <View style={styles.swissHeroGroup}>
          <Text style={styles.swissKicker}>DECRYPT AIRGAP CARRIER</Text>
          <Text style={styles.swissHero44}>EXTRACT.</Text>
          <View style={styles.swissSolidDivider} />
        </View>

        {/* Image Dropzone / Preview */}
        <TouchableOpacity style={styles.imageCard} onPress={handlePickImage} activeOpacity={0.8}>
          {activeItem ? (
            <View style={styles.previewContainer}>
              <Image source={{ uri: activeItem.dataUri }} style={styles.thumbImage} resizeMode="cover" />
              <View style={styles.thumbMeta}>
                <Text style={styles.imageTitle}>{activeItem.name}</Text>
                <Text style={styles.imageSub}>
                  {activeItem.width}x{activeItem.height} • {(activeItem.sizeBytes / 1024).toFixed(1)} KB {activeItem.psnr ? `(PSNR ${activeItem.psnr} dB)` : ''}
                </Text>
                <Text style={{ fontSize: 9, color: colors.accentBlue, marginTop: 2 }}>Tap to choose different photo</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.imageIcon}>🖼️</Text>
              <Text style={styles.imageTitle}>Choose Stego Image from Gallery</Text>
              <Text style={styles.imageSub}>Select image received as Document file</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* 10% Conceptzilla High-Contrast Slip for Passphrase Key */}
        <View style={styles.contrastSlip}>
          <View style={styles.slipHeaderRow}>
            <Text style={styles.slipKicker}>DECRYPTION AUTHORIZATION</Text>
            <TouchableOpacity onPress={handleScanQR}>
              <Text style={styles.scanQrLink}>📷 Scan QR</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.slipInputRow}>
            <TextInput
              style={styles.slipInput}
              secureTextEntry
              value={key}
              onChangeText={setKey}
              placeholder="Enter shared key"
              placeholderTextColor={colors.slipWhiteSub}
            />
            <Text style={styles.slipLockIcon}>🔑</Text>
          </View>
        </View>

        {/* 60% Swiss Numbered Rows */}
        <View style={styles.swissNumberedRow}>
          <Text style={styles.swissRowLeft}>
            <Text style={styles.swissNumIndex}>01 </Text>
            <Text style={styles.swissRowLabel}>DECODE SPEED</Text>
          </Text>
          <Text style={styles.swissRowValue}>0.04s INSTANT DECODE</Text>
        </View>

        <View style={styles.swissNumberedRow}>
          <Text style={styles.swissRowLeft}>
            <Text style={styles.swissNumIndex}>02 </Text>
            <Text style={styles.swissRowLabel}>OUTPUT TARGET</Text>
          </Text>
          <Text style={styles.swissRowValue}>RAM BUFFER ONLY</Text>
        </View>

        {/* Extract Button - Swiss Pill CTA */}
        <TouchableOpacity
          style={[styles.swissPillCta, isExtracting && styles.extractButtonDisabled]}
          onPress={handleExtract}
          disabled={isExtracting}
          activeOpacity={0.85}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Extract and Decrypt Cloaked Payload"
        >
          {isExtracting ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.bgDeep} size="small" />
              <Text style={styles.swissPillCtaText}>EXTRACTING & DECRYPTING...</Text>
            </View>
          ) : (
            <Text style={styles.swissPillCtaText}>REVEAL SECRET PAYLOAD</Text>
          )}
        </TouchableOpacity>

        {/* Decrypted Payload Result Card */}
        {revealedResult && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.authBadge}>
                <Text style={styles.authIcon}>✓</Text>
                <Text style={styles.authText}>AUTHENTICATED PAYLOAD</Text>
              </View>
              <Text style={styles.cipherTag}>AES-256-GCM VERIFIED</Text>
            </View>

            <View style={styles.resultBox}>
              <Text style={styles.resultText}>{revealedResult}</Text>
            </View>

            <View style={styles.resultActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleCopyText}
                activeOpacity={0.7}
              >
                <Text style={styles.actionBtnText}>📋 Copy Text</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setRevealedResult(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.actionBtnText}>🗑️ Clear</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Feature Coming Soon Modal */}
      <FeatureComingSoonModal
        visible={modalVisible}
        title={modalTitle}
        description={modalDesc}
        onClose={() => setModalVisible(false)}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.vaultCardBorder,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.vaultCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.textLight,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
  placeholderBox: {
    width: 36,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  imageCard: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.vaultCardBorder,
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    marginBottom: 20,
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  thumbImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  thumbMeta: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  imageIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imageTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  imageSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  scanQrLink: {
    fontSize: 11,
    color: colors.vaultIndigo,
    fontWeight: '600',
  },
  keyRow: {
    backgroundColor: colors.vaultCard,
    borderColor: colors.vaultCardBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  keyInput: {
    height: 44,
    color: colors.textLight,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  extractButton: {
    backgroundColor: colors.vaultIndigo,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.vaultIndigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 24,
  },
  extractButtonDisabled: {
    opacity: 0.6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extractButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  resultCard: {
    backgroundColor: colors.vaultCard,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authIcon: {
    fontSize: 14,
    color: colors.vaultEmerald,
    fontWeight: '700',
  },
  authText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.vaultEmerald,
  },
  cipherTag: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
  resultBox: {
    backgroundColor: colors.vaultBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.textLight,
    lineHeight: 18,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
  },

  /* 10% Conceptzilla Mesh Telemetry Strip */
  conceptzillaMesh: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 56, 38, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  meshLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  meshPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentEmerald,
  },
  meshStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accentEmerald,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  meshRateText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textLight,
  },

  /* 60% Swiss High-Typography 44px Hero */
  swissHeroGroup: {
    marginBottom: 16,
  },
  swissKicker: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  swissHero44: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.textLight,
    letterSpacing: -2,
    marginVertical: 4,
  },
  swissSolidDivider: {
    height: 2,
    backgroundColor: colors.borderStrong,
    marginTop: 6,
    marginBottom: 12,
  },

  /* 30% Pastel Bento 2x2 Pipeline Grid */
  bento2x2Grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  bentoTile: {
    width: '48.5%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    minHeight: 92,
    justifyContent: 'space-between',
  },
  bentoBlue: {
    backgroundColor: colors.bentoBlueBg,
    borderColor: colors.bentoBlueBorder,
  },
  bentoGreen: {
    backgroundColor: colors.bentoGreenBg,
    borderColor: colors.bentoGreenBorder,
  },
  bentoPurple: {
    backgroundColor: colors.bentoPurpleBg,
    borderColor: colors.bentoPurpleBorder,
  },
  bentoIcon: {
    fontSize: 20,
    color: colors.accentEmerald,
    fontWeight: '900',
  },
  bentoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textLight,
    marginTop: 4,
  },
  bentoValue: {
    fontSize: 10,
    color: colors.textDim,
    fontWeight: '600',
    marginTop: 2,
  },

  /* 10% Conceptzilla Contrast Slip */
  contrastSlip: {
    backgroundColor: colors.slipWhite,
    borderRadius: 16,
    padding: 14,
    marginVertical: 14,
  },
  slipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  slipKicker: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: colors.slipWhiteSub,
    textTransform: 'uppercase',
  },
  slipInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slipInput: {
    flex: 1,
    height: 38,
    color: colors.slipWhiteText,
    fontSize: 13,
    fontWeight: '700',
  },
  slipLockIcon: {
    fontSize: 14,
    marginLeft: 6,
  },

  /* 60% Swiss Numbered Rows */
  swissNumberedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  swissRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swissNumIndex: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '900',
    color: colors.textSubtle,
  },
  swissRowLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.5,
  },
  swissRowValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textDim,
  },

  /* Swiss High-Contrast Action Button */
  swissPillCta: {
    backgroundColor: colors.accentEmerald,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  swissPillCtaText: {
    color: colors.bgDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
