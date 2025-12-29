import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Animated,
  Easing,
  Modal,
  Image,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, G, Text as SvgText } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

// ============ TYPES ============
type ScreenName = 'Home' | 'Setup' | 'Spin' | 'PokeSetup' | 'PokeGame';
type ThemeId = 'emerald' | 'classic' | 'fresh';
type GameMode = 'wheel' | 'poke';

interface Option {
  id: string;
  type: 'text' | 'image';
  content: string;
  label?: string;
}

interface Theme {
  id: ThemeId;
  name: string;
  palette: string[];
  bg: string;
  accent: string;
  text: string;
  label: string;
  gradientTop?: string;
  gradientBottom?: string;
  buttonBg?: string;
  buttonText?: string;
}

interface WheelConfig {
  id: string;
  name: string;
  customGreeting: string;
  options: Option[];
  themeId: ThemeId;
  createdAt: number;
  updatedAt: number;
}

interface PokeConfig {
  id: string;
  name: string;
  customGreeting: string;
  options: Option[];
  themeId: ThemeId;
  createdAt: number;
  updatedAt: number;
}

// Calculate optimal grid layout based on number of items and screen dimensions
function calculateOptimalGrid(itemCount: number, screenWidth: number, screenHeight: number): { rows: number; cols: number } {
  if (itemCount <= 0) return { rows: 1, cols: 1 };

  // Available space for the grid (accounting for padding, title, buttons)
  const availableWidth = screenWidth - 40;
  const availableHeight = screenHeight - 300;
  const aspectRatio = availableWidth / availableHeight;

  let bestRows = 1;
  let bestCols = itemCount;
  let bestScore = Infinity;

  // Try different row/col combinations
  for (let rows = 1; rows <= itemCount; rows++) {
    const cols = Math.ceil(itemCount / rows);
    if (rows * cols < itemCount) continue;

    // Calculate the aspect ratio of this grid
    const gridAspect = cols / rows;

    // Score based on how close the grid aspect matches screen aspect
    // Also penalize empty cells
    const emptyCells = (rows * cols) - itemCount;
    const aspectDiff = Math.abs(gridAspect - aspectRatio);
    const score = aspectDiff + (emptyCells * 0.5);

    if (score < bestScore) {
      bestScore = score;
      bestRows = rows;
      bestCols = cols;
    }
  }

  return { rows: bestRows, cols: bestCols };
}

interface SpinResult {
  option: Option;
  index: number;
}

interface PokedCell {
  cellIndex: number;
  option: Option;
}

// ============ CONSTANTS ============
const THEMES: Record<ThemeId, Theme> = {
  emerald: {
    id: 'emerald',
    name: '喜氣',
    palette: ['#9B2C1F', '#6F1612', '#E6B65C', '#FAF6EE'],
    bg: '#8C1D18',
    accent: '#E6B65C',
    text: '#FAF6EE',
    label: '#E6B65C',
    gradientTop: '#9B2C1F',
    gradientBottom: '#6F1612',
    buttonBg: '#E6B65C',
    buttonText: '#8C1D18',
  },
  classic: {
    id: 'classic',
    name: '粉春',
    palette: ['#FADADD', '#F38CA3', '#FFF6F7', '#B7D7C2'],
    bg: '#FFF1F3',
    accent: '#F3A6B1',
    text: '#6B4A4A',
    label: '#C9A5AA',
    buttonBg: '#F38CA3',
    buttonText: '#FFFFFF',
    gradientTop: '#FFF6F7',
    gradientBottom: '#FDECEF',
  },
  fresh: {
    id: 'fresh',
    name: '清新',
    palette: ['#C9D6CC', '#5FB36A', '#EEF6EE', '#FFFFFF'],
    bg: '#EEF6EE',
    accent: '#5FB36A',
    text: '#2F5E3A',
    label: '#6F8F78',
    buttonBg: '#5FB36A',
    buttonText: '#FFFFFF',
  },
};

const LUNAR_GREETINGS = [
  '新春大吉，好運連連！',
  '恭喜發財，紅包拿來！',
  '龍馬精神，萬事如意！',
  '歲歲平安，年年有餘！',
  '前程似錦，大展宏圖！',
];

