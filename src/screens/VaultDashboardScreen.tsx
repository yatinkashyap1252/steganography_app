import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { CloakedVaultItem } from '../types';
import { FeatureComingSoonModal } from '../components/FeatureComingSoonModal';

interface Props {
  onNavigateEncode: () => void;
  onNavigateDecode: () => void;
  onNavigateChat: () => void;
  onLock: () => void;
}

export const VaultDashboardScreen: React.FC<Props> = ({
  onNavigateEncode,
  onNavigateDecode,
  onNavigateChat,
  onLock,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDesc, setModalDesc] = useState('');

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.badgeRow}>
            <View style={styles.statusDot} />
            <Text style={styles.badgeText}>STEALTH STUDIO</Text>
          </View>
          <Text style={styles.headerTitle}>Encrypted Enclave</Text>
        </View>

        <TouchableOpacity style={styles.lockButton} onPress={onLock} activeOpacity={0.7}>
          <Text style={styles.lockButtonText}>🔒 LOCK</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 10% Conceptzilla Mesh Telemetry Strip */}
        <View style={styles.conceptzillaMesh}>
          <View style={styles.meshLeft}>
            <View style={styles.meshPulseDot} />
            <Text style={styles.meshStatusText}>Zero-Net Airgap Enclave</Text>
          </View>
          <Text style={styles.meshRateText}>AES-256-GCM</Text>
        </View>

        {/* 60% Swiss High-Typography 44px Hero */}
        <View style={styles.swissHeroGroup}>
          <Text style={styles.swissKicker}>AIRGAP ENCLAVE STATUS</Text>
          <Text style={styles.swissHero44}>
            ARMED. <Text style={styles.swissHeroSub}>READY</Text>
          </Text>
          <View style={styles.swissSolidDivider} />
        </View>

        {/* 30% Pastel Bento 2x2 Tint Actions Grid */}
        <View style={styles.bento2x2Grid}>
          {/* Tile 1: Encode (Blue Tint) */}
          <TouchableOpacity
            style={[styles.bentoTile, styles.bentoBlue]}
            onPress={onNavigateEncode}
            activeOpacity={0.8}
          >
            <Text style={styles.bentoIcon}>🖼️</Text>
            <View>
              <Text style={styles.bentoTitle}>Encode</Text>
              <Text style={styles.bentoValue} numberOfLines={1}>Cloak photo</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 2: Extract (Green Tint) */}
          <TouchableOpacity
            style={[styles.bentoTile, styles.bentoGreen]}
            onPress={onNavigateDecode}
            activeOpacity={0.8}
          >
            <Text style={styles.bentoIcon}>🔓</Text>
            <View>
              <Text style={styles.bentoTitle}>Extract</Text>
              <Text style={styles.bentoValue} numberOfLines={1}>Decrypt secret</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 3: Dead Drop (Purple Tint) */}
          <TouchableOpacity
            style={[styles.bentoTile, styles.bentoPurple]}
            onPress={onNavigateChat}
            activeOpacity={0.8}
          >
            <Text style={styles.bentoIcon}>💬</Text>
            <View>
              <View style={styles.chatTitleRow}>
                <Text style={styles.bentoTitle}>Dead Drop</Text>
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              </View>
              <Text style={styles.bentoValue} numberOfLines={1}>Ghost chat</Text>
            </View>
          </TouchableOpacity>

          {/* Tile 4: Lock/Wipe (Yellow/Rose Tint) */}
          <TouchableOpacity
            style={[styles.bentoTile, styles.bentoYellow]}
            onPress={onLock}
            activeOpacity={0.8}
          >
            <Text style={styles.bentoIcon}>🔒</Text>
            <View>
              <Text style={[styles.bentoTitle, { color: colors.accentRose }]}>Lock All</Text>
              <Text style={styles.bentoValue} numberOfLines={1}>Purge RAM</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 60% Swiss Information Specs */}
        <View style={styles.swissNumberedRow}>
          <Text style={styles.swissRowLeft}>
            <Text style={styles.swissNumIndex}>01 </Text>
            <Text style={styles.swissRowLabel}>STORAGE ARCHITECTURE</Text>
          </Text>
          <Text style={styles.swissRowValue}>VOLATILE MEMORY ONLY</Text>
        </View>

        <View style={styles.swissNumberedRow}>
          <Text style={styles.swissRowLeft}>
            <Text style={styles.swissNumIndex}>02 </Text>
            <Text style={styles.swissRowLabel}>CARRIER BIT INTEGRITY</Text>
          </Text>
          <Text style={styles.swissRowValue}>LOSSLESS PNG EMBED</Text>
        </View>

        <View style={styles.swissNumberedRow}>
          <Text style={styles.swissRowLeft}>
            <Text style={styles.swissNumIndex}>03 </Text>
            <Text style={styles.swissRowLabel}>AIRGAP AUDIT STATUS</Text>
          </Text>
          <Text style={styles.swissRowValue}>ZERO NETWORK LOGS</Text>
        </View>

        {/* Swiss Solid Pill Action */}
        <TouchableOpacity style={styles.swissPillCta} onPress={onLock} activeOpacity={0.85}>
          <Text style={styles.swissPillCtaText}>TERMINATE SESSION & ZERO MEMORY</Text>
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
    backgroundColor: colors.bgDeep,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.bgDeep,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentEmerald,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.accentEmerald,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.textLight,
    letterSpacing: -0.4,
  },
  lockButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderMid,
  },
  lockButtonText: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textLight,
    letterSpacing: 1,
  },
  content: {
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
  swissHeroSub: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0,
  },
  swissSolidDivider: {
    height: 2,
    backgroundColor: colors.borderStrong,
    marginTop: 6,
    marginBottom: 12,
  },

  /* 30% Pastel Bento 2x2 Tint Grid */
  bento2x2Grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 20,
  },
  bentoTile: {
    width: '48%',
    borderRadius: 16,
    padding: 12,
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
  bentoYellow: {
    backgroundColor: colors.bentoYellowBg,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  bentoIcon: {
    fontSize: 18,
  },
  chatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newBadge: {
    backgroundColor: colors.accentAmber,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  newBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#000',
  },
  bentoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textLight,
    marginTop: 4,
  },
  bentoValue: {
    fontSize: 9,
    color: colors.textDim,
    fontWeight: '600',
    marginTop: 2,
  },

  /* 60% Swiss Editorial Numbered Rows */
  swissNumberedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  swissRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swissNumIndex: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.textSubtle,
  },
  swissRowLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textLight,
    letterSpacing: 0.5,
  },
  swissRowValue: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: colors.accentEmerald,
    letterSpacing: 0.5,
  },

  /* Swiss Solid Pill Action */
  swissPillCta: {
    backgroundColor: colors.accentRose,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  swissPillCtaText: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
