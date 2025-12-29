import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { Option } from '../types';

interface WheelProps {
  options: Option[];
  palette: string[];
  isSpinning: boolean;
  targetSector: number;
  onSpinEnd?: () => void;
}

const SIZE = 280;
const CENTER = SIZE / 2;
const TOTAL_SECTORS = 12;

export const Wheel: React.FC<WheelProps> = ({ options, palette, isSpinning, targetSector, onSpinEnd }) => {
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const currentRotation = useRef(0);

  // Shimmer animation for gold effect
  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, []);

  useEffect(() => {
    if (isSpinning) {
      // Calculate rotation to land on target sector
      // Each sector is 30 degrees (360/12)
      // Add multiple full rotations for visual effect, then land on target
      const sectorAngle = 360 / TOTAL_SECTORS;
      const extraRotations = (7 + Math.floor(Math.random() * 5)) * 360;
      // Rotate so that targetSector ends up at the pointer (top)
      // Pointer is at top, sectors start at 0 degrees and go clockwise
      const landingAngle = targetSector * sectorAngle;
      const targetRotation = currentRotation.current + extraRotations + landingAngle;

      Animated.timing(rotationAnim, {
        toValue: targetRotation,
        duration: 5000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        currentRotation.current = targetRotation;
        onSpinEnd?.();
      });
    }
  }, [isSpinning, targetSector]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const spin = rotationAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  // Build color map: assign each unique option a consistent color
  const optionColorMap = new Map<string, string>();
  options.forEach((opt, i) => {
    const key = opt.type === 'image' ? opt.content : `text:${opt.content}`;
    if (!optionColorMap.has(key)) {
      optionColorMap.set(key, palette[optionColorMap.size % palette.length]);
    }
  });

  const sectors = Array.from({ length: TOTAL_SECTORS }, (_, i) => {
    const opt = options[i % Math.max(options.length, 1)] || { id: 'empty', type: 'text', content: '' };
    const rotation = (i * 360) / TOTAL_SECTORS;
    const key = opt.type === 'image' ? opt.content : `text:${opt.content}`;
    const fillColor = optionColorMap.get(key) || palette[i % palette.length];
    // Light colors that need dark text
    const lightColors = ['#fef3c7', '#fef9e7', '#d4af37', '#b6a691', '#ffb347', '#ffcc66', '#e8b923', '#e8d48a', '#ff69b4'];
    const isLight = lightColors.includes(fillColor.toLowerCase());

    return {
      rotation,
      fillColor,
      textColor: isLight ? '#423a32' : '#FFFFFF',
      content: opt.type === 'text' ? (opt.content.length > 3 ? opt.content.slice(0, 2) + '..' : opt.content) : '📷',
    };
  });

  return (
    <View style={styles.container}>
      {/* Pointer with border */}
      <View style={styles.pointerContainer}>
        <View style={[styles.pointerBorder, { borderBottomColor: '#FFFFFF' }]} />
        <View style={[styles.pointer, { borderBottomColor: palette[2] || '#d4af37' }]} />
      </View>

      <Animated.View style={[styles.wheelOuter, { backgroundColor: palette[2], transform: [{ rotate: spin }] }]}>
        <View style={[styles.wheelMiddle, { backgroundColor: palette[0] }]}>
          <View style={[styles.wheelInner, { backgroundColor: palette[2] }]}>
            {/* Sectors */}
            {sectors.map((sector, i) => (
              <View
                key={i}
                style={[
                  styles.sector,
                  {
                    backgroundColor: sector.fillColor,
                    transform: [
                      { rotate: `${sector.rotation}deg` },
                      { translateY: -SIZE * 0.28 },
                    ],
                  },
                ]}
              >
                <Text style={[styles.sectorText, { color: sector.textColor }]}>
                  {sector.content}
                </Text>
              </View>
            ))}

            {/* Center Hub with shimmer */}
            <View style={[styles.centerHub, { backgroundColor: palette[2] }]}>
              <View style={[styles.centerInner, { backgroundColor: palette[0] }]}>
                <Text style={[styles.centerText, { color: palette[2] }]}>福</Text>
              </View>
              <Animated.View
                style={[
                  styles.shimmerOverlay,
                  { opacity: shimmerOpacity }
                ]}
              />
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerContainer: {
    position: 'absolute',
    top: -18,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointerBorder: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderRightWidth: 18,
    borderBottomWidth: 36,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  pointer: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 14,
    borderRightWidth: 14,
    borderBottomWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    top: 4,
  },
  wheelOuter: {
    width: SIZE + 20,
    height: SIZE + 20,
    borderRadius: (SIZE + 20) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelMiddle: {
    width: SIZE + 10,
    height: SIZE + 10,
    borderRadius: (SIZE + 10) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelInner: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sector: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectorText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  centerHub: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  centerText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  shimmerOverlay: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});

export default Wheel;
