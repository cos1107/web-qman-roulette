import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FirecrackerProps {
  x: number;
  delay: number;
}

const Firecracker: React.FC<FirecrackerProps> = ({ x, delay }) => {
  const swingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(swingAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(swingAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotate = swingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-3deg', '3deg'],
  });

  return (
    <Animated.View style={[styles.firecracker, { left: x, transform: [{ rotate }] }]}>
      {/* Fu Diamond */}
      <View style={styles.fuDiamond}>
        <Text style={styles.fuText}>福</Text>
      </View>

      {/* Rope */}
      <View style={styles.rope} />

      {/* Firecrackers */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <View
          key={i}
          style={[
            styles.crackerItem,
            {
              top: 70 + i * 25,
              left: i % 2 === 0 ? 10 : 30,
              transform: [{ rotate: i % 2 === 0 ? '-15deg' : '15deg' }],
            },
          ]}
        >
          <View style={styles.crackerBody}>
            <View style={styles.crackerBand} />
          </View>
          <View style={styles.crackerFuse} />
        </View>
      ))}

      {/* Sparks at bottom */}
      <View style={styles.sparkContainer}>
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const dx = Math.cos(rad) * 15;
          const dy = Math.sin(rad) * 15;
          return (
            <View
              key={i}
              style={[
                styles.sparkLine,
                {
                  transform: [
                    { translateX: dx / 2 },
                    { translateY: dy / 2 },
                    { rotate: `${angle}deg` },
                  ],
                  backgroundColor: i % 2 === 0 ? '#FFD700' : '#FF6B00',
                },
              ]}
            />
          );
        })}
        <View style={styles.sparkCenter} />
      </View>
    </Animated.View>
  );
};

interface SparkProps {
  x: number;
  y: number;
  delay: number;
}

const Spark: React.FC<SparkProps> = ({ x, y, delay }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          delay,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.spark, { left: x, top: y, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.sparkStar}>
        <View style={[styles.sparkRay, styles.sparkRayH]} />
        <View style={[styles.sparkRay, styles.sparkRayV]} />
        <View style={[styles.sparkRay, styles.sparkRayD1]} />
        <View style={[styles.sparkRay, styles.sparkRayD2]} />
      </View>
    </Animated.View>
  );
};

export const CelebrationOverlay: React.FC = () => {
  const sparks = Array.from({ length: 15 }, (_, i) => ({
    x: Math.random() * (SCREEN_WIDTH - 40) + 20,
    y: Math.random() * (SCREEN_HEIGHT - 100) + 50,
    delay: Math.random() * 1500,
  }));

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Firecrackers on both sides */}
      <Firecracker x={10} delay={0} />
      <Firecracker x={SCREEN_WIDTH - 70} delay={300} />

      {/* Sparks */}
      {sparks.map((spark, i) => (
        <Spark key={i} x={spark.x} y={spark.y} delay={spark.delay} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  firecracker: {
    position: 'absolute',
    top: 0,
    width: 60,
    height: 280,
  },
  fuDiamond: {
    position: 'absolute',
    top: 10,
    left: 12,
    width: 36,
    height: 36,
    backgroundColor: '#E31C25',
    borderWidth: 2,
    borderColor: '#FFD700',
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  fuText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    transform: [{ rotate: '-45deg' }],
  },
  rope: {
    position: 'absolute',
    top: 50,
    left: 28,
    width: 4,
    height: 200,
    backgroundColor: '#D4A017',
  },
  crackerItem: {
    position: 'absolute',
    alignItems: 'center',
  },
  crackerBody: {
    width: 14,
    height: 12,
    backgroundColor: '#E31C25',
    borderRadius: 2,
    overflow: 'hidden',
  },
  crackerBand: {
    position: 'absolute',
    top: 4,
    width: 14,
    height: 4,
    backgroundColor: '#FFD700',
  },
  crackerFuse: {
    width: 1,
    height: 4,
    backgroundColor: '#333',
    marginTop: -1,
  },
  sparkContainer: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkLine: {
    position: 'absolute',
    width: 2,
    height: 15,
    borderRadius: 1,
  },
  sparkCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFD700',
  },
  spark: {
    position: 'absolute',
    width: 20,
    height: 20,
  },
  sparkStar: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkRay: {
    position: 'absolute',
    backgroundColor: '#FFD700',
  },
  sparkRayH: {
    width: 20,
    height: 4,
    borderRadius: 2,
  },
  sparkRayV: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sparkRayD1: {
    width: 14,
    height: 4,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  sparkRayD2: {
    width: 14,
    height: 4,
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
  },
});

export default CelebrationOverlay;
