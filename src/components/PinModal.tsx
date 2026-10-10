import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  visible: boolean;
  onSuccess: (pin: string) => void;
  onCancel: () => void;
  vaultPin?: string;
  duressPin?: string;
}

export const PinModal: React.FC<Props> = ({
  visible,
  onSuccess,
  onCancel,
  vaultPin = '1337',
  duressPin = '9999',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const errorTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (errorTimerRef.current) {
        clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = () => {
    if (pin === vaultPin || pin === duressPin) {
      const code = pin;
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      setPin('');
      setError(false);
      onSuccess(code);
    } else {
      setError(true);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => setError(false), 2000);
    }
  };

  const handleClose = () => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    setPin('');
    setError(false);
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🎚️</Text>
          </View>
          
          <Text style={styles.title}>Audio Calibration Lock</Text>
          <Text style={styles.subtitle}>Enter DSP calibration frequency code</Text>

          <TextInput
            style={[styles.input, error && styles.inputError]}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            placeholder="••••"
            placeholderTextColor={colors.textMuted}
            value={pin}
            onChangeText={setPin}
            autoFocus
          />

          {error && (
            <Text style={styles.errorText}>Calibration code mismatch. Profile reset.</Text>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={handleSubmit} activeOpacity={0.7}>
              <Text style={styles.confirmText}>Calibrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: colors.disguiseCard,
    borderColor: colors.disguiseCardBorder,
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 22,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textLight,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textDim,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    width: 140,
    height: 48,
    backgroundColor: colors.vaultBg,
    borderColor: colors.disguiseCardBorder,
    borderWidth: 1,
    borderRadius: 12,
    fontSize: 22,
    fontFamily: 'monospace',
    color: colors.textLight,
    textAlign: 'center',
    letterSpacing: 6,
    marginBottom: 12,
  },
  inputError: {
    borderColor: colors.vaultRose,
  },
  errorText: {
    fontSize: 11,
    color: colors.vaultRose,
    marginBottom: 12,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.disguiseCardBorder,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textDim,
    fontSize: 13,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.disguiseAccent,
    alignItems: 'center',
  },
  confirmText: {
    color: colors.vaultBg,
    fontSize: 13,
    fontWeight: '700',
  },
  hintContainer: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.disguiseCardBorder,
    width: '100%',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: colors.textMuted,
  },
});
