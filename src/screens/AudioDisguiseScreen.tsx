import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { colors } from '../theme/colors';
import { VolumeLevels } from '../types';
import { PinModal } from '../components/PinModal';

interface Props {
  onUnlockVault: () => void;
  onUnlockDuress: () => void;
  onOpenEQ: () => void;
}

export const AudioDisguiseScreen: React.FC<Props> = ({
  onUnlockVault,
  onUnlockDuress,
  onOpenEQ,
}) => {
  const [volumes, setVolumes] = useState<VolumeLevels>({
    media: 75,
    ring: 80,
    alerts: 60,
    alarm: 90,
  });

  const [activePreset, setActivePreset] = useState<'normal' | 'meeting' | 'silent'>('normal');
  const [pinModalVisible, setPinModalVisible] = useState(false);

  const cycleVol = (key: keyof VolumeLevels) => {
    setVolumes((prev) => {
      const current = prev[key];
      const next = current >= 100 ? 0 : current + 25;
      return { ...prev, [key]: next };
    });
  };

  const applyProfile = (type: 'normal' | 'meeting' | 'silent') => {
    setActivePreset(type);
    if (type === 'normal') {
      setVolumes({ media: 75, ring: 80, alerts: 60, alarm: 90 });
    } else if (type === 'meeting') {
      setVolumes({ media: 0, ring: 0, alerts: 0, alarm: 80 });
    } else if (type === 'silent') {
      setVolumes({ media: 0, ring: 0, alerts: 0, alarm: 0 });
    }
  };

  const handleTestTone = () => {
    // Secret Gesture Combo: Media at 100%
    if (volumes.media === 100) {
      setPinModalVisible(true);
    } else {
      Alert.alert(
        'Audio Diagnostic Tone',
        `Playing standard 440Hz test sine tone at ${volumes.media}% media volume. Audio engine OK.`
      );
    }
  };

  const handleHeaderLongPress = () => {
    setPinModalVisible(true);
  };

  const handlePinSuccess = (code: string) => {
    setPinModalVisible(false);
    if (code === '1337') {
      onUnlockVault();
    } else if (code === '9999') {
      onUnlockDuress();
    }
  };

  // Calculate dynamic overall gain average for Swiss 44px readout
  const overallGainDb = (
    (volumes.media * 0.4 + volumes.ring * 0.3 + volumes.alerts * 0.15 + volumes.alarm * 0.15) * 0.95
  ).toFixed(1);

  return (
    <View style={styles.container}>
      {/* App Header (Secret Trigger via Long Press) */}
      <View style={styles.header}>
        <TouchableOpacity
          onLongPress={handleHeaderLongPress}
          delayLongPress={700}
          activeOpacity={0.8}
          style={styles.headerLeft}
        >
          <View style={styles.headerIconCircle}>
            <Image
              source={require('../../assets/app_logo.png')}
              style={styles.headerLogoImage}
              resizeMode="contain"
            />
          </View>
          <View>
            <View style={styles.titleBadgeRow}>
              <Text style={styles.headerTitle}>Music</Text>
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>PRO</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>Audio Master Engine</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.eqButton} onPress={onOpenEQ} activeOpacity={0.7}>
          <Text style={styles.eqButtonText}>🎛️ EQ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 10% Conceptzilla Telemetry Mesh Strip */}
        <View style={styles.conceptzillaMesh}>
          <View style={styles.meshLeft}>
            <View style={styles.meshPulseDot} />
            <Text style={styles.meshStatusText}>DSP Hardware Calibration</Text>
          </View>
          <Text style={styles.meshRateText}>48kHz DIRECT</Text>
        </View>

        {/* 60% Swiss High-Typography 44px Hero */}
        <View style={styles.swissHeroGroup}>
          <Text style={styles.swissKicker}>OVERALL GAIN BALANCE</Text>
          <Text style={styles.swissHero44}>+{overallGainDb} dB</Text>
          <View style={styles.swissSolidDivider} />
        </View>

        {/* 30% Pastel Bento 2x2 Tint Options Grid */}
        <View style={styles.bento2x2Grid}>
          {/* Tile 1: Media (Blue Tint) */}
          <TouchableOpacity
            style={[styles.bentoTile, styles.bentoBlue]}
            onPress={() => cycleVol('media')}
            activeOpacity={0.8}
          >
            <Text style={styles.bentoIcon}>🎵</Text>
            <View>
              <Text style={styles.bentoTitle}>Media</Text>
              <Text style={styles.bentoValue}>{volumes.media}% Gain Level</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 2: Ring (Yellow Tint) */}
          <TouchableOpacity
            style={[styles.bentoTile, styles.bentoYellow]}
            onPress={() => cycleVol('ring')}
            activeOpacity={0.8}
          >
            <Text style={styles.bentoIcon}>📞</Text>
            <View>
              <Text style={styles.bentoTitle}>Ringtone</Text>
              <Text style={styles.bentoValue}>{volumes.ring}% Calls Gain</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 3: Alerts (Green Tint) */}
          <TouchableOpacity
            style={[styles.bentoTile, styles.bentoGreen]}
            onPress={() => cycleVol('alerts')}
            activeOpacity={0.8}
          >
            <Text style={styles.bentoIcon}>🔔</Text>
            <View>
              <Text style={styles.bentoTitle}>Alerts</Text>
              <Text style={styles.bentoValue}>{volumes.alerts}% Notifs</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 4: Alarm (Purple Tint) */}
          <TouchableOpacity
            style={[styles.bentoTile, styles.bentoPurple]}
            onPress={() => cycleVol('alarm')}
            activeOpacity={0.8}
          >
            <Text style={styles.bentoIcon}>⏰</Text>
            <View>
              <Text style={styles.bentoTitle}>Alarm</Text>
              <Text style={styles.bentoValue}>{volumes.alarm}% Wakeup</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 60% Swiss Editorial Numbered Rows (Acoustic Presets) */}
        <View style={styles.presetsContainer}>
          <TouchableOpacity
            style={styles.swissNumberedRow}
            onPress={() => applyProfile('normal')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.swissNumIndex}>01</Text>
              <Text style={styles.swissRowLabel}>STUDIO REFERENCE</Text>
            </View>
            <Text style={[styles.swissRowValue, activePreset === 'normal' && styles.swissRowValueActive]}>
              {activePreset === 'normal' ? 'ACTIVE ✓' : 'SELECT'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.swissNumberedRow}
            onPress={() => applyProfile('meeting')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.swissNumIndex}>02</Text>
              <Text style={styles.swissRowLabel}>CONFERENCE MUTE</Text>
            </View>
            <Text style={[styles.swissRowValue, activePreset === 'meeting' && styles.swissRowValueActive]}>
              {activePreset === 'meeting' ? 'ACTIVE ✓' : 'SELECT'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.swissNumberedRow}
            onPress={() => applyProfile('silent')}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Text style={styles.swissNumIndex}>03</Text>
              <Text style={styles.swissRowLabel}>SILENT AIRGAP</Text>
            </View>
            <Text style={[styles.swissRowValue, activePreset === 'silent' && styles.swissRowValueActive]}>
              {activePreset === 'silent' ? 'ACTIVE ✓' : 'SELECT'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Swiss High-Contrast Solid Pill CTA */}
        <TouchableOpacity style={styles.swissPillCta} onPress={handleTestTone} activeOpacity={0.85}>
          <Text style={styles.swissPillCtaText}>🔊 EXECUTE 440HZ DIAGNOSTIC SINE</Text>
        </TouchableOpacity>

        <View style={styles.footerNote}>
          <Text style={styles.footerText}>Hardware Audio Engine • 48kHz Direct DSP Matrix</Text>
        </View>
      </ScrollView>

      {/* Secret PIN Modal */}
      <PinModal
        visible={pinModalVisible}
        onSuccess={handlePinSuccess}
        onCancel={() => setPinModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDeep,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: colors.bgDeep,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderMid,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 18,
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: -0.3,
  },
  proBadge: {
    backgroundColor: colors.slipWhite,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proBadgeText: {
    color: colors.bgDeep,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 1,
  },
  eqButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderMid,
  },
  eqButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textLight,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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

  headerLogoImage: {
    width: 28,
    height: 28,
  },

  /* 30% Pastel Bento 2x2 Tint Grid */
  bento2x2Grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 18,
  },
  bentoTile: {
    width: '48%',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    minHeight: 88,
    justifyContent: 'space-between',
  },
  bentoBlue: {
    backgroundColor: colors.bentoBlueBg,
    borderColor: colors.bentoBlueBorder,
  },
  bentoYellow: {
    backgroundColor: colors.bentoYellowBg,
    borderColor: colors.bentoYellowBorder,
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

  /* 60% Swiss Numbered Rows */
  presetsContainer: {
    marginBottom: 20,
  },
  swissNumberedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  swissNumIndex: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textSubtle,
  },
  swissRowLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.5,
  },
  swissRowValue: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  swissRowValueActive: {
    color: colors.accentEmerald,
  },

  /* Swiss Solid Pill Button */
  swissPillCta: {
    backgroundColor: colors.slipWhite,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  swissPillCtaText: {
    color: colors.bgDeep,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  footerNote: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 9,
    color: colors.textSubtle,
    letterSpacing: 0.8,
  },
});
