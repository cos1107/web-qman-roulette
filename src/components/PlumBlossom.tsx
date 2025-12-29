import React from 'react';
import { View, StyleSheet } from 'react-native';

interface PlumBlossomBranchProps {
  width?: number;
  height?: number;
  flip?: boolean;
}

// Single flower component
const Flower: React.FC<{ size: number; x: number; y: number }> = ({ size, x, y }) => {
  const petalSize = size * 0.4;
  const petalOffset = size * 0.3;

  return (
    <View style={[styles.flower, { width: size, height: size, left: x, top: y }]}>
      {/* 5 petals arranged in a circle */}
      {[0, 72, 144, 216, 288].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const px = Math.cos(rad) * petalOffset;
        const py = Math.sin(rad) * petalOffset;
        return (
          <View
            key={i}
            style={[
              styles.petal,
              {
                width: petalSize,
                height: petalSize * 1.2,
                borderRadius: petalSize / 2,
                transform: [
                  { translateX: px },
                  { translateY: py },
                  { rotate: `${angle}deg` },
                ],
              },
            ]}
          />
        );
      })}
      {/* Center */}
      <View style={[styles.center, { width: size * 0.25, height: size * 0.25, borderRadius: size * 0.125 }]}>
        {/* Stamens dots */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const sx = Math.cos(rad) * (size * 0.08);
          const sy = Math.sin(rad) * (size * 0.08);
          return (
            <View
              key={`s-${i}`}
              style={[
                styles.stamen,
                {
                  width: 3,
                  height: 3,
                  borderRadius: 1.5,
                  transform: [{ translateX: sx }, { translateY: sy }],
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

// Bud component
const Bud: React.FC<{ size: number; x: number; y: number }> = ({ size, x, y }) => (
  <View style={[styles.bud, { width: size, height: size * 1.3, borderRadius: size / 2, left: x, top: y }]} />
);

export const PlumBlossomBranch: React.FC<PlumBlossomBranchProps> = ({
  width = 150,
  height = 220,
  flip = false,
}) => {
  const scale = width / 150;

  return (
    <View style={[styles.container, { width, height }, flip && styles.flipped]}>
      {/* Branch - simplified as diagonal line */}
      <View style={[styles.branchMain, {
        width: 8 * scale,
        height: height * 0.9,
        transform: [{ rotate: '-30deg' }, { translateX: width * 0.3 }],
      }]} />

      {/* Small branches */}
      <View style={[styles.branchSmall, {
        width: 4 * scale,
        height: 40 * scale,
        left: width * 0.6,
        top: height * 0.3,
        transform: [{ rotate: '30deg' }],
      }]} />
      <View style={[styles.branchSmall, {
        width: 3 * scale,
        height: 30 * scale,
        left: width * 0.4,
        top: height * 0.5,
        transform: [{ rotate: '-20deg' }],
      }]} />

      {/* Flowers */}
      <Flower size={30 * scale} x={width * 0.1} y={height * 0.1} />
      <Flower size={25 * scale} x={width * 0.3} y={height * 0.25} />
      <Flower size={28 * scale} x={width * 0.6} y={height * 0.35} />
      <Flower size={22 * scale} x={width * 0.7} y={height * 0.55} />
      <Flower size={26 * scale} x={width * 0.5} y={height * 0.7} />

      {/* Buds */}
      <Bud size={10 * scale} x={width * 0.25} y={height * 0.18} />
      <Bud size={12 * scale} x={width * 0.55} y={height * 0.45} />
      <Bud size={8 * scale} x={width * 0.75} y={height * 0.65} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  flipped: {
    transform: [{ scaleX: -1 }],
  },
  branchMain: {
    position: 'absolute',
    backgroundColor: '#4A3728',
    borderRadius: 4,
  },
  branchSmall: {
    position: 'absolute',
    backgroundColor: '#4A3728',
    borderRadius: 2,
  },
  flower: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  petal: {
    position: 'absolute',
    backgroundColor: '#FFB6C1',
  },
  center: {
    position: 'absolute',
    backgroundColor: '#FFEB99',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stamen: {
    position: 'absolute',
    backgroundColor: '#C9302C',
  },
  bud: {
    position: 'absolute',
    backgroundColor: '#FFB6C1',
  },
});

export default PlumBlossomBranch;
