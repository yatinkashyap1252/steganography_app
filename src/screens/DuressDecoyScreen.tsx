import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  onExit: () => void;
}

export const DuressDecoyScreen: React.FC<Props> = ({ onExit }) => {
  const recordings = [
    { id: '1', title: 'Acoustic Guitar Riff.m4a', duration: '1:14 min', date: 'Yesterday', size: '1.2 MB' },
    { id: '2', title: 'Biology Lecture 04.m4a', duration: '34:10 min', date: 'Oct 01', size: '28 MB' },
    { id: '3', title: 'Grocery List Reminder.m4a', duration: '0:45 min', date: 'Sep 28', size: '850 KB' },
    { id: '4', title: 'Car Repair Estimate Note.m4a', duration: '2:30 min', date: 'Sep 21', size: '2.1 MB' },
  ];

  const handlePlay = (title: string) => {
    Alert.alert('Audio Playback', `Playing recording: ${title}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Voice Memos & Audio</Text>
          <Text style={styles.headerSubtitle}>Personal Sound Recorder (4 files)</Text>
        </View>
        <TouchableOpacity style={styles.exitBtn} onPress={onExit} activeOpacity={0.7}>
          <Text style={styles.exitBtnText}>Lock</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.recordBanner}>
          <View style={styles.recordCircle}>
            <Text style={styles.recordIcon}>🎙️</Text>
          </View>
          <View style={styles.recordInfo}>
            <Text style={styles.recordTitle}>New Voice Memo</Text>
            <Text style={styles.recordSub}>Tap to start high-fidelity AAC recording</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>RECENT RECORDINGS</Text>

        {recordings.map((rec) => (
          <View key={rec.id} style={styles.recordingCard}>
            <View style={styles.recLeft}>
              <Text style={styles.recIcon}>🎵</Text>
              <View>
                <Text style={styles.recTitle}>{rec.title}</Text>
                <Text style={styles.recMeta}>{rec.date} • {rec.duration} • {rec.size}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.playBtn} onPress={() => handlePlay(rec.title)} activeOpacity={0.7}>
              <Text style={styles.playIcon}>▶</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerNote}>Decoy Vault Active • Zero Suspicion Raised</Text>
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  exitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.vaultCard,
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
  },
  exitBtnText: {
    fontSize: 12,
    color: colors.textDim,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  recordBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.vaultCard,
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
    marginBottom: 24,
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
  },
  recordIcon: {
    fontSize: 20,
  },
  recordInfo: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textLight,
  },
  recordSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  recordingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.vaultCard,
    borderWidth: 1,
    borderColor: colors.vaultCardBorder,
    marginBottom: 10,
  },
  recLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recIcon: {
    fontSize: 18,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
  },
  recMeta: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  playBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 12,
    color: colors.textLight,
    marginLeft: 2,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerNote: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
});
