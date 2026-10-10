import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  icon: string;
  title: string;
  subtitle: string;
  value: number; // 0 to 100
  onChange: (val: number) => void;
}

export const VolumeSlider: React.FC<Props> = ({
  icon,
  title,
  subtitle,
  value,
  onChange,
}) => {
  const steps = [0, 25, 50, 75, 100];

  const handleStepPress = (stepVal: number) => {
    onChange(stepVal);
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.valueText}>{value}%</Text>
      </View>

      {/* Interactive Progress Bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${value}%` }]} />
      </View>

      {/* Quick Level Stepper Buttons */}
      <View style={styles.stepperRow}>
        {steps.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.stepButton, value === s && styles.stepButtonActive]}
            onPress={() => handleStepPress(s)}
            activeOpacity={0.7}
          >
            <Text style={[styles.stepText, value === s && styles.stepTextActive]}>
              {s === 0 ? 'Mute' : s === 100 ? 'Max' : `${s}%`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.disguiseCard,
    borderColor: colors.disguiseCardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textLight,
  },
  valueText: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: colors.disguiseAccent,
  },
  barTrack: {
    height: 10,
    backgroundColor: colors.vaultBg,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.disguiseAccent,
    borderRadius: 5,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  stepButtonActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: colors.disguiseAccent,
    borderWidth: 1,
  },
  stepText: {
    fontSize: 10,
    color: colors.textDim,
  },
  stepTextActive: {
    color: colors.disguiseAccent,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