const DEFAULT_CONFIG: WheelConfig = {
  id: 'default',
  name: 'LUCKY抽 • 輪盤',
  customGreeting: '',
  options: [],
  themeId: 'emerald',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const DEFAULT_POKE_CONFIG: PokeConfig = {
  id: 'default-poke',
  name: 'LUCKY抽 • 戳戳樂',
  customGreeting: '',
  options: [],
  themeId: 'emerald',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const STORAGE_KEY = '@qman_wheel_config';
const POKE_STORAGE_KEY = '@qman_poke_config';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============ CONTEXT ============
interface AppContextType {
  currentScreen: ScreenName;
  navigate: (screen: ScreenName) => void;
  // Wheel state
  config: WheelConfig;
  setConfig: React.Dispatch<React.SetStateAction<WheelConfig>>;
  activeTheme: Theme;
  setTheme: (id: ThemeId) => void;
  addOption: (opt: Option) => void;
  removeOption: (id: string) => void;
  updateOption: (id: string, content: string) => void;
  saveConfig: () => Promise<void>;
  result: SpinResult | null;
  setResult: React.Dispatch<React.SetStateAction<SpinResult | null>>;
  // Poke state
  pokeConfig: PokeConfig;
  setPokeConfig: React.Dispatch<React.SetStateAction<PokeConfig>>;
  pokeTheme: Theme;
  setPokeTheme: (id: ThemeId) => void;
  addPokeOption: (opt: Option) => void;
  removePokeOption: (id: string) => void;
  updatePokeOption: (id: string, content: string) => void;
  savePokeConfig: () => Promise<void>;
  pokedCells: PokedCell[];
  setPokedCells: React.Dispatch<React.SetStateAction<PokedCell[]>>;
  pokeResult: SpinResult | null;
  setPokeResult: React.Dispatch<React.SetStateAction<SpinResult | null>>;
}

const AppContext = createContext<AppContextType | null>(null);

function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ============ WHEEL COMPONENT ============
const SIZE = 380;
const TOTAL_SECTORS = 12;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 3;

// Pastel colors for the wheel sectors
const PASTEL_COLORS = [
  '#FFB6C1', // Light Pink
  '#FF6B6B', // Coral Red
  '#FFE66D', // Yellow
  '#98D8AA', // Green
  '#87CEEB', // Sky Blue
  '#DDA0DD', // Plum/Lavender
  '#F0E68C', // Khaki
  '#98FB98', // Pale Green
  '#B0E0E6', // Powder Blue
  '#FFB347', // Pastel Orange
  '#77DD77', // Pastel Green
  '#CBAACB', // Pastel Purple
];

interface WheelProps {
  options: Option[];
  palette: string[];
  theme: Theme;
  isSpinning: boolean;
  onSpinEnd?: (finalRotation: number) => void;
}

// Helper function to create pie slice path
function createPieSlice(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const startRad = (startAngle - 90) * Math.PI / 180;
  const endRad = (endAngle - 90) * Math.PI / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy + radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy + radius * Math.sin(endRad);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function Wheel({ options, palette, theme, isSpinning, onSpinEnd }: WheelProps) {
  const rotationAnim = React.useRef(new Animated.Value(0)).current;
  const currentRotation = React.useRef(0);

  useEffect(() => {
    if (isSpinning) {
      const fullSpins = (7 + Math.floor(Math.random() * 5)) * 360;
      const landingOffset = Math.floor(Math.random() * 360);
      const targetRotation = currentRotation.current + fullSpins + landingOffset;

      Animated.timing(rotationAnim, {
        toValue: targetRotation,
        duration: 5000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        currentRotation.current = targetRotation;
        onSpinEnd?.(targetRotation);
      });
    }
  }, [isSpinning]);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  // Build color map by option index for consistency with setup list
  const sectorAngle = 360 / TOTAL_SECTORS;
  const sectors = Array.from({ length: TOTAL_SECTORS }, (_, i) => {
    const optIndex = i % Math.max(options.length, 1);
    const opt = options[optIndex] || { id: 'empty', type: 'text', content: '' };
    // Use the same color index as the option's position in the list
    const fillColor = PASTEL_COLORS[optIndex % PASTEL_COLORS.length];
    const startAngle = i * sectorAngle;
    const endAngle = startAngle + sectorAngle;
    const midAngle = startAngle + sectorAngle / 2;
    // Different radius for text vs images - images closer to edge
    const textRadius = RADIUS * 0.58;
    const imageRadius = RADIUS * 0.76;
    const contentAngleRad = (midAngle - 90) * Math.PI / 180;
    const textX = CENTER + textRadius * Math.cos(contentAngleRad);
    const textY = CENTER + textRadius * Math.sin(contentAngleRad);
    const imageX = CENTER + imageRadius * Math.cos(contentAngleRad);
    const imageY = CENTER + imageRadius * Math.sin(contentAngleRad);
    // Text rotation: read from center outward (subtract 90 to align along radius)
    const textRotation = midAngle - 90;
    // Dynamic text: show full text, adjust font size based on length
    const textContent = opt.type === 'text' ? opt.content : '';
    const textLength = textContent.length;
    // Dynamic font size: 1-2 chars = 20, 3-4 chars = 16, 5+ chars = 13
    const fontSize = textLength <= 2 ? 20 : textLength <= 4 ? 16 : 13;

    return {
      path: createPieSlice(CENTER, CENTER, RADIUS, startAngle, endAngle),
      fillColor,
      textX,
      textY,
      imageX,
      imageY,
      textRotation,
      textContent,
      fontSize,
      option: opt,
      optIndex,
    };
  });

  const CENTER_RADIUS = 38;

  return (
    <View style={wheelStyles.container}>
      {/* Rotating Wheel */}
      <Animated.View style={[wheelStyles.wheelWrapper, { transform: [{ rotate: spin }] }]}>
        <View style={wheelStyles.wheelBorder}>
          <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {/* Pie sectors */}
            {sectors.map((sector, i) => (
              <Path
                key={i}
                d={sector.path}
                fill={sector.fillColor}
                stroke="#FFFFFF"
                strokeWidth={1}
              />
            ))}
          </Svg>

          {/* Image overlays for photo options */}
          {sectors.map((sector, i) => (
            sector.option.type === 'image' ? (
              <Image
                key={`img-${i}`}
                source={{ uri: sector.option.content }}
                style={[
                  wheelStyles.sectorImage,
                  {
                    left: sector.imageX - 30,
                    top: sector.imageY - 30,
                    borderColor: theme.id === 'emerald' ? '#E6B65C' : (theme.id === 'fresh' ? '#5FB36A' : (theme.id === 'classic' ? '#F3A6B1' : '#FFFFFF')),
                    borderWidth: (theme.id === 'emerald' || theme.id === 'fresh' || theme.id === 'classic') ? 3 : 2,
                  },
                ]}
              />
            ) : (
              <View
                key={`text-${i}`}
                style={[
                  wheelStyles.sectorTextContainer,
                  {
                    left: sector.textX - 35,
                    top: sector.textY - 10,
                    transform: [{ rotate: `${sector.textRotation}deg` }],
                  },
                ]}
              >
                <Text style={[wheelStyles.sectorText, { fontSize: sector.fontSize }]}>{sector.textContent}</Text>
              </View>
            )
          ))}
        </View>
      </Animated.View>

      {/* Fixed center circle and pointer (does NOT rotate) */}
      <View style={wheelStyles.fixedCenter}>
        <Svg width={CENTER_RADIUS * 2 + 40} height={CENTER_RADIUS * 2 + 40} viewBox={`0 0 ${CENTER_RADIUS * 2 + 40} ${CENTER_RADIUS * 2 + 40}`}>
          {/* Center circle with theme-aware styling */}
          <Circle
            cx={CENTER_RADIUS + 20}
            cy={CENTER_RADIUS + 20}
            r={CENTER_RADIUS}
            fill={theme.id === 'emerald' ? '#FAF6EE' : '#FFFFFF'}
            stroke={theme.id === 'emerald' ? '#E6B65C' : (theme.id === 'fresh' ? '#5FB36A' : (theme.id === 'classic' ? '#F3A6B1' : '#E0E0E0'))}
            strokeWidth={theme.id === 'emerald' || theme.id === 'fresh' || theme.id === 'classic' ? 2 : 1}
          />
          <Circle
            cx={CENTER_RADIUS + 20}
            cy={CENTER_RADIUS + 20}
            r={CENTER_RADIUS - 4}
            fill={theme.id === 'emerald' ? '#FAF6EE' : '#FFFFFF'}
            stroke={theme.id === 'emerald' ? '#E6B65C' : (theme.id === 'fresh' ? '#5FB36A' : (theme.id === 'classic' ? '#F3A6B1' : '#E0E0E0'))}
            strokeWidth={1}
          />
          {/* Pointer notch extending OUTWARD from center circle at top */}
          <Path
            d={`M ${CENTER_RADIUS + 20 - 10} ${20 + 2} L ${CENTER_RADIUS + 20} ${20 - 18} L ${CENTER_RADIUS + 20 + 10} ${20 + 2} Z`}
            fill={theme.id === 'emerald' ? '#FAF6EE' : '#FFFFFF'}
            stroke={theme.id === 'emerald' ? '#E6B65C' : (theme.id === 'fresh' ? '#5FB36A' : (theme.id === 'classic' ? '#F3A6B1' : '#E0E0E0'))}
            strokeWidth={theme.id === 'emerald' || theme.id === 'fresh' || theme.id === 'classic' ? 2 : 1}
          />
        </Svg>
        <View style={wheelStyles.centerTextContainer}>
          <Text style={[wheelStyles.centerText, { color: theme.id === 'emerald' ? '#8C1D18' : (theme.id === 'fresh' ? '#2F5E3A' : (theme.id === 'classic' ? '#F38CA3' : '#C41E3A')) }]}>抽</Text>
        </View>
      </View>
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelWrapper: {
    width: SIZE + 12,
    height: SIZE + 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelBorder: {
    width: SIZE + 6,
    height: SIZE + 6,
    borderRadius: (SIZE + 6) / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  fixedCenter: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectorImage: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sectorTextContainer: {
    position: 'absolute',
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectorText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
  },
  centerTextContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#C41E3A',
  },
});

// ============ RESULT MODAL ============
interface ResultModalProps {
  visible: boolean;
  result: SpinResult | null;
  theme: Theme;
  customGreeting: string;
  onClose: () => void;
  onSpinAgain: () => void;
  onReset: () => void;
  againButtonText?: string;
}

function ResultModal({ visible, result, theme, customGreeting, onClose, onSpinAgain, onReset, againButtonText = '再來一次' }: ResultModalProps) {
  if (!result) return null;
  const displayHeader = customGreeting ? `🎊 ${customGreeting} 🎊` : '🎊 恭喜獲獎 🎊';
  const isClassic = theme.id === 'classic';
  const isFresh = theme.id === 'fresh';
  const isEmerald = theme.id === 'emerald';

  // Theme specific colors
  const overlayBg = isClassic ? 'rgba(90, 60, 65, 0.55)' : isFresh ? 'rgba(47, 94, 58, 0.45)' : 'rgba(0,0,0,0.9)';
  const cardBg = isClassic ? '#FADADD' : isFresh ? '#C9D6CC' : theme.palette[0];
  const cardBorder = isClassic ? '#F3A6B1' : isFresh ? '#5FB36A' : theme.accent;
  const headerColor = isClassic ? '#E77B94' : isFresh ? '#2F5E3A' : '#FFFFFF';
  const resultTextColor = isEmerald ? '#8C1D18' : theme.text;
  const resultBoxBorder = isClassic ? '#F3A6B1' : isFresh ? '#5FB36A' : theme.accent;
  const resultBoxShadow = (isClassic || isFresh) ? {
    shadowColor: isClassic ? 'rgba(243,140,163,0.25)' : 'rgba(47, 94, 58, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  } : {};
  const primaryBtnBg = isClassic ? '#F38CA3' : isFresh ? '#5FB36A' : theme.accent;
  const primaryBtnText = isEmerald ? '#8C1D18' : '#FFFFFF';
  const primaryBtnShadow = (isClassic || isFresh) ? {
    shadowColor: isClassic ? 'rgba(243,140,163,0.35)' : 'rgba(47, 94, 58, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  } : {};
  const secondaryBtnBg = isClassic ? '#FADADD' : isFresh ? '#8FAE96' : isEmerald ? '#6F1612' : '#333333';
  const secondaryBtnText = isClassic ? '#6B4A4A' : '#FFFFFF';
  const secondaryBtnBorder = isClassic ? '#F3A6B1' : 'transparent';
  const cardShadow = (isClassic || isFresh) ? {
    shadowColor: isClassic ? 'rgba(90, 60, 65, 0.3)' : 'rgba(47, 94, 58, 0.25)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  } : {};
  const cardRadius = (isClassic || isFresh) ? 20 : 16;
  const cardBorderWidth = (isClassic || isFresh) ? 2 : 6;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[modalStyles.overlay, { backgroundColor: overlayBg }]}>
        <View style={[modalStyles.card, { backgroundColor: cardBg, borderColor: cardBorder, borderRadius: cardRadius, borderWidth: cardBorderWidth }, cardShadow]}>
          <Text style={[modalStyles.header, { color: headerColor }]}>{displayHeader}</Text>
          <View style={[modalStyles.resultBox, { backgroundColor: '#FFFFFF', borderColor: resultBoxBorder }, resultBoxShadow]}>
            {result.option.type === 'text' ? (
              <Text style={[modalStyles.resultText, { color: resultTextColor }]}>{result.option.content}</Text>
            ) : (
              <View>
                <Image source={{ uri: result.option.content }} style={[modalStyles.resultImage, { borderColor: resultBoxBorder }]} />
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[
              modalStyles.primaryBtn,
              {
                backgroundColor: primaryBtnBg,
              },
              primaryBtnShadow
            ]}
            onPress={onSpinAgain}
          >
            <Text style={[modalStyles.primaryBtnText, { color: primaryBtnText }]}>{againButtonText}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              modalStyles.secondaryBtn,
              {
                backgroundColor: secondaryBtnBg,
                borderWidth: isClassic ? 1 : 0,
                borderColor: secondaryBtnBorder,
              }
            ]}
            onPress={onReset}
          >
            <Text style={[modalStyles.secondaryBtnText, { color: secondaryBtnText }]}>重新製作</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: SCREEN_WIDTH - 40, borderRadius: 16, padding: 24, borderWidth: 6 },
  header: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  resultBox: { padding: 30, borderRadius: 12, borderWidth: 2, alignItems: 'center', marginBottom: 20 },
  resultText: { fontSize: 48, fontWeight: 'bold', textAlign: 'center' },
  resultImage: { width: 150, height: 150, borderRadius: 75, borderWidth: 4 },
  primaryBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12, marginTop: 10 },
  primaryBtnText: { fontSize: 20, fontWeight: 'bold' },
  secondaryBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  secondaryBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fef3c7' },
});

// ============ HOME SCREEN ============
function HomeScreen() {
  const { navigate, activeTheme } = useApp();
  const isClassic = activeTheme.id === 'classic';
  const isFresh = activeTheme.id === 'fresh';

  // Theme specific colors
  const cardBg = isClassic ? '#FADADD' : isFresh ? '#C9D6CC' : 'rgba(0,0,0,0.2)';
  const cardBorder = isClassic ? '#F3A6B1' : isFresh ? '#5FB36A' : activeTheme.accent;
  const titleColor = isClassic ? '#6B4A4A' : isFresh ? '#2F5E3A' : activeTheme.text;
  const subtitleColor = isClassic ? '#F3A6B1' : isFresh ? '#6F8F78' : activeTheme.accent;
  const emojiBoxBorder = isClassic ? '#F3A6B1' : isFresh ? '#5FB36A' : activeTheme.accent;
  const emojiBoxBg = isClassic ? '#FFF6F7' : isFresh ? '#FFFFFF' : 'transparent';
  const btnBg = isClassic ? '#F38CA3' : isFresh ? '#5FB36A' : (activeTheme.buttonBg || activeTheme.accent);
  const btnText = '#FFFFFF';
  const btnShadow = (isClassic || isFresh) ? {
    shadowColor: isClassic ? 'rgba(243,140,163,0.35)' : 'rgba(47, 94, 58, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  } : {};
  const cardShadow = (isClassic || isFresh) ? {
    shadowColor: isClassic ? 'rgba(90, 60, 65, 0.2)' : 'rgba(47, 94, 58, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  } : {};

  return (
    <SafeAreaView style={[homeStyles.container, { backgroundColor: activeTheme.bg }]}>
      <View style={[homeStyles.card, { backgroundColor: cardBg, borderColor: cardBorder }, cardShadow]}>
        {/* Horse Logo */}
        <View style={[homeStyles.emojiBox, { borderColor: emojiBoxBorder, backgroundColor: emojiBoxBg }]}>
          <Text style={homeStyles.emoji}>🐴</Text>
        </View>

        {/* App Title */}
        <Text style={[homeStyles.appTitle, { color: titleColor }]}>LUCKY抽</Text>
        <Text style={[homeStyles.subtitle, { color: subtitleColor }]}>幸運抽獎小幫手</Text>

        {/* Buttons */}
        <View style={homeStyles.btnRow}>
          <TouchableOpacity
            style={[
              homeStyles.btnHalf,
              {
                backgroundColor: btnBg,
                borderColor: isClassic ? '#E77B94' : activeTheme.palette[1],
                borderBottomWidth: isClassic ? 0 : 5,
              },
              btnShadow
            ]}
            onPress={() => navigate('Setup')}
            activeOpacity={0.8}
          >
            <Text style={homeStyles.btnEmoji}>🎡</Text>
            <Text style={[homeStyles.btnTextSmall, { color: btnText }]}>輪盤抽獎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              homeStyles.btnHalf,
              {
                backgroundColor: btnBg,
                borderColor: isClassic ? '#E77B94' : activeTheme.palette[1],
                borderBottomWidth: isClassic ? 0 : 5,
              },
              btnShadow
            ]}
            onPress={() => navigate('PokeSetup')}
            activeOpacity={0.8}
          >
            <Text style={homeStyles.btnEmoji}>🎯</Text>
            <Text style={[homeStyles.btnTextSmall, { color: btnText }]}>戳戳樂</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const homeStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  card: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 24, paddingVertical: 60, paddingHorizontal: 45, alignItems: 'center', borderWidth: 3, marginHorizontal: 20 },
  emojiBox: { width: 130, height: 130, borderRadius: 65, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginTop: 15 },
  emoji: { fontSize: 65 },
  appTitle: { fontSize: 40, fontWeight: 'bold', marginTop: 30, letterSpacing: 2 },
  subtitle: { fontSize: 15, fontWeight: '600', letterSpacing: 2, marginBottom: 50, marginTop: 10 },
  btnRow: { flexDirection: 'row', gap: 12 },
  btnHalf: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 14, borderBottomWidth: 5, alignItems: 'center' },
  btnEmoji: { fontSize: 32, marginBottom: 6 },
  btnTextSmall: { fontSize: 18, fontWeight: 'bold' },
});

