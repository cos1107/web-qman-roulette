import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface LanternProps {
  size?: number;
}

export const Lantern: React.FC<LanternProps> = ({ size = 60 }) => {
  const scale = size / 60;

  return (
    <View style={[styles.container, { width: size, height: size * 1.5 }]}>
      {/* Hanging rope */}
      <View style={[styles.rope, { height: 12 * scale, width: 2 * scale }]} />

      {/* Top cap */}
      <View style={[styles.topCap, {
        width: 20 * scale,
        height: 6 * scale,
        borderRadius: 2 * scale,
      }]} />

      {/* Main body */}
      <View style={[styles.body, {
        width: 44 * scale,
        height: 56 * scale,
        borderRadius: 22 * scale,
      }]}>
        {/* Inner glow */}
        <View style={[styles.innerGlow, {
          width: 36 * scale,
          height: 48 * scale,
          borderRadius: 18 * scale,
        }]} />

        {/* Center decoration */}
        <View style={[styles.centerOuter, {
          width: 16 * scale,
          height: 16 * scale,
          borderRadius: 8 * scale,
        }]}>
          <View style={[styles.centerInner, {
            width: 10 * scale,
            height: 10 * scale,
            borderRadius: 5 * scale,
          }]} />
        </View>

        {/* Gold bands */}
        <View style={[styles.bandTop, {
          width: 36 * scale,
          height: 2 * scale,
          top: 8 * scale,
        }]} />
        <View style={[styles.bandBottom, {
          width: 36 * scale,
          height: 2 * scale,
          bottom: 8 * scale,
        }]} />
      </View>

      {/* Bottom cap */}
      <View style={[styles.bottomCap, {
        width: 16 * scale,
        height: 5 * scale,
        borderRadius: 2 * scale,
      }]} />

      {/* Tassel */}
      <View style={[styles.tasselRope, {
        height: 14 * scale,
        width: 2 * scale,
      }]} />
      <View style={[styles.tasselBall, {
        width: 6 * scale,
        height: 6 * scale,
        borderRadius: 3 * scale,
      }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  rope: {
    backgroundColor: '#8B4513',
  },
  topCap: {
    backgroundColor: '#D4AF37',
  },
  body: {
    backgroundColor: '#E31C25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerGlow: {
    position: 'absolute',
    backgroundColor: '#FF4444',
    opacity: 0.3,
  },
  centerOuter: {
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerInner: {
    backgroundColor: '#E31C25',
  },
  bandTop: {
    position: 'absolute',
    backgroundColor: '#D4AF37',
  },
  bandBottom: {
    position: 'absolute',
    backgroundColor: '#D4AF37',
  },
  bottomCap: {
    backgroundColor: '#D4AF37',
  },
  tasselRope: {
    backgroundColor: '#D4AF37',
  },
  tasselBall: {
    backgroundColor: '#D4AF37',
  },
});

export default Lantern;
