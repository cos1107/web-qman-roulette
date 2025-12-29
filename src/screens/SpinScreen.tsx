import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useWheel } from '../context/WheelContext';
import { Wheel } from '../components/Wheel';
import { ResultModal } from '../components/ResultModal';

type SpinScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Spin'>;
};

export const SpinScreen: React.FC<SpinScreenProps> = ({ navigation }) => {
  const { config, activeTheme, result, targetSector, spin, clearResult } = useWheel();
  const [localSpinning, setLocalSpinning] = useState(false);

  const handleSpin = useCallback(() => {
    if (localSpinning || config.options.length < 1) return;
    setLocalSpinning(true);
    spin();
  }, [localSpinning, config.options.length, spin]);

  const handleSpinEnd = useCallback(() => {
    setLocalSpinning(false);
  }, []);

  const handleSpinAgain = useCallback(() => {
    clearResult();
    setTimeout(() => {
      handleSpin();
    }, 100);
  }, [clearResult, handleSpin]);

  const handleReset = useCallback(() => {
    clearResult();
    navigation.navigate('Setup');
  }, [clearResult, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeTheme.bg }]}>
      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { backgroundColor: activeTheme.palette[0], borderColor: activeTheme.accent }]}
        onPress={() => navigation.navigate('Setup')}
      >
        <Text style={[styles.backBtnText, { color: activeTheme.text }]}>← 返回設定</Text>
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: activeTheme.text }]}>{config.name}</Text>
        <View style={[styles.titleUnderline, { backgroundColor: activeTheme.accent }]} />
      </View>

      {/* Wheel */}
      <View style={styles.wheelContainer}>
        <Wheel
          options={config.options}
          palette={activeTheme.palette}
          isSpinning={localSpinning}
          targetSector={targetSector}
          onSpinEnd={handleSpinEnd}
        />
      </View>

      {/* Spin button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.spinBtn,
            {
              backgroundColor: activeTheme.accent,
              borderColor: activeTheme.palette[3],
              opacity: localSpinning ? 0.5 : 1,
            },
          ]}
          onPress={handleSpin}
          disabled={localSpinning}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.spinBtnText,
              { color: activeTheme.bg === '#FFF5F5' ? '#FFF' : activeTheme.bg },
            ]}
          >
            {localSpinning ? '開始' : '開運旋轉'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Result Modal */}
      <ResultModal
        visible={!!result && !localSpinning}
        result={result}
        theme={activeTheme}
        onClose={clearResult}
        onSpinAgain={handleSpinAgain}
        onReset={handleReset}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    zIndex: 20,
  },
  backBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  titleContainer: {
    marginTop: 100,
    alignItems: 'center',
    zIndex: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
    textAlign: 'center',
  },
  titleUnderline: {
    width: 80,
    height: 4,
    borderRadius: 2,
    marginTop: 8,
  },
  wheelContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 30,
    paddingBottom: 40,
    zIndex: 10,
  },
  spinBtn: {
    paddingVertical: 20,
    borderRadius: 12,
    borderBottomWidth: 6,
    alignItems: 'center',
  },
  spinBtnText: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
});

export default SpinScreen;
