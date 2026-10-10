import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  secretText: string;
  isUnlocked: boolean;
  useLoupeMode: boolean;
  isBurned?: boolean;
}

const LOUPE_WIDTH = 150;
const LOUPE_HEIGHT = 70;

export const MagnifyingLoupe: React.FC<Props> = ({
  secretText,
  isUnlocked,
  useLoupeMode,
  isBurned,
}) => {
  const [containerWidth, setContainerWidth] = useState(260);
  const [isHolding, setIsHolding] = useState(false);
  const [touchPos, setTouchPos] = useState({ x: 130, y: 35 });
  const [revealedSlice, setRevealedSlice] = useState('');

  const words = useRef<string[]>([]);
  words.current = secretText.split(/\s+/).filter(Boolean);

  const updateLoupeContent = (relX: number) => {
    if (words.current.length === 0) {
      setRevealedSlice('');
      return;
    }
    const safeWidth = Math.max(1, containerWidth);
    const progress = Math.max(0, Math.min(1, relX / safeWidth));
    const targetIdx = Math.floor(progress * words.current.length);

    const start = Math.max(0, targetIdx - 1);
    const end = Math.min(words.current.length, targetIdx + 2);
    const slice = words.current.slice(start, end).join(' ');
    setRevealedSlice(slice || words.current[0]);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => useLoupeMode && isUnlocked && !isBurned,
      onMoveShouldSetPanResponder: () => useLoupeMode && isUnlocked && !isBurned,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setIsHolding(true);
        setTouchPos({ x: locationX, y: locationY });
        updateLoupeContent(locationX);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setTouchPos({ x: locationX, y: locationY });
        updateLoupeContent(locationX);
      },
      onPanResponderRelease: () => {
        setIsHolding(false);
      },
      onPanResponderTerminate: () => {
        setIsHolding(false);
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  if (isBurned) {
    return (
      <View style={styles.burnedContainer}>
        <Text style={styles.burnedText}>🔥 MESSAGE BURNED & SCRUBBED FROM RAM</Text>
      </View>
    );
  }

  if (!isUnlocked) {
    return null;
  }

  // If loupe mode is disabled in settings, show standard decrypted message
  if (!useLoupeMode) {
    return (
      <View style={styles.standardContainer}>
        <Text style={styles.standardText}>"{secretText}"</Text>
      </View>
    );
  }

  // Calculate clamped loupe position above user's finger
  const loupeLeft = Math.max(
    6,
    Math.min(containerWidth - LOUPE_WIDTH - 6, touchPos.x - LOUPE_WIDTH / 2)
  );
  const loupeTop = touchPos.y - LOUPE_HEIGHT - 30;

  return (
    <View
      style={styles.loupeWrapper}
      onLayout={onLayout}
      {...panResponder.panHandlers}
    >
      {/* Masked text display by default (anti-shoulder surfing) */}
      <View style={styles.maskedContainer}>
        <View style={styles.maskedRow}>
          <Text style={styles.maskedRunes}>
            {secretText
              .split('')
              .map((c) => (c === ' ' ? '   ' : '•'))
              .join('')}
          </Text>
        </View>
        <Text style={styles.loupeHint}>
          {isHolding ? '🔍 LOUPE ACTIVE (DRAG THUMB)' : '👆 PRESS & DRAG THUMB TO REVEAL (LOUPE)'}
        </Text>
      </View>

      {/* Floating Magnifying Loupe Lens when user holds/drags */}
      {isHolding && (
        <View
          pointerEvents="none"
          style={[
            styles.floatingLens,
            {
              left: loupeLeft,
              top: loupeTop,
            },
          ]}
        >
          {/* Neon HUD Crosshair Header */}
          <View style={styles.lensHudHeader}>
            <View style={styles.reticleDot} />
            <Text style={styles.lensHudTitle}>PEEP LOUPE 2.4x</Text>
            <View style={styles.reticleDot} />
          </View>

          {/* Magnified Text Window */}
          <View style={styles.magnifiedWindow}>
            <Text style={styles.magnifiedText} numberOfLines={2}>
              "{revealedSlice}"
            </Text>
          </View>

          {/* Crosshairs */}
          <View style={styles.crosshairLeft} />
          <View style={styles.crosshairRight} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  burnedContainer: {
    backgroundColor: '#1f1315',
    borderWidth: 1,
    borderColor: '#7f1d1d',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
  },
  burnedText: {
    color: '#f87171',
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  standardContainer: {
    backgroundColor: 'rgba(5, 23, 18, 0.9)',
    borderLeftWidth: 3,
    borderLeftColor: colors.vaultEmerald,
    padding: 10,
    borderRadius: 6,
    marginVertical: 6,
  },
  standardText: {
    color: colors.vaultEmerald,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  loupeWrapper: {
    position: 'relative',
    marginVertical: 6,
    backgroundColor: 'rgba(5, 12, 22, 0.95)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    padding: 10,
    overflow: 'visible',
  },
  maskedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  maskedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  maskedRunes: {
    color: '#38bdf8',
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.6,
  },
  loupeHint: {
    color: colors.textMuted,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  floatingLens: {
    position: 'absolute',
    width: LOUPE_WIDTH,
    height: LOUPE_HEIGHT,
    backgroundColor: '#040d1a',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 16,
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'space-between',
    zIndex: 9999,
  },
  lensHudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  reticleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#00e5ff',
  },
  lensHudTitle: {
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#00e5ff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  magnifiedWindow: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  magnifiedText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  crosshairLeft: {
    position: 'absolute',
    left: -2,
    top: LOUPE_HEIGHT / 2 - 4,
    width: 4,
    height: 8,
    backgroundColor: '#00e5ff',
    borderRadius: 1,
  },
  crosshairRight: {
    position: 'absolute',
    right: -2,
    top: LOUPE_HEIGHT / 2 - 4,
    width: 4,
    height: 8,
    backgroundColor: '#00e5ff',
    borderRadius: 1,
  },
});
