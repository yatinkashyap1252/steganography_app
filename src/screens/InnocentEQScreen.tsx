import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  onBack: () => void;
}

export const InnocentEQScreen: React.FC<Props> = ({ onBack }) => {
  const [selectedPreset, setSelectedPreset] = useState('Bass Boost');

  const bands = [
    { freq: '60Hz', gain: 6, height: 110 },
    { freq: '230Hz', gain: 8, height: 130 },
    { freq: '910Hz', gain: 2, height: 80 },
    { freq: '3.6kHz', gain: 5, height: 105 },
    { freq: '14kHz', gain: 1, height: 70 },
  ];

  const presets = ['Bass Boost', 'Vocal Clarifier', 'Rock Stage', 'Acoustic Pure', 'Flat DSP'];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>5-Band Graphic Equalizer</Text>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>DSP ON</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Equalizer Visualizer Card */}
        <View style={styles.eqCard}>
          <View style={styles.bandsContainer}>
            {bands.map((b) => (
              <View key={b.freq} style={styles.bandColumn}>
                <Text style={styles.gainText}>+{b.gain}dB</Text>
                <View style={styles.bandTrack}>
                  <View style={[styles.bandFill, { height: b.height }]} />
                </View>
                <Text style={styles.freqText}>{b.freq}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Presets */}
        <Text style={styles.sectionTitle}>AUDIO PRESETS</Text>
        <View style={styles.presetsGrid}>
          {presets.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.presetCard, selectedPreset === p && styles.presetCardActive]}
              onPress={() => setSelectedPreset(p)}
              activeOpacity={0.7}
            >
              <Text style={[styles.presetText, selectedPreset === p && styles.presetTextActive]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.specBox}>
          <Text style={styles.specTitle}>DSP ENGINE SPECIFICATION</Text>
          <Text style={styles.specDesc}>
            Low-latency biquad filtering active across system audio daemon. THD+N &lt; 0.003%.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.disguiseBg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.disguiseCardBorder,
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.disguiseCard,
  },
  backButtonText: {
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textLight,
  },
  activePill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activePillText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.vaultEmerald,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  eqCard: {
    backgroundColor: colors.disguiseCard,
    borderColor: colors.disguiseCardBorder,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  bandsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
  },
  bandColumn: {
    alignItems: 'center',
    flex: 1,
  },
  gainText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.disguiseAccent,
    marginBottom: 8,
  },
  bandTrack: {
    width: 14,
    height: 140,
    backgroundColor: colors.vaultBg,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: 8,
  },
  bandFill: {
    width: '100%',
    backgroundColor: colors.disguiseAccent,
    borderRadius: 7,
  },
  freqText: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  presetCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.disguiseCard,
    borderWidth: 1,
    borderColor: colors.disguiseCardBorder,
  },
  presetCardActive: {
    borderColor: colors.disguiseAccent,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  presetText: {
    fontSize: 12,
    color: colors.textDim,
    fontWeight: '600',
  },
  presetTextActive: {
    color: colors.disguiseAccent,
    fontWeight: '700',
  },
  specBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: colors.disguiseCardBorder,
  },
  specTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    marginBottom: 4,
  },
  specDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
});
