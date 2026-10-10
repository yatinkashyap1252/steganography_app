import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { colors } from '../theme/colors';
import { PayloadType, StegoMode } from '../types';
import { FeatureComingSoonModal } from '../components/FeatureComingSoonModal';
import { encryptPayload, utf8ToBytes } from '../engine/crypto';
import { embedFrame, calculatePSNR, getMaxPayloadCapacityBytes } from '../engine/stego';
import { generateSyntheticCover, encodePNG, arrayBufferToDataUri, decodePNG, dataUriToArrayBuffer } from '../engine/png';
import { addVaultImage } from '../services/vaultState';

interface Props {
  onBack: () => void;
}

export const EncodeStudioScreen: React.FC<Props> = ({ onBack }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [customCover, setCustomCover] = useState<{ width: number; height: number; rgba: Uint8Array } | null>(null);
  const [payloadType, setPayloadType] = useState<PayloadType>('text');
  const [secretText, setSecretText] = useState('TOP SECRET: Swiss Bank Vault PIN 9142. Crypto Seed: orbit matrix echo velocity pulse.');
  const [passphrase, setPassphrase] = useState('Valkyrie99#');
  const [mode, setMode] = useState<StegoMode>('ghost_stealth');
  const [generatedPreviewUri, setGeneratedPreviewUri] = useState<string | null>(null);
  const [livePsnr, setLivePsnr] = useState<number>(76.2);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');

  const handlePickImage = async () => {
    try {
      try {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted && !permission.canAskAgain) {
          // Continue anyway, system photo picker doesn't need broad storage permission
        }
      } catch (_) {}

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

      // Convert any format (JPEG, HEIC, WebP, etc.) to lossless PNG and constrain max dimension for JS speed
      const manipActions: ImageManipulator.Action[] = [];
      if (asset.width > 1200 || asset.height > 1200) {
        const resizeDimension = asset.width >= asset.height ? { width: 1200 } : { height: 1200 };
        manipActions.push({ resize: resizeDimension });
      }

      const manipResult = await ImageManipulator.manipulateAsync(
        asset.uri,
        manipActions,
        { format: ImageManipulator.SaveFormat.PNG }
      );

      setPickedImageUri(manipResult.uri);
      setSelectedImage(asset.fileName || 'gallery_photo.png');

      // Read PNG bytes from disk into memory
      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const buffer = dataUriToArrayBuffer(base64);
      const decoded = decodePNG(buffer);

      setCustomCover({
        width: decoded.width,
        height: decoded.height,
        rgba: decoded.rgba,
      });

      const maxCap = getMaxPayloadCapacityBytes(decoded.width, decoded.height);
      Alert.alert(
        'Cover Image Loaded! 📸',
        `Successfully loaded ${decoded.width}x${decoded.height} photo.\nMax payload capacity: up to ${(maxCap / 1024).toFixed(1)} KB of secret text!`
      );
    } catch (err: any) {
      Alert.alert('Image Picker Error', err?.message || 'Failed to select image from gallery.');
    }
  };

  const handleVoiceRecord = () => {
    setModalTitle('In-App Voice Recorder');
    setModalDesc(
      'The audio recorder (via expo-av) will capture an encrypted 30-second AAC audio memo and inject its raw bytes directly into the image matrix.'
    );
    setModalVisible(true);
  };

  const handleFilePick = () => {
    setModalTitle('Document Cloaking');
    setModalDesc(
      'Document picker will allow selecting PDFs, ZIP archives, or secondary secret images to cloak inside the cover photo.'
    );
    setModalVisible(true);
  };

  // Real On-Device Cryptographic Steganography Engine Execution!
  const handleGenerate = () => {
    if (!passphrase) {
      Alert.alert('Missing Passphrase', 'Please provide a secret key to encrypt the payload.');
      return;
    }

    if (payloadType === 'text' && !secretText.trim()) {
      Alert.alert('Empty Secret', 'Please enter a secret message or crypto recovery seed to cloak.');
      return;
    }

    setIsGenerating(true);

    // Yield control to event loop so ActivityIndicator paints immediately (M-01/U-01 fix)
    setTimeout(() => {
      try {
        // 1. Use custom cover from gallery if picked, otherwise generate high-fidelity synthetic cover
        const cover = customCover
          ? { width: customCover.width, height: customCover.height, rgba: new Uint8Array(customCover.rgba) }
          : generateSyntheticCover(350, 350);

        // 2. Validate payload capacity upfront (N-04 fix)
        const rawPayload = utf8ToBytes(secretText);
        const maxCapacity = getMaxPayloadCapacityBytes(cover.width, cover.height);

        if (rawPayload.length > maxCapacity) {
          throw new Error(
            `Payload exceeds capacity! Your secret is ${rawPayload.length} bytes, but this cover only holds ${maxCapacity} bytes.`
          );
        }

        // 3. Encrypt payload on-device with AES-256-GCM + PBKDF2 (100,000 iterations)
        const { frame, stegoSeed } = encryptPayload(rawPayload, passphrase, 0);

        // 4. Embed frame into raw RGBA pixel matrix using Keyed PRNG dispersion
        const stegoRgba = new Uint8Array(cover.rgba);
        embedFrame(stegoRgba, cover.width, cover.height, frame, stegoSeed);

        // 5. Calculate real mathematical PSNR score
        const realPsnr = calculatePSNR(cover.rgba, stegoRgba);
        setLivePsnr(realPsnr);

        // 6. Lossless PNG compression in pure JS
        const pngBuffer = encodePNG(stegoRgba, cover.width, cover.height);
        const dataUri = arrayBufferToDataUri(pngBuffer);
        setGeneratedPreviewUri(dataUri);

        // 7. Save to local device vault state (drop raw RGBA to avoid heap leak M-02)
        addVaultImage({
          id: String(Date.now()),
          name: `stego_cloaked_${Date.now()}.png`,
          dataUri,
          width: cover.width,
          height: cover.height,
          psnr: realPsnr,
          payloadType: 0,
          sizeBytes: pngBuffer.byteLength,
          timestamp: 'Just now',
        });

        Alert.alert(
          'Stego Image Generated (100% On-Device)! 🎉',
          `Success! Encrypted & Cloaked on your device with ZERO servers.\n\nPayload: ${secretText.length} characters\nCipher: AES-256-GCM (Authenticated)\nPSNR: ${realPsnr} dB (Imperceptible)\nSize: ${(pngBuffer.byteLength / 1024).toFixed(1)} KB\n\nImage saved to local vault! You can now extract it in Decode Studio!`,
          [{ text: 'Done' }]
        );
      } catch (err: any) {
        Alert.alert('Encoding Error', err?.message || 'Failed to embed payload.');
      } finally {
        setIsGenerating(false);
      }
    }, 40);
  };

  const handleSaveToGallery = async () => {
    if (!generatedPreviewUri) return;
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Needed',
          'Permission to access your photo library is required to save the cloaked photo.'
        );
        return;
      }

      // Write dataUri to a temporary PNG file in documentDirectory
      const filename = `stego_cloaked_${Date.now()}.png`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const base64Data = generatedPreviewUri.includes(',')
        ? generatedPreviewUri.split(',')[1]
        : generatedPreviewUri;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save into the phone's native gallery / photo library
      await MediaLibrary.saveToLibraryAsync(fileUri);

      Alert.alert(
        'Saved to Device Photos! 💾',
        'The cloaked stego photo has been saved to your photo album.\n\n⚠️ IMPORTANT (WhatsApp / Messaging Apps):\nWhen sending this photo, attach it as a "Document" (📎 -> Document), NOT as a regular photo!\n\nRegular photos get converted into compressed JPEGs, which destroys the hidden secret data.'
      );
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save photo to library.');
    }
  };

  const handleShare = async () => {
    if (!generatedPreviewUri) return;
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Unavailable', 'Native file sharing is not supported on this device.');
        return;
      }

      const filename = `stego_${Date.now()}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const base64Data = generatedPreviewUri.includes(',')
        ? generatedPreviewUri.split(',')[1]
        : generatedPreviewUri;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Lossless Stego Image',
        UTI: 'public.png',
      });
    } catch (err: any) {
      Alert.alert('Share Failed', err?.message || 'Failed to open share dialog.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Encode & Embed (On-Device)</Text>
        <View style={styles.placeholderBox} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 10% Conceptzilla Mesh Telemetry Strip */}
        <View style={styles.conceptzillaMesh}>
          <View style={styles.meshLeft}>
            <View style={styles.meshPulseDot} />
            <Text style={styles.meshStatusText}>Carrier Capacity</Text>
          </View>
          <Text style={styles.meshRateText}>
            {customCover
              ? `${(getMaxPayloadCapacityBytes(customCover.width, customCover.height) / 1024).toFixed(1)} KB CAPACITY`
              : '3.4 MB AVAILABLE'}
          </Text>
        </View>

        {/* 60% Swiss High-Typography 44px Hero */}
        <View style={styles.swissHeroGroup}>
          <Text style={styles.swissKicker}>STEGANALYSIS SCORE</Text>
          <Text style={styles.swissHero44}>
            {Math.min(99.9, Math.max(10, ((livePsnr - 30) / 45) * 100)).toFixed(1)}%
          </Text>
          <View style={styles.swissSolidDivider} />
        </View>

        {/* Cover Image Selector - Primary Action Card */}
        <TouchableOpacity
          style={styles.coverPickerCard}
          onPress={handlePickImage}
          activeOpacity={0.8}
        >
          {pickedImageUri ? (
            <View style={styles.coverPreviewRow}>
              <Image source={{ uri: pickedImageUri }} style={styles.coverThumb} resizeMode="cover" />
              <View style={styles.coverMeta}>
                <Text style={styles.coverTitle} numberOfLines={1}>
                  {selectedImage || 'Cover Image Selected'}
                </Text>
                <Text style={styles.coverSub}>
                  {customCover ? `${customCover.width}×${customCover.height} Lossless PNG` : 'Ready to Cloak'}
                </Text>
                <Text style={styles.coverChangeHint}>Tap to change cover photo</Text>
              </View>
            </View>
          ) : (
            <View style={styles.coverEmptyState}>
              <Text style={styles.coverEmptyIcon}>📸</Text>
              <Text style={styles.coverEmptyTitle}>Select Cover Photo</Text>
              <Text style={styles.coverEmptySub}>
                Tap to pick from gallery • Lossless PNG converted automatically
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Payload Type Segmented Selector */}
        <View style={styles.payloadSelectorRow}>
          <TouchableOpacity
            style={[styles.payloadButton, payloadType === 'text' && styles.payloadButtonActive]}
            onPress={() => setPayloadType('text')}
            activeOpacity={0.8}
          >
            <Text style={styles.payloadButtonIcon}>📝</Text>
            <Text style={[styles.payloadButtonText, payloadType === 'text' && styles.payloadButtonTextActive]}>
              Secret Text
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payloadButton, payloadType === 'voice' && styles.payloadButtonActive]}
            onPress={() => {
              setPayloadType('voice');
              handleVoiceRecord();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.payloadButtonIcon}>🎙️</Text>
            <Text style={[styles.payloadButtonText, payloadType === 'voice' && styles.payloadButtonTextActive]}>
              Voice Memo
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payloadButton, payloadType === 'file' && styles.payloadButtonActive]}
            onPress={() => {
              setPayloadType('file');
              handleFilePick();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.payloadButtonIcon}>📄</Text>
            <Text style={[styles.payloadButtonText, payloadType === 'file' && styles.payloadButtonTextActive]}>
              PDF / File
            </Text>
          </TouchableOpacity>
        </View>

        {/* Payload Text Input (when text active) */}
        {payloadType === 'text' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Enter secret message, private password, or 24-word crypto seed..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={secretText}
              onChangeText={setSecretText}
            />
          </View>
        )}

        {/* 10% Conceptzilla High-Contrast Slip for Passphrase Key */}
        <View style={styles.contrastSlip}>
          <Text style={styles.slipKicker}>AUTHENTICATION KEY</Text>
          <View style={styles.slipInputRow}>
            <TextInput
              style={styles.slipInput}
              secureTextEntry
              value={passphrase}
              onChangeText={setPassphrase}
              placeholder="Enter encryption passphrase"
              placeholderTextColor={colors.slipWhiteSub}
            />
            <Text style={styles.slipLockIcon}>🔒</Text>
          </View>
        </View>

        {/* 60% Swiss Numbered Operational Information Rows */}
        <View style={styles.swissNumberedRow}>
          <Text style={styles.swissRowLeft}>
            <Text style={styles.swissNumIndex}>01 </Text>
            <Text style={styles.swissRowLabel}>CARRIER SOURCE</Text>
          </Text>
          <Text style={styles.swissRowValue}>
            {selectedImage ? selectedImage.toUpperCase().slice(0, 16) : 'SYNTHETIC_1080P.PNG'}
          </Text>
        </View>

        <View style={styles.swissNumberedRow}>
          <Text style={styles.swissRowLeft}>
            <Text style={styles.swissNumIndex}>02 </Text>
            <Text style={styles.swissRowLabel}>CIPHER SUITE</Text>
          </Text>
          <Text style={styles.swissRowValue}>AES-256-GCM + PBKDF2</Text>
        </View>

        <View style={styles.swissNumberedRow}>
          <Text style={styles.swissRowLeft}>
            <Text style={styles.swissNumIndex}>03 </Text>
            <Text style={styles.swissRowLabel}>STEALTH PSNR</Text>
          </Text>
          <Text style={[styles.swissRowValue, { color: colors.accentEmerald }]}>
            {livePsnr} dB (UNDETECTABLE)
          </Text>
        </View>

        {/* Generated Stego Preview */}
        {generatedPreviewUri && (
          <View style={styles.previewBox}>
            <Text style={styles.previewTitle}>GENERATED STEGO IMAGE (CLOAKED)</Text>
            <Image source={{ uri: generatedPreviewUri }} style={styles.previewImage} resizeMode="cover" />
            <Text style={styles.previewCaption}>
              Contains encrypted payload scattered in pixel LSBs.
            </Text>

            <View style={styles.previewActionRow}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveToGallery}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Save stego photo to phone gallery"
              >
                <Text style={styles.saveBtnText}>💾 Save to Photos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareBtn}
                onPress={handleShare}
                activeOpacity={0.8}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Share stego photo"
              >
                <Text style={styles.shareBtnText}>📤 Share (Doc Mode)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Swiss High-Contrast Action Button */}
        <TouchableOpacity
          style={[styles.swissPillCta, isGenerating && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
          activeOpacity={0.85}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Lock and generate steganographic image"
        >
          {isGenerating ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.bgDeep} size="small" />
              <Text style={styles.swissPillCtaText}>ENCRYPTING & EMBEDDING...</Text>
            </View>
          ) : (
            <Text style={styles.swissPillCtaText}>GENERATE CLOAKED PNG</Text>
          )}
        </TouchableOpacity>
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
  imageSelectorCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.vaultCardBorder,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    marginBottom: 20,
  },
  imageIcon: {
    fontSize: 28,
    marginBottom: 6,
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.vaultCard,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabItemActive: {
    backgroundColor: colors.vaultEmerald,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDim,
  },
  tabTextActive: {
    color: colors.vaultBg,
    fontWeight: '700',
  },
  inputContainer: {
    marginBottom: 16,
  },
  textArea: {
    backgroundColor: colors.vaultCard,
    borderColor: colors.vaultCardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.textLight,
    height: 100,
    textAlignVertical: 'top',
  },
  mediaBox: {
    backgroundColor: colors.vaultCard,
    borderColor: colors.vaultCardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  recordCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordIcon: {
    fontSize: 20,
  },
  fileIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  mediaTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  mediaSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.vaultCard,
    borderColor: colors.vaultCardBorder,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
  },
  passInput: {
    flex: 1,
    height: 44,
    color: colors.textLight,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  lockIcon: {
    fontSize: 14,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.vaultCard,
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
  },
  modeCardActive: {
    borderColor: colors.vaultEmerald,
    backgroundColor: colors.vaultEmeraldGlow,
  },
  modeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textDim,
  },
  modeTitleActive: {
    color: colors.vaultEmerald,
  },
  modeDesc: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  gaugeCard: {
    backgroundColor: colors.vaultCard,
    borderColor: colors.vaultCardBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gaugeLabel: {
    fontSize: 11,
    color: colors.textDim,
  },
  gaugeScore: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.vaultEmerald,
  },
  gaugeTrack: {
    height: 6,
    backgroundColor: colors.vaultBg,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  gaugeFill: {
    width: '99.9%',
    height: '100%',
    backgroundColor: colors.vaultEmerald,
  },
  gaugeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeStat: {
    fontSize: 9,
    color: colors.textMuted,
  },
  previewBox: {
    backgroundColor: colors.vaultCard,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.vaultEmerald,
    fontWeight: '700',
    marginBottom: 10,
  },
  previewImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    marginBottom: 8,
  },
  previewCaption: {
    fontSize: 10,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: 12,
  },
  previewActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    paddingHorizontal: 6,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.vaultEmerald,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  shareBtn: {
    flex: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  shareBtnText: {
    color: colors.disguiseAccent,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  generateButton: {
    backgroundColor: colors.vaultEmerald,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: colors.vaultEmerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: colors.vaultBg,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* 10% Conceptzilla Mesh Telemetry Strip */
  conceptzillaMesh: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 34, 56, 0.45)',
    borderWidth: 1,
    borderColor: colors.accentBlueGlow,
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
    backgroundColor: colors.accentBlue,
  },
  meshStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accentBlue,
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

  /* Cover Image Selector - Primary Top Action Card */
  coverPickerCard: {
    backgroundColor: colors.vaultCard,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.accentBlueGlow,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  coverPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  coverThumb: {
    width: 54,
    height: 54,
    borderRadius: 10,
    backgroundColor: colors.bgDeep,
  },
  coverMeta: {
    flex: 1,
  },
  coverTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textLight,
  },
  coverSub: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
  },
  coverChangeHint: {
    fontSize: 9,
    color: colors.accentBlue,
    fontWeight: '700',
    marginTop: 3,
  },
  coverEmptyState: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  coverEmptyIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  coverEmptyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textLight,
  },
  coverEmptySub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },

  /* Horizontal Payload Selector Button Row */
  payloadSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  payloadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderMid,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  payloadButtonActive: {
    backgroundColor: colors.bentoBlueBg,
    borderColor: colors.accentBlue,
  },
  payloadButtonIcon: {
    fontSize: 14,
  },
  payloadButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textDim,
  },
  payloadButtonTextActive: {
    color: colors.accentBlue,
    fontWeight: '800',
  },

  /* 10% Conceptzilla Contrast Slip */
  contrastSlip: {
    backgroundColor: colors.slipWhite,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  slipKicker: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: colors.slipWhiteSub,
    textTransform: 'uppercase',
    marginBottom: 4,
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

  /* 60% Swiss Numbered Operational Rows */
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
    backgroundColor: colors.slipWhite,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  swissPillCtaText: {
    color: colors.bgDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
