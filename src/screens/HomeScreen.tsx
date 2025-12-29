import React from 'react';
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

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { activeTheme } = useWheel();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeTheme.bg }]}>
      {/* Main content */}
      <View style={[styles.card, { borderColor: activeTheme.accent }]}>
        {/* Year display */}
        <View style={styles.yearRow}>
          <Text style={[styles.yearChar, { color: activeTheme.accent }]}>二</Text>
          <Text style={[styles.yearChar, { color: activeTheme.text }]}>〇</Text>
          <Text style={[styles.yearChar, { color: activeTheme.accent }]}>二</Text>
          <Text style={[styles.yearChar, { color: activeTheme.text }]}>六</Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: activeTheme.text }]}>
          迎春開運輪盤
        </Text>

        {/* Subtitle */}
        <Text style={[styles.subtitle, { color: activeTheme.accent }]}>
          Year of the Horse
        </Text>

        {/* Horse emoji */}
        <View style={[styles.emojiContainer, { borderColor: activeTheme.accent }]}>
          <Text style={styles.emoji}>🐴</Text>
        </View>

        {/* Start button */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: activeTheme.accent,
              borderColor: activeTheme.palette[3],
            },
          ]}
          onPress={() => navigation.navigate('Setup')}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.buttonText,
              { color: activeTheme.bg === '#FFF5F5' ? '#FFF' : activeTheme.bg },
            ]}
          >
            立即開運
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    padding: 40,
    marginHorizontal: 20,
    alignItems: 'center',
    borderWidth: 4,
  },
  yearRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  yearChar: {
    fontSize: 28,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 30,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 60,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 12,
    borderBottomWidth: 6,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
});

export default HomeScreen;