// ============ SETUP SCREEN ============
function SetupScreen() {
  const { navigate, config, setConfig, activeTheme, setTheme, addOption, removeOption, updateOption, saveConfig } = useApp();

  const handleAddOption = () => {
    if (config.options.length >= 12) {
      Alert.alert('已達上限', '最多只能新增 12 個選項');
      return;
    }
    const nextNumber = config.options.length + 1;
    addOption({ id: Date.now().toString(), type: 'text', content: `選項${nextNumber}` });
  };

  const handlePhotoImport = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('需要權限', '請允許存取相簿');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets) return;
      const remaining = 12 - config.options.length;
      const newOptions: Option[] = result.assets.slice(0, remaining).map((asset, i) => ({
        id: `img-${i}-${Date.now()}`,
        type: 'image',
        content: asset.uri,
        label: `相片 ${config.options.length + i + 1}`,
      }));
      setConfig(prev => ({ ...prev, options: [...prev.options, ...newOptions] }));
    } catch {
      Alert.alert('匯入失敗', '無法讀取相片');
    }
  };

  const handleGo = async () => {
    if (config.options.length === 0) {
      Alert.alert('提示', '請先新增至少一個選項');
      return;
    }
    await saveConfig();
    navigate('Spin');
  };

  // Theme specific card/header colors
  const isClassic = activeTheme.id === 'classic';
  const isFresh = activeTheme.id === 'fresh';
  const cardBg = isClassic ? '#FFFFFF' : isFresh ? '#FFFFFF' : activeTheme.palette[0];
  const headerBg = isClassic ? '#FADADD' : isFresh ? '#C9D6CC' : activeTheme.bg;
  const closeBtnColor = isClassic ? '#A65C63' : isFresh ? '#2F5E3A' : activeTheme.accent;
  const inputBorderColor = isClassic ? '#F3A6B1' : isFresh ? '#5FB36A' : activeTheme.accent;
  const deleteBtnColor = isClassic ? '#E07A86' : isFresh ? '#5FB36A' : activeTheme.accent;
  const inputBg = isClassic ? '#FFFFFF' : isFresh ? '#FFFFFF' : activeTheme.bg;

  return (
    <SafeAreaView style={[setupStyles.container, { backgroundColor: activeTheme.bg }]}>
      <View style={[setupStyles.card, { backgroundColor: cardBg, borderColor: activeTheme.accent }]}>
        <View style={[setupStyles.header, { borderColor: activeTheme.accent, backgroundColor: headerBg }]}>
          <Text style={[setupStyles.headerTitle, { color: activeTheme.text }]}>輪盤製作</Text>
          <TouchableOpacity onPress={() => navigate('Home')}>
            <Text style={[setupStyles.closeBtn, { color: closeBtnColor }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={setupStyles.content} showsVerticalScrollIndicator={false}>
          <Text style={[setupStyles.label, { color: activeTheme.label }]}>輪盤標題</Text>
          <View style={[setupStyles.inputWrapper, { backgroundColor: inputBg, borderColor: inputBorderColor }]}>
            <TextInput
              style={[setupStyles.inputInner, { color: activeTheme.text }]}
              value={config.name}
              onChangeText={text => setConfig(prev => ({ ...prev, name: text }))}
              placeholder="輸入輪盤標題"
              placeholderTextColor={activeTheme.label}
            />
            <View style={setupStyles.editIconInner}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="#999999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M14.06 6.19l3.75 3.75" stroke="#999999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </View>

          <Text style={[setupStyles.label, { color: activeTheme.label, marginTop: 16 }]}>中獎賀詞</Text>
          <View style={[setupStyles.inputWrapper, { backgroundColor: inputBg, borderColor: inputBorderColor }]}>
            <TextInput
              style={[setupStyles.inputInner, { color: activeTheme.text }]}
              value={config.customGreeting}
              onChangeText={text => setConfig(prev => ({ ...prev, customGreeting: text }))}
              placeholder="恭喜獲獎"
              placeholderTextColor={isClassic ? '#6B4A4A' : isFresh ? '#2F5E3A' : activeTheme.text}
            />
            <View style={setupStyles.editIconInner}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="#999999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M14.06 6.19l3.75 3.75" stroke="#999999" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </View>

          <Text style={[setupStyles.label, { color: activeTheme.label, marginTop: 16 }]}>主題配色</Text>
          <View style={setupStyles.themeRow}>
            {(Object.keys(THEMES) as ThemeId[]).map(tid => (
              <TouchableOpacity
                key={tid}
                style={[
                  setupStyles.themeBtn,
                  { backgroundColor: THEMES[tid].bg, borderColor: config.themeId === tid ? THEMES[tid].accent : 'transparent' },
                ]}
                onPress={() => setTheme(tid)}
              >
                <Text style={[setupStyles.themeName, { color: THEMES[tid].text }]}>{THEMES[tid].name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={setupStyles.optionsHeader}>
            <Text style={[setupStyles.sectionTitle, { color: activeTheme.text }]}>選項列表 ({config.options.length}/12)</Text>
            <View style={setupStyles.optionsBtnRow}>
              <TouchableOpacity
                style={[setupStyles.clearBtn, { borderColor: deleteBtnColor, opacity: config.options.length === 0 ? 0.4 : 1 }]}
                onPress={() => config.options.length > 0 && setConfig(prev => ({ ...prev, options: [] }))}
                disabled={config.options.length === 0}
              >
                <Text style={[setupStyles.clearBtnText, { color: deleteBtnColor }]}>清除</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[setupStyles.addBtn, { backgroundColor: activeTheme.accent }]} onPress={handleAddOption}>
                <Text style={[setupStyles.addBtnText, { color: activeTheme.buttonText || activeTheme.bg }]}>+ 新增</Text>
              </TouchableOpacity>
            </View>
          </View>

          {config.options.length === 0 ? (
            <View style={[setupStyles.emptyBox, { borderColor: activeTheme.label }]}>
              <Text style={[setupStyles.emptyText, { color: activeTheme.label }]}>目前沒有選項</Text>
            </View>
          ) : (
            config.options.map((opt, i) => (
              <View key={opt.id} style={[setupStyles.optionItem, { backgroundColor: inputBg, borderColor: inputBorderColor }]}>
                <View style={[setupStyles.optionIndex, { backgroundColor: PASTEL_COLORS[i % 12] }]}>
                  <Text style={[setupStyles.optionIndexText, { color: '#FFFFFF' }]}>{i + 1}</Text>
                </View>
                {opt.type === 'text' ? (
                  <TextInput
                    style={[setupStyles.optionInput, { color: activeTheme.text }]}
                    value={opt.content}
                    onChangeText={text => updateOption(opt.id, text)}
                  />
                ) : (
                  <View style={setupStyles.imageOptionRow}>
                    <Image source={{ uri: opt.content }} style={setupStyles.optionThumbnail} />
                    <Text style={[setupStyles.optionLabel, { color: activeTheme.text }]}>{opt.label || '相片'}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => removeOption(opt.id)}>
                  <Text style={[setupStyles.removeBtn, { color: deleteBtnColor }]}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={[setupStyles.importBox, { backgroundColor: inputBg, borderColor: inputBorderColor }]}>
            <TouchableOpacity style={setupStyles.importBtn} onPress={handlePhotoImport}>
              <Text style={[setupStyles.importBtnText, { color: isClassic ? '#A65C63' : isFresh ? '#5FB36A' : activeTheme.accent }]}>📸 匯入相片</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={[setupStyles.footer, { borderColor: inputBorderColor, backgroundColor: headerBg }]}>
          <TouchableOpacity
            style={[
              setupStyles.goBtn,
              {
                backgroundColor: activeTheme.buttonBg || activeTheme.accent,
                opacity: config.options.length === 0 ? 0.5 : 1,
                shadowColor: activeTheme.id === 'classic' ? 'rgba(243,140,163,0.35)' : '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: activeTheme.id === 'classic' ? 1 : 0.2,
                shadowRadius: 4,
                elevation: 4,
              },
            ]}
            onPress={handleGo}
            disabled={config.options.length === 0}
          >
            <Text style={[setupStyles.goBtnText, { color: activeTheme.buttonText || '#FFFFFF' }]}>抽獎GO</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const setupStyles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { flex: 1, borderRadius: 16, borderWidth: 4, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { fontSize: 24, fontWeight: 'bold', padding: 4 },
  content: { flex: 1, padding: 16 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 2, paddingRight: 8 },
  inputInner: { flex: 1, padding: 14, fontSize: 16 },
  editIconInner: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' },
  editIconText: { fontSize: 14 },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  themeBtn: { flex: 1, paddingVertical: 14, paddingHorizontal: 6, borderRadius: 10, borderWidth: 3, alignItems: 'center' },
  themeName: { fontSize: 14, fontWeight: 'bold' },
  optionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  optionsBtnRow: { flexDirection: 'row', gap: 8 },
  clearBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  clearBtnText: { fontWeight: 'bold', fontSize: 13 },
  addBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  addBtnText: { fontWeight: 'bold' },
  emptyBox: { padding: 30, borderWidth: 2, borderRadius: 12, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  optionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  optionIndex: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionIndexText: { fontWeight: 'bold', fontSize: 12, color: '#FFFFFF' },
  optionInput: { flex: 1, fontSize: 14, marginRight: 8 },
  optionLabel: { fontSize: 14, marginRight: 8 },
  imageOptionRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  optionThumbnail: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  removeBtn: { fontSize: 24 },
  importBox: { padding: 20, borderRadius: 12, borderWidth: 2, marginTop: 16, marginBottom: 20 },
  importTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  importBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  importBtnText: { fontSize: 16, fontWeight: 'bold' },
  footer: { padding: 16, borderTopWidth: 1 },
  goBtn: { padding: 18, borderRadius: 12, alignItems: 'center' },
  goBtnText: { fontSize: 24, fontWeight: 'bold' },
});

// ============ SPIN SCREEN ============
function SpinScreen() {
  const { navigate, config, activeTheme, result, setResult } = useApp();
  const [spinning, setSpinning] = useState(false);

  const handleSpin = () => {
    if (spinning || config.options.length < 1) return;
    setSpinning(true);
    setResult(null);
  };

  const handleSpinEnd = (finalRotation: number) => {
    setSpinning(false);
    // Calculate which sector is at the top (where pointer points)
    const normalizedRotation = ((finalRotation % 360) + 360) % 360;
    const sectorAngle = 360 / TOTAL_SECTORS; // 30 degrees per sector
    // The wheel rotates clockwise. After rotation by X degrees:
    // - Sector i (originally at i*30 to (i+1)*30) is now at (i*30+X) to ((i+1)*30+X)
    // - The pointer at 0 degrees points to the sector that was originally at (360-X) degrees
    // - We need to find which sector contains angle (360 - normalizedRotation)
    const pointerAngle = (360 - normalizedRotation + 360) % 360;
    const winningIndex = Math.floor(pointerAngle / sectorAngle) % TOTAL_SECTORS;
    // Map the 12 sector index to the actual options (which may be fewer than 12)
    const winningOption = config.options[winningIndex % config.options.length];
    setResult({ option: winningOption, index: winningIndex % config.options.length });
  };

  const handleSpinAgain = () => {
    setResult(null);
    setTimeout(handleSpin, 100);
  };

  const handleReset = () => {
    setResult(null);
    navigate('Setup');
  };

  // Use theme-defined button colors
  const isClassic = activeTheme.id === 'classic';
  const isFresh = activeTheme.id === 'fresh';
  const isEmerald = activeTheme.id === 'emerald';
  const buttonBg = isClassic ? '#F38CA3' : isFresh ? '#5FB36A' : (activeTheme.buttonBg || activeTheme.accent);
  const buttonText = isEmerald ? '#8C1D18' : '#FFFFFF';
  // Theme specific back button
  const backBtnBg = isClassic ? '#FADADD' : isFresh ? '#5FB36A' : buttonBg;
  const backBtnText = isClassic ? '#A65C63' : isEmerald ? '#8C1D18' : '#FFFFFF';
  const backBtnBorder = isClassic ? '#F3A6B1' : isFresh ? '#5FB36A' : backBtnBg;
  const shadowColor = isClassic ? 'rgba(243,140,163,0.3)' : isFresh ? 'rgba(47, 94, 58, 0.25)' : '#000';

  const content = (
    <>
      <TouchableOpacity
        style={[
          spinStyles.backBtn,
          {
            backgroundColor: backBtnBg,
            borderColor: backBtnBorder,
            shadowColor: shadowColor,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: (isClassic || isFresh) ? 1 : 0.15,
            shadowRadius: 2,
            elevation: 2,
          },
        ]}
        onPress={() => navigate('Setup')}
      >
        <Text style={[spinStyles.backBtnText, { color: backBtnText }]}>← 返回</Text>
      </TouchableOpacity>

      <View style={spinStyles.titleBox}>
        <Text style={[spinStyles.title, { color: activeTheme.text }]}>{config.name}</Text>
        <View style={[spinStyles.titleLine, { backgroundColor: isClassic ? '#F3A6B1' : isFresh ? '#5FB36A' : activeTheme.accent }]} />
      </View>

      <View style={spinStyles.wheelBox}>
        <Wheel options={config.options} palette={activeTheme.palette} theme={activeTheme} isSpinning={spinning} onSpinEnd={handleSpinEnd} />
      </View>

      <View style={spinStyles.btnBox}>
        <TouchableOpacity
          style={[
            spinStyles.spinBtn,
            {
              backgroundColor: buttonBg,
              opacity: spinning ? 0.7 : 1,
              shadowColor: isClassic ? 'rgba(243,140,163,0.35)' : isFresh ? 'rgba(47, 94, 58, 0.3)' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: (isClassic || isFresh) ? 1 : 0.25,
              shadowRadius: 4,
              elevation: 4,
            },
          ]}
          onPress={handleSpin}
          disabled={spinning}
          activeOpacity={0.8}
        >
          <Text style={[spinStyles.spinBtnText, { color: buttonText }]}>
            {spinning ? '旋轉中...' : '開運旋轉'}
          </Text>
        </TouchableOpacity>
      </View>

      <ResultModal
        visible={!!result && !spinning}
        result={result}
        theme={activeTheme}
        customGreeting={config.customGreeting}
        onClose={() => setResult(null)}
        onSpinAgain={handleSpinAgain}
        onReset={handleReset}
      />
    </>
  );

  // Use gradient background for emerald theme
  if (activeTheme.gradientTop && activeTheme.gradientBottom) {
    return (
      <LinearGradient
        colors={[activeTheme.gradientTop, activeTheme.gradientBottom]}
        style={spinStyles.container}
      >
        <SafeAreaView style={spinStyles.safeArea}>
          {content}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={[spinStyles.container, { backgroundColor: activeTheme.bg }]}>
      {content}
    </SafeAreaView>
  );
}

const spinStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 60, left: 20, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, zIndex: 10 },
  backBtnText: { fontWeight: 'bold', fontSize: 14 },
  titleBox: { marginTop: 100, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  titleLine: { width: 60, height: 3, borderRadius: 2, marginTop: 8 },
  wheelBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnBox: { width: '100%', paddingHorizontal: 30, paddingBottom: 40 },
  spinBtn: { paddingVertical: 20, borderRadius: 12, alignItems: 'center' },
  spinBtnText: { fontSize: 28, fontWeight: 'bold' },
});

// ============ POKE SETUP SCREEN ============
function PokeSetupScreen() {
  const { navigate, pokeConfig, setPokeConfig, pokeTheme, setPokeTheme, addPokeOption, removePokeOption, updatePokeOption, savePokeConfig, setPokedCells } = useApp();

  const handleAddOption = () => {
    if (pokeConfig.options.length >= 50) {
      Alert.alert('已達上限', '最多只能新增 50 個選項');
      return;
    }
    const nextNumber = pokeConfig.options.length + 1;
    addPokeOption({ id: Date.now().toString(), type: 'text', content: `選項${nextNumber}` });
  };

  const handlePhotoImport = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('需要權限', '請允許存取相簿');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (result.canceled || !result.assets) return;
      const remaining = 50 - pokeConfig.options.length;
      const newOptions: Option[] = result.assets.slice(0, remaining).map((asset, i) => ({
        id: `img-${i}-${Date.now()}`,
        type: 'image',
        content: asset.uri,
        label: `相片 ${pokeConfig.options.length + i + 1}`,
      }));
      setPokeConfig(prev => ({ ...prev, options: [...prev.options, ...newOptions] }));
    } catch {
      Alert.alert('匯入失敗', '無法讀取相片');
    }
  };

  const handleGo = async () => {
    if (pokeConfig.options.length === 0) {
      Alert.alert('提示', '請先新增至少一個選項');
      return;
    }
    await savePokeConfig();
    setPokedCells([]); // Reset poked cells
    navigate('PokeGame');
  };

  // Theme specific styling
  const isClassic = pokeTheme.id === 'classic';
  const isFresh = pokeTheme.id === 'fresh';
  const cardBg = isClassic ? '#FFFFFF' : isFresh ? '#FFFFFF' : pokeTheme.palette[0];
  const headerBg = isClassic ? '#FADADD' : isFresh ? '#C9D6CC' : pokeTheme.bg;
  const closeBtnColor = isClassic ? '#A65C63' : isFresh ? '#2F5E3A' : pokeTheme.accent;
  const inputBorderColor = isClassic ? '#F3A6B1' : isFresh ? '#5FB36A' : pokeTheme.accent;
  const deleteBtnColor = isClassic ? '#E07A86' : isFresh ? '#5FB36A' : pokeTheme.accent;
  const inputBg = isClassic ? '#FFFFFF' : isFresh ? '#FFFFFF' : pokeTheme.bg;

  return (
    <SafeAreaView style={[pokeSetupStyles.container, { backgroundColor: pokeTheme.bg }]}>
      <View style={[pokeSetupStyles.card, { backgroundColor: cardBg, borderColor: pokeTheme.accent }]}>
        <View style={[pokeSetupStyles.header, { borderColor: pokeTheme.accent, backgroundColor: headerBg }]}>
          <Text style={[pokeSetupStyles.headerTitle, { color: pokeTheme.text }]}>戳戳樂製作</Text>
          <TouchableOpacity onPress={() => navigate('Home')}>
            <Text style={[pokeSetupStyles.closeBtn, { color: closeBtnColor }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={pokeSetupStyles.content} showsVerticalScrollIndicator={false}>
          <Text style={[pokeSetupStyles.label, { color: pokeTheme.label }]}>標題</Text>
          <View style={[pokeSetupStyles.inputWrapper, { backgroundColor: inputBg, borderColor: inputBorderColor }]}>
            <TextInput
              style={[pokeSetupStyles.inputInner, { color: pokeTheme.text }]}
              value={pokeConfig.name}
              onChangeText={text => setPokeConfig(prev => ({ ...prev, name: text }))}
              placeholder="輸入標題"
              placeholderTextColor={pokeTheme.label}
            />
          </View>

          <Text style={[pokeSetupStyles.label, { color: pokeTheme.label, marginTop: 16 }]}>中獎賀詞</Text>
          <View style={[pokeSetupStyles.inputWrapper, { backgroundColor: inputBg, borderColor: inputBorderColor }]}>
            <TextInput
              style={[pokeSetupStyles.inputInner, { color: pokeTheme.text }]}
              value={pokeConfig.customGreeting}
              onChangeText={text => setPokeConfig(prev => ({ ...prev, customGreeting: text }))}
              placeholder="恭喜獲獎"
              placeholderTextColor={isClassic ? '#6B4A4A' : isFresh ? '#2F5E3A' : pokeTheme.text}
            />
          </View>

          <Text style={[pokeSetupStyles.label, { color: pokeTheme.label, marginTop: 16 }]}>主題配色</Text>
          <View style={pokeSetupStyles.themeRow}>
            {(Object.keys(THEMES) as ThemeId[]).map(tid => (
              <TouchableOpacity
                key={tid}
                style={[
                  pokeSetupStyles.themeBtn,
                  { backgroundColor: THEMES[tid].bg, borderColor: pokeConfig.themeId === tid ? THEMES[tid].accent : 'transparent' },
                ]}
                onPress={() => setPokeTheme(tid)}
              >
                <Text style={[pokeSetupStyles.themeName, { color: THEMES[tid].text }]}>{THEMES[tid].name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={pokeSetupStyles.optionsHeader}>
            <Text style={[pokeSetupStyles.sectionTitle, { color: pokeTheme.text }]}>選項列表 ({pokeConfig.options.length})</Text>
            <View style={pokeSetupStyles.optionsBtnRow}>
              <TouchableOpacity
                style={[pokeSetupStyles.clearBtn, { borderColor: deleteBtnColor, opacity: pokeConfig.options.length === 0 ? 0.4 : 1 }]}
                onPress={() => pokeConfig.options.length > 0 && setPokeConfig(prev => ({ ...prev, options: [] }))}
                disabled={pokeConfig.options.length === 0}
              >
                <Text style={[pokeSetupStyles.clearBtnText, { color: deleteBtnColor }]}>清除</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[pokeSetupStyles.addBtn, { backgroundColor: pokeTheme.accent }]} onPress={handleAddOption}>
                <Text style={[pokeSetupStyles.addBtnText, { color: pokeTheme.buttonText || pokeTheme.bg }]}>+ 新增</Text>
              </TouchableOpacity>
            </View>
          </View>

          {pokeConfig.options.length === 0 ? (
            <View style={[pokeSetupStyles.emptyBox, { borderColor: pokeTheme.label }]}>
              <Text style={[pokeSetupStyles.emptyText, { color: pokeTheme.label }]}>目前沒有選項</Text>
            </View>
          ) : (
            pokeConfig.options.map((opt, i) => (
              <View key={opt.id} style={[pokeSetupStyles.optionItem, { backgroundColor: inputBg, borderColor: inputBorderColor }]}>
                <View style={[pokeSetupStyles.optionIndex, { backgroundColor: PASTEL_COLORS[i % 12] }]}>
                  <Text style={[pokeSetupStyles.optionIndexText, { color: '#FFFFFF' }]}>{i + 1}</Text>
                </View>
                {opt.type === 'text' ? (
                  <TextInput
                    style={[pokeSetupStyles.optionInput, { color: pokeTheme.text }]}
                    value={opt.content}
                    onChangeText={text => updatePokeOption(opt.id, text)}
                  />
                ) : (
                  <View style={pokeSetupStyles.imageOptionRow}>
                    <Image source={{ uri: opt.content }} style={pokeSetupStyles.optionThumbnail} />
                    <Text style={[pokeSetupStyles.optionLabel, { color: pokeTheme.text }]}>{opt.label || '相片'}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => removePokeOption(opt.id)}>
                  <Text style={[pokeSetupStyles.removeBtn, { color: deleteBtnColor }]}>×</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <View style={[pokeSetupStyles.importBox, { backgroundColor: inputBg, borderColor: inputBorderColor }]}>
            <TouchableOpacity style={pokeSetupStyles.importBtn} onPress={handlePhotoImport}>
              <Text style={[pokeSetupStyles.importBtnText, { color: isClassic ? '#A65C63' : isFresh ? '#5FB36A' : pokeTheme.accent }]}>📸 匯入相片</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={[pokeSetupStyles.footer, { borderColor: inputBorderColor, backgroundColor: headerBg }]}>
          <TouchableOpacity
            style={[
              pokeSetupStyles.goBtn,
              {
                backgroundColor: pokeTheme.buttonBg || pokeTheme.accent,
                opacity: pokeConfig.options.length === 0 ? 0.5 : 1,
              },
            ]}
            onPress={handleGo}
            disabled={pokeConfig.options.length === 0}
          >
            <Text style={[pokeSetupStyles.goBtnText, { color: pokeTheme.buttonText || '#FFFFFF' }]}>開始戳戳樂</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const pokeSetupStyles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { flex: 1, borderRadius: 16, borderWidth: 4, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { fontSize: 24, fontWeight: 'bold', padding: 4 },
  content: { flex: 1, padding: 16 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 2, paddingRight: 8 },
  inputInner: { flex: 1, padding: 14, fontSize: 16 },
  themeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  themeBtn: { flex: 1, paddingVertical: 14, paddingHorizontal: 6, borderRadius: 10, borderWidth: 3, alignItems: 'center' },
  themeName: { fontSize: 14, fontWeight: 'bold' },
  optionsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  optionsBtnRow: { flexDirection: 'row', gap: 8 },
  clearBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  clearBtnText: { fontWeight: 'bold', fontSize: 13 },
  addBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  addBtnText: { fontWeight: 'bold' },
  emptyBox: { padding: 30, borderWidth: 2, borderRadius: 12, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  optionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  optionIndex: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  optionIndexText: { fontWeight: 'bold', fontSize: 12, color: '#FFFFFF' },
  optionInput: { flex: 1, fontSize: 14, marginRight: 8 },
  optionLabel: { fontSize: 14, marginRight: 8 },
  imageOptionRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  optionThumbnail: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  removeBtn: { fontSize: 24 },
  importBox: { padding: 20, borderRadius: 12, borderWidth: 2, marginTop: 16, marginBottom: 20 },
  importBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  importBtnText: { fontSize: 16, fontWeight: 'bold' },
  footer: { padding: 16, borderTopWidth: 1 },
  goBtn: { padding: 18, borderRadius: 12, alignItems: 'center' },
  goBtnText: { fontSize: 24, fontWeight: 'bold' },
});

// ============ POKE GAME SCREEN ============
function PokeGameScreen() {
  const { navigate, pokeConfig, pokeTheme, pokedCells, setPokedCells, pokeResult, setPokeResult, savePokeConfig } = useApp();
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate optimal grid based on number of options
  const { rows: gridRows, cols: gridCols } = calculateOptimalGrid(
    pokeConfig.options.length,
    SCREEN_WIDTH,
    SCREEN_HEIGHT
  );
  const totalCells = pokeConfig.options.length;
  const remainingOptions = pokeConfig.options.filter(
    opt => !pokedCells.some(cell => cell.option.id === opt.id)
  );
  const allPoked = pokedCells.length >= totalCells;

  const handleCellPress = (cellIndex: number) => {
    if (isAnimating || pokedCells.some(c => c.cellIndex === cellIndex) || remainingOptions.length === 0) return;

    setIsAnimating(true);
    setSelectedCell(cellIndex);

    // Random select from remaining options
    const randomIndex = Math.floor(Math.random() * remainingOptions.length);
    const selectedOption = remainingOptions[randomIndex];

    // Delay to show animation
    setTimeout(() => {
      const newPokedCell: PokedCell = { cellIndex, option: selectedOption };
      setPokedCells(prev => [...prev, newPokedCell]);
      setPokeResult({ option: selectedOption, index: randomIndex });
      setIsAnimating(false);
      setSelectedCell(null);
    }, 500);
  };

  const handlePokeAgain = () => {
    setPokeResult(null);
  };

  const handleReset = () => {
    setPokeResult(null);
    setPokedCells([]);
    navigate('PokeSetup');
  };

  const handleRestart = () => {
    setPokeResult(null);
    setPokedCells([]);
  };

  const isClassic = pokeTheme.id === 'classic';
  const isFresh = pokeTheme.id === 'fresh';
  const isEmerald = pokeTheme.id === 'emerald';
  const buttonBg = isClassic ? '#F38CA3' : isFresh ? '#5FB36A' : (pokeTheme.buttonBg || pokeTheme.accent);
  const buttonText = isEmerald ? '#8C1D18' : '#FFFFFF';
  const backBtnBg = isClassic ? '#FADADD' : isFresh ? '#5FB36A' : buttonBg;
  const backBtnText = isClassic ? '#A65C63' : isEmerald ? '#8C1D18' : '#FFFFFF';

  // Calculate cell size to fit within screen (with padding and margins)
  const horizontalPadding = 40; // Total horizontal padding
  const verticalPadding = 280; // Space for header, title, subtitle, and bottom button
  const cellGap = 8; // Gap between cells

  const availableWidth = SCREEN_WIDTH - horizontalPadding - (cellGap * (gridCols - 1));
  const availableHeight = SCREEN_HEIGHT - verticalPadding - (cellGap * (gridRows - 1));

  const maxCellWidth = availableWidth / gridCols;
  const maxCellHeight = availableHeight / gridRows;

  // Use the smaller of the two to ensure grid fits
  const cellSize = Math.min(maxCellWidth, maxCellHeight, 100); // Cap at 100 max

  const renderCell = (index: number) => {
    const pokedCell = pokedCells.find(c => c.cellIndex === index);
    const isPoked = !!pokedCell;
    const isSelected = selectedCell === index;

    const borderRadius = Math.max(cellSize * 0.15, 8);

    return (
      <TouchableOpacity
        key={index}
        style={[
          pokeGameStyles.cell,
          {
            width: cellSize,
            height: cellSize,
            borderRadius: borderRadius,
            backgroundColor: isPoked ? '#FFFFFF' : pokeTheme.accent,
            borderColor: isPoked ? pokeTheme.accent : pokeTheme.palette[0],
            transform: [{ scale: isSelected ? 0.9 : 1 }],
          },
        ]}
        onPress={() => handleCellPress(index)}
        disabled={isPoked || isAnimating || remainingOptions.length === 0}
        activeOpacity={0.7}
      >
        {isPoked ? (
          pokedCell.option.type === 'text' ? (
            <Text style={[pokeGameStyles.cellText, { color: pokeTheme.text, fontSize: Math.max(cellSize * 0.22, 12) }]} numberOfLines={2}>
              {pokedCell.option.content}
            </Text>
          ) : (
            <Image source={{ uri: pokedCell.option.content }} style={[pokeGameStyles.cellImage, { width: cellSize - 12, height: cellSize - 12, borderRadius: (cellSize - 12) / 2 }]} />
          )
        ) : (
          <Text style={[pokeGameStyles.cellQuestion, { fontSize: Math.max(cellSize * 0.4, 16) }]}>?</Text>
        )}
      </TouchableOpacity>
    );
  };

  const content = (
    <>
      <TouchableOpacity
        style={[pokeGameStyles.backBtn, { backgroundColor: backBtnBg, borderColor: backBtnBg }]}
        onPress={() => navigate('PokeSetup')}
      >
        <Text style={[pokeGameStyles.backBtnText, { color: backBtnText }]}>← 返回</Text>
      </TouchableOpacity>

      <View style={pokeGameStyles.titleBox}>
        <Text style={[pokeGameStyles.title, { color: pokeTheme.text }]}>{pokeConfig.name}</Text>
        <View style={[pokeGameStyles.titleLine, { backgroundColor: pokeTheme.accent }]} />
        <Text style={[pokeGameStyles.subtitle, { color: pokeTheme.label }]}>
          剩餘 {remainingOptions.length} / {pokeConfig.options.length}
        </Text>
      </View>

      <View style={pokeGameStyles.gridContainer}>
        {Array.from({ length: gridRows }, (_, row) => {
          // Calculate how many cells to show in this row
          const startIndex = row * gridCols;
          const cellsInRow = Math.min(gridCols, totalCells - startIndex);
          if (cellsInRow <= 0) return null;
          return (
            <View key={row} style={pokeGameStyles.gridRow}>
              {Array.from({ length: cellsInRow }, (_, col) => renderCell(startIndex + col))}
            </View>
          );
        })}
      </View>

      {allPoked && (
        <View style={pokeGameStyles.btnBox}>
          <TouchableOpacity
            style={[pokeGameStyles.restartBtn, { backgroundColor: buttonBg }]}
            onPress={handleRestart}
          >
            <Text style={[pokeGameStyles.restartBtnText, { color: buttonText }]}>重新開始</Text>
          </TouchableOpacity>
        </View>
      )}

      <ResultModal
        visible={!!pokeResult}
        result={pokeResult}
        theme={pokeTheme}
        customGreeting={pokeConfig.customGreeting}
        onClose={() => setPokeResult(null)}
        onSpinAgain={handlePokeAgain}
        onReset={handleReset}
      />
    </>
  );

  if (pokeTheme.gradientTop && pokeTheme.gradientBottom) {
    return (
      <LinearGradient
        colors={[pokeTheme.gradientTop, pokeTheme.gradientBottom]}
        style={pokeGameStyles.container}
      >
        <SafeAreaView style={pokeGameStyles.safeArea}>
          {content}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={[pokeGameStyles.container, { backgroundColor: pokeTheme.bg }]}>
      {content}
    </SafeAreaView>
  );
}

const pokeGameStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center' },
  safeArea: { flex: 1, width: '100%', alignItems: 'center' },
  backBtn: { position: 'absolute', top: 60, left: 20, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, zIndex: 10 },
  backBtnText: { fontWeight: 'bold', fontSize: 14 },
  titleBox: { marginTop: 100, alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  titleLine: { width: 60, height: 3, borderRadius: 2, marginTop: 8 },
  subtitle: { marginTop: 12, fontSize: 16 },
  gridContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gridRow: { flexDirection: 'row', gap: 8 },
  cell: { margin: 4, borderWidth: 3, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  cellQuestion: { fontWeight: 'bold', color: '#FFFFFF' },
  cellText: { fontWeight: 'bold', textAlign: 'center', padding: 4 },
  cellImage: { borderRadius: 8 },
  btnBox: { width: '100%', paddingHorizontal: 30, paddingBottom: 40 },
  restartBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  restartBtnText: { fontSize: 22, fontWeight: 'bold' },
});

// ============ MAIN APP ============
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Home');
  // Wheel state
  const [config, setConfig] = useState<WheelConfig>(DEFAULT_CONFIG);
  const [result, setResult] = useState<SpinResult | null>(null);
  // Poke state
  const [pokeConfig, setPokeConfig] = useState<PokeConfig>(DEFAULT_POKE_CONFIG);
  const [pokedCells, setPokedCells] = useState<PokedCell[]>([]);
  const [pokeResult, setPokeResult] = useState<SpinResult | null>(null);

  const activeTheme = THEMES[config.themeId];
  const pokeTheme = THEMES[pokeConfig.themeId];

  useEffect(() => {
    loadConfig();
    loadPokeConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setConfig(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load config:', e);
    }
  };

  const loadPokeConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem(POKE_STORAGE_KEY);
      if (stored) setPokeConfig(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load poke config:', e);
    }
  };

  const saveConfig = async () => {
    try {
      const updated = { ...config, updatedAt: Date.now() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setConfig(updated);
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  };

  const savePokeConfig = async () => {
    try {
      const updated = { ...pokeConfig, updatedAt: Date.now() };
      await AsyncStorage.setItem(POKE_STORAGE_KEY, JSON.stringify(updated));
      setPokeConfig(updated);
    } catch (e) {
      console.error('Failed to save poke config:', e);
    }
  };

  const navigate = (screen: ScreenName) => setCurrentScreen(screen);

  // Wheel functions
  const setTheme = (id: ThemeId) => {
    setConfig(prev => ({ ...prev, themeId: id }));
    setPokeConfig(prev => ({ ...prev, themeId: id })); // Sync with poke theme
  };
  const addOption = (opt: Option) => {
    if (config.options.length >= 12) return;
    setConfig(prev => ({ ...prev, options: [...prev.options, opt] }));
  };
  const removeOption = (id: string) => setConfig(prev => ({ ...prev, options: prev.options.filter(o => o.id !== id) }));
  const updateOption = (id: string, content: string) => setConfig(prev => ({
    ...prev,
    options: prev.options.map(o => o.id === id ? { ...o, content } : o),
  }));

  // Poke functions
  const setPokeTheme = (id: ThemeId) => {
    setPokeConfig(prev => ({ ...prev, themeId: id }));
    setConfig(prev => ({ ...prev, themeId: id })); // Sync with wheel theme
  };
  const addPokeOption = (opt: Option) => {
    if (pokeConfig.options.length >= 50) return;
    setPokeConfig(prev => ({ ...prev, options: [...prev.options, opt] }));
  };
  const removePokeOption = (id: string) => setPokeConfig(prev => ({ ...prev, options: prev.options.filter(o => o.id !== id) }));
  const updatePokeOption = (id: string, content: string) => setPokeConfig(prev => ({
    ...prev,
    options: prev.options.map(o => o.id === id ? { ...o, content } : o),
  }));

  const contextValue: AppContextType = {
    currentScreen,
    navigate,
    config,
    setConfig,
    activeTheme,
    setTheme,
    addOption,
    removeOption,
    updateOption,
    saveConfig,
    result,
    setResult,
    pokeConfig,
    setPokeConfig,
    pokeTheme,
    setPokeTheme,
    addPokeOption,
    removePokeOption,
    updatePokeOption,
    savePokeConfig,
    pokedCells,
    setPokedCells,
    pokeResult,
    setPokeResult,
  };

  return (
    <SafeAreaProvider>
      <AppContext.Provider value={contextValue}>
        {currentScreen === 'Home' && <HomeScreen />}
        {currentScreen === 'Setup' && <SetupScreen />}
        {currentScreen === 'Spin' && <SpinScreen />}
        {currentScreen === 'PokeSetup' && <PokeSetupScreen />}
        {currentScreen === 'PokeGame' && <PokeGameScreen />}
      </AppContext.Provider>
    </SafeAreaProvider>
  );
}
