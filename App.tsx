import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert as RNAlert,
  Animated,
  Easing,
  Modal,
  Image,
  Dimensions,
  Platform,
  useWindowDimensions,
} from 'react-native';

// Cross-platform Alert for Web compatibility
const Alert = {
  alert: (title: string, message?: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}${message ? '\n\n' + message : ''}`);
    } else {
      RNAlert.alert(title, message);
    }
  }
};
import Svg, { Path, Circle, G, Text as SvgText, Ellipse, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

// Traditional-style cute horse icon (年畫風格小馬)
function HorseIcon({ size = 80 }: { size?: number }) {
  const scale = size / 100;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G transform={`scale(${1})`}>
        {/* Body - cream colored */}
        <Ellipse cx="50" cy="58" rx="28" ry="22" fill="#F5E6D3" />
        {/* Belly highlight */}
        <Ellipse cx="50" cy="62" rx="20" ry="14" fill="#FFF8F0" />

        {/* Back legs */}
        <Path d="M35 72 L32 90 Q32 94 36 94 L40 94 Q44 94 44 90 L41 72" fill="#F5E6D3" />
        <Path d="M59 72 L56 90 Q56 94 60 94 L64 94 Q68 94 68 90 L65 72" fill="#F5E6D3" />
        {/* Hooves */}
        <Rect x="32" y="90" width="12" height="6" rx="2" fill="#D4A574" />
        <Rect x="56" y="90" width="12" height="6" rx="2" fill="#D4A574" />

        {/* Saddle/blanket - red with pattern */}
        <Path d="M30 50 Q50 42 70 50 L68 65 Q50 58 32 65 Z" fill="#E85A4F" />
        <Path d="M35 52 Q50 46 65 52 L64 60 Q50 55 36 60 Z" fill="#C94A3F" />
        {/* Saddle decoration dots */}
        <Circle cx="42" cy="55" r="2" fill="#FFD700" />
        <Circle cx="50" cy="53" r="2" fill="#FFD700" />
        <Circle cx="58" cy="55" r="2" fill="#FFD700" />

        {/* Neck */}
        <Path d="M65 48 Q72 35 68 22 Q65 18 58 20 Q52 25 55 45" fill="#F5E6D3" />

        {/* Head */}
        <Ellipse cx="62" cy="20" rx="14" ry="12" fill="#F5E6D3" />
        {/* Face highlight */}
        <Ellipse cx="60" cy="22" rx="8" ry="7" fill="#FFF8F0" />

        {/* Ear */}
        <Path d="M68 8 Q72 4 74 10 Q72 14 68 12 Z" fill="#F5E6D3" />
        <Path d="M70 9 Q72 7 73 10 Q72 12 70 11 Z" fill="#FFB6A3" />

        {/* Eye */}
        <Circle cx="58" cy="18" r="3" fill="#4A3728" />
        <Circle cx="57" cy="17" r="1" fill="#FFFFFF" />

        {/* Nostril */}
        <Circle cx="52" cy="24" r="1.5" fill="#D4A574" />

        {/* Mane - flowing red/orange */}
        <Path d="M68 12 Q78 15 75 25 Q72 22 68 24" fill="#E85A4F" />
        <Path d="M66 14 Q74 20 70 30 Q67 26 65 28" fill="#C94A3F" />
        <Path d="M64 18 Q70 28 65 38 Q62 32 60 35" fill="#E85A4F" />

        {/* Tail - flowing */}
        <Path d="M22 55 Q10 50 8 60 Q6 70 15 75 Q20 70 22 65" fill="#E85A4F" />
        <Path d="M22 58 Q14 55 12 62 Q10 68 18 72 Q20 68 22 65" fill="#C94A3F" />

        {/* Ribbon on neck */}
        <Path d="M58 35 Q62 33 66 35 Q64 40 60 38 Q56 40 54 35 Q56 33 58 35" fill="#E85A4F" />
        <Circle cx="60" cy="36" r="3" fill="#FFD700" />
      </G>
    </Svg>
  );
}
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { createShare, createShareWithResult, loadShare, getShareUrl, SharedConfig, SharedResult, GameType } from './src/services/share';
import { shareContent } from './src/services/nativeShare';
import { captureRef } from 'react-native-view-shot';
import * as Linking from 'expo-linking';

// ============ TYPES ============
type ScreenName = 'Home' | 'Setup' | 'Spin' | 'PokeSetup' | 'PokeGame';
type ThemeId = 'classic' | 'pink' | 'fresh';
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
  classic: {
    id: 'classic',
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
  pink: {
    id: 'pink',
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
  themeId: 'classic',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

const DEFAULT_POKE_CONFIG: PokeConfig = {
  id: 'default-poke',
  name: 'LUCKY抽 • 戳戳樂',
  customGreeting: '',
  options: [],
  themeId: 'classic',
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
  // Share state
  isSharing: boolean;
  shareUrl: string | null;
  shareModalVisible: boolean;
  setShareModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  handleShare: (type: GameType) => Promise<void>;
  isSharedMode: boolean;
  // Result sharing (Entry Point 2)
  isResultSharing: boolean;
  handleShareResult: (type: GameType, result: SpinResult) => Promise<void>;
  // Shared result data
  sharedResultData: SharedResult | null;
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
  size?: number; // Dynamic size for responsive design
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

function Wheel({ options, palette, theme, isSpinning, onSpinEnd, size: propSize }: WheelProps) {
  const rotationAnim = React.useRef(new Animated.Value(0)).current;
  const currentRotation = React.useRef(0);

  // Use dynamic size or default
  const wheelSize = propSize || SIZE;
  const wheelCenter = wheelSize / 2;
  const wheelRadius = wheelSize / 2 - 3;

  useEffect(() => {
    if (isSpinning) {
      const fullSpins = (7 + Math.floor(Math.random() * 5)) * 360;
      const landingOffset = Math.floor(Math.random() * 360);
      const targetRotation = currentRotation.current + fullSpins + landingOffset;

      Animated.timing(rotationAnim, {
        toValue: targetRotation,
        duration: 5000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
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

  // Scale factor for responsive sizing
  const scale = wheelSize / SIZE;

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
    const textRadius = wheelRadius * 0.58;
    const imageRadius = wheelRadius * 0.76;
    const contentAngleRad = (midAngle - 90) * Math.PI / 180;
    const textX = wheelCenter + textRadius * Math.cos(contentAngleRad);
    const textY = wheelCenter + textRadius * Math.sin(contentAngleRad);
    const imageX = wheelCenter + imageRadius * Math.cos(contentAngleRad);
    const imageY = wheelCenter + imageRadius * Math.sin(contentAngleRad);
    // Text rotation: read from center outward (subtract 90 to align along radius)
    const textRotation = midAngle - 90;
    // Dynamic text: show full text, adjust font size based on length
    const textContent = opt.type === 'text' ? opt.content : '';
    const textLength = textContent.length;
    // Dynamic font size: 1-2 chars = 20, 3-4 chars = 16, 5+ chars = 13, scaled
    const baseFontSize = textLength <= 2 ? 20 : textLength <= 4 ? 16 : 13;
    const fontSize = Math.round(baseFontSize * scale);

    return {
      path: createPieSlice(wheelCenter, wheelCenter, wheelRadius, startAngle, endAngle),
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

  const CENTER_RADIUS = Math.round(38 * scale);
  const imageSize = Math.round(60 * scale);
  const textContainerWidth = Math.round(70 * scale);

  return (
    <View style={wheelStyles.container}>
      {/* Rotating Wheel */}
      <Animated.View style={[wheelStyles.wheelWrapper, { width: wheelSize + 12, height: wheelSize + 12, transform: [{ rotate: spin }] }]}>
        <View style={[wheelStyles.wheelBorder, { width: wheelSize + 6, height: wheelSize + 6, borderRadius: (wheelSize + 6) / 2 }]}>
          <Svg width={wheelSize} height={wheelSize} viewBox={`0 0 ${wheelSize} ${wheelSize}`}>
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
                    left: sector.imageX - imageSize / 2,
                    top: sector.imageY - imageSize / 2,
                    width: imageSize,
                    height: imageSize,
                    borderRadius: imageSize / 2,
                    borderColor: theme.id === 'classic' ? '#E6B65C' : (theme.id === 'fresh' ? '#5FB36A' : (theme.id === 'pink' ? '#F3A6B1' : '#FFFFFF')),
                    borderWidth: (theme.id === 'classic' || theme.id === 'fresh' || theme.id === 'pink') ? 3 : 2,
                  },
                ]}
              />
            ) : (
              <View
                key={`text-${i}`}
                style={[
                  wheelStyles.sectorTextContainer,
                  {
                    left: sector.textX - textContainerWidth / 2,
                    top: sector.textY - 10,
                    width: textContainerWidth,
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
            fill={theme.id === 'classic' ? '#FAF6EE' : '#FFFFFF'}
            stroke={theme.id === 'classic' ? '#E6B65C' : (theme.id === 'fresh' ? '#5FB36A' : (theme.id === 'pink' ? '#F3A6B1' : '#E0E0E0'))}
            strokeWidth={theme.id === 'classic' || theme.id === 'fresh' || theme.id === 'pink' ? 2 : 1}
          />
          <Circle
            cx={CENTER_RADIUS + 20}
            cy={CENTER_RADIUS + 20}
            r={CENTER_RADIUS - 4}
            fill={theme.id === 'classic' ? '#FAF6EE' : '#FFFFFF'}
            stroke={theme.id === 'classic' ? '#E6B65C' : (theme.id === 'fresh' ? '#5FB36A' : (theme.id === 'pink' ? '#F3A6B1' : '#E0E0E0'))}
            strokeWidth={1}
          />
          {/* Pointer notch extending OUTWARD from center circle at top */}
          <Path
            d={`M ${CENTER_RADIUS + 20 - 10 * scale} ${20 + 2} L ${CENTER_RADIUS + 20} ${20 - 18 * scale} L ${CENTER_RADIUS + 20 + 10 * scale} ${20 + 2} Z`}
            fill={theme.id === 'classic' ? '#FAF6EE' : '#FFFFFF'}
            stroke={theme.id === 'classic' ? '#E6B65C' : (theme.id === 'fresh' ? '#5FB36A' : (theme.id === 'pink' ? '#F3A6B1' : '#E0E0E0'))}
            strokeWidth={theme.id === 'classic' || theme.id === 'fresh' || theme.id === 'pink' ? 2 : 1}
          />
        </Svg>
        <View style={[wheelStyles.centerTextContainer, { width: Math.round(60 * scale), height: Math.round(60 * scale), borderRadius: Math.round(30 * scale) }]}>
          <Text style={[wheelStyles.centerText, { fontSize: Math.round(26 * scale), color: theme.id === 'classic' ? '#8C1D18' : (theme.id === 'fresh' ? '#2F5E3A' : (theme.id === 'pink' ? '#F38CA3' : '#C41E3A')) }]}>抽</Text>
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
  // Entry Point 2: Result sharing
  onShareResult?: () => void;
  isShareLoading?: boolean;
  configName?: string;
}

// Firework particle component - larger and more visible
function FireworkParticle({ delay, startX, startY, color, size = 12 }: { delay: number; startX: number; startY: number; color: string; size?: number }) {
  const animValue = React.useRef(new Animated.Value(0)).current;
  const angle = React.useRef(Math.random() * Math.PI * 2).current;
  const distance = React.useRef(80 + Math.random() * 120).current;
  const endX = startX + Math.cos(angle) * distance;
  const endY = startY + Math.sin(angle) * distance;

  React.useEffect(() => {
    const runAnimation = () => {
      animValue.setValue(0);
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(animValue, {
          toValue: 1,
          duration: 1200 + Math.random() * 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => {
        // Loop the animation
        setTimeout(runAnimation, Math.random() * 500);
      });
    };
    runAnimation();
  }, []);

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, endX],
  });
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, endY + 50], // More gravity effect
  });
  const opacity = animValue.interpolate({
    inputRange: [0, 0.2, 0.8, 1],
    outputRange: [0, 1, 0.8, 0],
  });
  const scale = animValue.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0.3, 1.2, 0.4],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX }, { translateY }, { scale }],
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      }}
    />
  );
}

// Fireworks overlay component - more bursts and continuous animation
function FireworksOverlay() {
  const colors = ['#FF4444', '#FFD700', '#FF69B4', '#00FF88', '#44DDFF', '#FF8844', '#DD44FF', '#88FF44'];
  const { width, height } = useWindowDimensions();
  const [key, setKey] = React.useState(0);

  // Regenerate particles periodically for continuous effect
  React.useEffect(() => {
    const interval = setInterval(() => {
      setKey(k => k + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Generate multiple firework bursts - more bursts and particles
  const bursts = React.useMemo(() => {
    const result = [];
    for (let burst = 0; burst < 8; burst++) {
      const burstX = (width * 0.1) + Math.random() * (width * 0.8);
      const burstY = (height * 0.05) + Math.random() * (height * 0.5);
      const burstDelay = burst * 250;
      const burstColor = colors[burst % colors.length];

      // More particles per burst
      for (let i = 0; i < 18; i++) {
        const particleSize = 8 + Math.random() * 10;
        result.push({
          id: `${key}-${burst}-${i}`,
          delay: burstDelay + Math.random() * 150,
          startX: burstX,
          startY: burstY,
          color: burstColor,
          size: particleSize,
        });
      }
    }
    return result;
  }, [width, height, key]);

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {bursts.map((particle) => (
        <FireworkParticle
          key={particle.id}
          delay={particle.delay}
          startX={particle.startX}
          startY={particle.startY}
          color={particle.color}
          size={particle.size}
        />
      ))}
    </View>
  );
}

function ResultModal({ visible, result, theme, customGreeting, onClose, onSpinAgain, onReset, againButtonText = '再來一次', onShareResult, isShareLoading, configName }: ResultModalProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  if (!result) return null;

  const displayHeader = customGreeting ? `🎊 ${customGreeting} 🎊` : '🎊 恭喜獲獎 🎊';
  const isClassic = theme.id === 'classic'; // 喜氣
  const isPink = theme.id === 'pink'; // 粉春
  const isFresh = theme.id === 'fresh'; // 清新

  // Responsive sizing
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;
  const cardMaxWidth = isDesktop ? 500 : windowWidth - 40;
  const imageSize = isDesktop ? 220 : Math.min(180, windowWidth - 120);

  // Theme specific colors
  const overlayBg = isPink ? 'rgba(90, 60, 65, 0.55)' : isFresh ? 'rgba(47, 94, 58, 0.45)' : 'rgba(0,0,0,0.9)';
  const cardBg = isPink ? '#FADADD' : isFresh ? '#C9D6CC' : theme.palette[0];
  const cardBorder = isPink ? '#F3A6B1' : isFresh ? '#5FB36A' : theme.accent;
  const headerColor = isPink ? '#E77B94' : isFresh ? '#2F5E3A' : '#FFFFFF';
  const resultTextColor = isClassic ? '#8C1D18' : theme.text;
  const resultBoxBorder = isPink ? '#F3A6B1' : isFresh ? '#5FB36A' : theme.accent;
  const resultBoxShadow = (isPink || isFresh) ? {
    shadowColor: isPink ? 'rgba(243,140,163,0.25)' : 'rgba(47, 94, 58, 0.2)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  } : {};
  const primaryBtnBg = isPink ? '#F38CA3' : isFresh ? '#5FB36A' : theme.accent;
  const primaryBtnText = isClassic ? '#8C1D18' : '#FFFFFF';
  const primaryBtnShadow = (isPink || isFresh) ? {
    shadowColor: isPink ? 'rgba(243,140,163,0.35)' : 'rgba(47, 94, 58, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  } : {};
  const secondaryBtnBg = isPink ? '#FADADD' : isFresh ? '#8FAE96' : isClassic ? '#6F1612' : '#333333';
  const secondaryBtnText = isPink ? '#6B4A4A' : '#FFFFFF';
  const secondaryBtnBorder = isPink ? '#F3A6B1' : 'transparent';
  const cardShadow = (isPink || isFresh) ? {
    shadowColor: isPink ? 'rgba(90, 60, 65, 0.3)' : 'rgba(47, 94, 58, 0.25)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  } : {};
  const cardRadius = (isPink || isFresh) ? 20 : 16;
  const cardBorderWidth = (isPink || isFresh) ? 2 : 6;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[modalStyles.overlay, { backgroundColor: overlayBg }]}>
        <View style={[modalStyles.card, { backgroundColor: cardBg, borderColor: cardBorder, borderRadius: cardRadius, borderWidth: cardBorderWidth, maxWidth: cardMaxWidth }, cardShadow]}>
          <Text style={[modalStyles.header, { color: headerColor, fontSize: isDesktop ? 28 : 24 }]}>{displayHeader}</Text>
          <View style={[modalStyles.resultBox, { backgroundColor: '#FFFFFF', borderColor: resultBoxBorder, padding: isDesktop ? 40 : 30 }, resultBoxShadow]}>
            {result.option.type === 'text' ? (
              <Text style={[modalStyles.resultText, { color: resultTextColor, fontSize: isDesktop ? 56 : 48 }]}>{result.option.content}</Text>
            ) : (
              <View>
                <Image
                  source={{ uri: result.option.content }}
                  style={[
                    modalStyles.resultImage,
                    {
                      borderColor: resultBoxBorder,
                      width: imageSize,
                      height: imageSize,
                      borderRadius: imageSize / 2,
                    }
                  ]}
                />
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
          {onShareResult && (
            <TouchableOpacity
              style={[
                modalStyles.shareResultBtn,
                {
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  borderColor: primaryBtnBg,
                  opacity: isShareLoading ? 0.6 : 1,
                }
              ]}
              onPress={onShareResult}
              disabled={isShareLoading}
            >
              <Text style={[modalStyles.shareResultBtnText, { color: primaryBtnBg }]}>
                {isShareLoading ? '分享中...' : '分享結果'}
              </Text>
            </TouchableOpacity>
          )}
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

        {/* Fireworks animation - on top of everything */}
        <FireworksOverlay />
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
  shareResultBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  shareResultBtnText: { fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  secondaryBtnText: { fontSize: 16, fontWeight: 'bold', color: '#fef3c7' },
});

// ============ HOME SCREEN ============
function HomeScreen() {
  const { navigate, activeTheme } = useApp();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isClassic = activeTheme.id === 'classic';
  const isFresh = activeTheme.id === 'fresh';

  // Responsive design - larger on desktop
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;

  // For classic theme, use the new Year of Horse design
  if (isClassic) {
    const horseBoxSize = isDesktop ? 130 : 110;
    const yearFontSize = 42;
    const titleFontSize = 40;
    const subtitleFontSize = isDesktop ? 16 : 14;
    const btnFontSize = isDesktop ? 20 : 18;
    const cardPadH = isDesktop ? 60 : 40;
    const cardPadV = isDesktop ? 50 : 40;

    return (
      <SafeAreaView style={[homeStyles.container, { backgroundColor: '#8C1D18' }]}>
        <View style={[homeStyles.classicCard, { paddingHorizontal: cardPadH, paddingVertical: cardPadV }]}>
          {/* Year Display: 二○二六 - both 二 in gold, ○ bold, 六 normal */}
          <View style={homeStyles.yearRow}>
            <Text style={[homeStyles.yearGold, { fontSize: yearFontSize }]}>二</Text>
            <Text style={[homeStyles.yearZero, { fontSize: yearFontSize }]}>○</Text>
            <Text style={[homeStyles.yearGold, { fontSize: yearFontSize }]}>二</Text>
            <Text style={[homeStyles.yearCream, { fontSize: yearFontSize }]}>六</Text>
          </View>

          {/* Main Title - cream white, no extra spacing */}
          <Text style={[homeStyles.classicTitle, { fontSize: titleFontSize }]}>開運LUCKY抽</Text>

          {/* Subtitle - Trajan Pro font */}
          <Text style={[homeStyles.classicSubtitle, { fontSize: subtitleFontSize }]}>Year of the Horse</Text>

          {/* Horse Icon */}
          <View style={[homeStyles.horseBox, { width: horseBoxSize, height: horseBoxSize, borderRadius: horseBoxSize / 2 }]}>
            <Image source={require('./assets/horse-icon.png')} style={{ width: horseBoxSize * 0.375, height: horseBoxSize * 0.375 }} resizeMode="contain" />
          </View>

          {/* Two Buttons Row */}
          <View style={homeStyles.classicBtnRow}>
            <TouchableOpacity
              style={homeStyles.classicBtn}
              onPress={() => navigate('Setup')}
              activeOpacity={0.8}
            >
              <Text style={homeStyles.classicBtnEmoji}>🎡</Text>
              <Text style={[homeStyles.classicBtnText, { fontSize: btnFontSize }]}>輪盤製作</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={homeStyles.classicBtn}
              onPress={() => navigate('PokeSetup')}
              activeOpacity={0.8}
            >
              <Text style={homeStyles.classicBtnEmoji}>🎯</Text>
              <Text style={[homeStyles.classicBtnText, { fontSize: btnFontSize }]}>戳戳樂</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Non-classic themes (pink/fresh) - similar layout to classic
  const horseBoxSize = isDesktop ? 130 : 110;
  const yearFontSize = 42;
  const titleFontSize = 40;
  const subtitleFontSize = isDesktop ? 16 : 14;
  const btnFontSize = isDesktop ? 20 : 18;
  const cardPadH = isDesktop ? 60 : 40;
  const cardPadV = isDesktop ? 50 : 40;

  // Theme colors based on THEMES definition
  const isPink = activeTheme.id === 'pink';
  const bgColor = isPink ? '#FFF1F3' : '#EEF6EE';
  const cardBgColor = isPink ? '#FFF6F7' : '#FFFFFF';
  const borderColor = isPink ? '#F3A6B1' : '#5FB36A';
  const goldColor = isPink ? '#F38CA3' : '#5FB36A';
  const creamColor = isPink ? '#6B4A4A' : '#2F5E3A';
  const btnBgColor = isPink ? '#F38CA3' : '#5FB36A';
  const btnTextColor = '#FFFFFF';

  return (
    <SafeAreaView style={[homeStyles.container, { backgroundColor: bgColor }]}>
      <View style={[homeStyles.classicCard, { backgroundColor: cardBgColor, borderColor: borderColor, paddingHorizontal: cardPadH, paddingVertical: cardPadV }]}>
        {/* Year Display: 二○二六 */}
        <View style={homeStyles.yearRow}>
          <Text style={[homeStyles.yearGold, { fontSize: yearFontSize, color: goldColor }]}>二</Text>
          <Text style={[homeStyles.yearZero, { fontSize: yearFontSize, color: creamColor }]}>○</Text>
          <Text style={[homeStyles.yearGold, { fontSize: yearFontSize, color: goldColor }]}>二</Text>
          <Text style={[homeStyles.yearCream, { fontSize: yearFontSize, color: creamColor }]}>六</Text>
        </View>

        {/* Main Title */}
        <Text style={[homeStyles.classicTitle, { fontSize: titleFontSize, color: creamColor }]}>開運LUCKY抽</Text>

        {/* Subtitle */}
        <Text style={[homeStyles.classicSubtitle, { fontSize: subtitleFontSize, color: goldColor }]}>Year of the Horse</Text>

        {/* Horse Icon */}
        <View style={[homeStyles.horseBox, { width: horseBoxSize, height: horseBoxSize, borderRadius: horseBoxSize / 2, borderColor: borderColor }]}>
          <Image source={require('./assets/horse-icon.png')} style={{ width: horseBoxSize * 0.375, height: horseBoxSize * 0.375 }} resizeMode="contain" />
        </View>

        {/* Two Buttons Row */}
        <View style={homeStyles.classicBtnRow}>
          <TouchableOpacity
            style={[homeStyles.classicBtn, { backgroundColor: btnBgColor }]}
            onPress={() => navigate('Setup')}
            activeOpacity={0.8}
          >
            <Text style={homeStyles.classicBtnEmoji}>🎡</Text>
            <Text style={[homeStyles.classicBtnText, { fontSize: btnFontSize, color: btnTextColor }]}>輪盤製作</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[homeStyles.classicBtn, { backgroundColor: btnBgColor }]}
            onPress={() => navigate('PokeSetup')}
            activeOpacity={0.8}
          >
            <Text style={homeStyles.classicBtnEmoji}>🎯</Text>
            <Text style={[homeStyles.classicBtnText, { fontSize: btnFontSize, color: btnTextColor }]}>戳戳樂</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const homeStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  // Classic theme styles (Year of Horse design)
  classicCard: {
    backgroundColor: '#6F1612',
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#E6B65C',
    alignItems: 'center',
    marginHorizontal: 20,
    width: '94%',
    maxWidth: 480,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  yearGold: {
    color: '#E6B65C',
    fontWeight: 'bold',
    letterSpacing: 10,
  },
  yearCream: {
    color: '#FAF6EE',
    fontWeight: 'normal',
    letterSpacing: 10,
  },
  yearZero: {
    color: '#FAF6EE',
    fontWeight: 'bold',
    letterSpacing: 10,
  },
  classicTitle: {
    color: '#FAF6EE',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 1,
  },
  classicSubtitle: {
    color: '#E6B65C',
    letterSpacing: 5,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    fontWeight: 'normal',
    fontFamily: 'Roboto, sans-serif',
  },
  horseBox: {
    borderWidth: 2,
    borderColor: '#E6B65C',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 24,
  },
  classicBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  classicBtn: {
    flex: 1,
    backgroundColor: '#E6B65C',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  classicBtnEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  classicBtnText: {
    color: '#7A1616',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Original theme styles
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
  const { width: windowWidth } = useWindowDimensions();

  // Responsive design - wider layout on desktop with left/right split
  const isDesktop = Platform.OS === 'web' && windowWidth > 900;
  const maxCardWidth = isDesktop ? 900 : windowWidth - 32;

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
      // Skip permission request on Web
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('需要權限', '請允許存取相簿');
          return;
        }
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

  const handleCSVImport = async () => {
    if (Platform.OS === 'web') {
      // Web: use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.txt';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const lines = text.split(/[\r\n]+/).filter((line: string) => line.trim());
          const remaining = 12 - config.options.length;
          const newOptions: Option[] = lines.slice(0, remaining).map((line: string, i: number) => ({
            id: `csv-${i}-${Date.now()}`,
            type: 'text',
            content: line.trim(),
          }));
          if (newOptions.length > 0) {
            setConfig(prev => ({ ...prev, options: [...prev.options, ...newOptions] }));
            Alert.alert('匯入成功', `已匯入 ${newOptions.length} 個選項`);
          }
        } catch {
          Alert.alert('匯入失敗', '無法讀取檔案');
        }
      };
      input.click();
    } else {
      // Native: use document picker
      try {
        const DocumentPicker = require('expo-document-picker');
        const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/plain'] });
        if (result.canceled || !result.assets?.[0]) return;
        const FileSystem = require('expo-file-system');
        const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const lines = text.split(/[\r\n]+/).filter((line: string) => line.trim());
        const remaining = 12 - config.options.length;
        const newOptions: Option[] = lines.slice(0, remaining).map((line: string, i: number) => ({
          id: `csv-${i}-${Date.now()}`,
          type: 'text',
          content: line.trim(),
        }));
        if (newOptions.length > 0) {
          setConfig(prev => ({ ...prev, options: [...prev.options, ...newOptions] }));
          Alert.alert('匯入成功', `已匯入 ${newOptions.length} 個選項`);
        }
      } catch {
        Alert.alert('匯入失敗', '無法讀取檔案');
      }
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
  const isClassic = activeTheme.id === 'classic'; // 喜氣
  const isPink = activeTheme.id === 'pink'; // 粉春
  const isFresh = activeTheme.id === 'fresh'; // 清新
  const cardBg = isPink ? '#FFFFFF' : isFresh ? '#FFFFFF' : activeTheme.palette[0];
  const headerBg = isPink ? '#FADADD' : isFresh ? '#C9D6CC' : activeTheme.bg;
  const closeBtnColor = isPink ? '#A65C63' : isFresh ? '#2F5E3A' : activeTheme.accent;
  const inputBorderColor = isPink ? '#F3A6B1' : isFresh ? '#5FB36A' : activeTheme.accent;
  const deleteBtnColor = isPink ? '#E07A86' : isFresh ? '#5FB36A' : activeTheme.accent;
  const inputBg = isPink ? '#FFFFFF' : isFresh ? '#FFFFFF' : activeTheme.bg;

  // Right panel content (settings and import buttons)
  const rightPanelContent = (
    <>
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
          placeholderTextColor={isPink ? '#6B4A4A' : isFresh ? '#2F5E3A' : activeTheme.text}
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

      <TouchableOpacity style={[setupStyles.addBtnLarge, { backgroundColor: activeTheme.accent, marginTop: 20 }]} onPress={handleAddOption}>
        <Text style={[setupStyles.addBtnText, { color: activeTheme.buttonText || activeTheme.bg }]}>+ 新增選項</Text>
      </TouchableOpacity>

      {/* Photo Import Box */}
      <View style={[setupStyles.importBox, { backgroundColor: inputBg, borderColor: inputBorderColor, marginTop: 16 }]}>
        <TouchableOpacity style={setupStyles.importBtn} onPress={handlePhotoImport}>
          <Text style={[setupStyles.importBtnText, { color: isPink ? '#A65C63' : isFresh ? '#5FB36A' : activeTheme.accent }]}>📸 匯入相片</Text>
        </TouchableOpacity>
      </View>

      {/* CSV Import Box */}
      <View style={[setupStyles.importBox, { backgroundColor: inputBg, borderColor: inputBorderColor, marginTop: 12 }]}>
        <TouchableOpacity style={setupStyles.importBtn} onPress={handleCSVImport}>
          <Text style={[setupStyles.importBtnText, { color: isPink ? '#A65C63' : isFresh ? '#5FB36A' : activeTheme.accent }]}>📄 匯入 CSV 名單</Text>
        </TouchableOpacity>
        <Text style={[setupStyles.importHint, { color: activeTheme.label }]}>每行一個選項</Text>
      </View>
    </>
  );

  // Left panel content (options list)
  const leftPanelContent = (
    <>
      <View style={setupStyles.optionsHeader}>
        <Text style={[setupStyles.sectionTitle, { color: activeTheme.text }]}>選項列表 ({config.options.length}/12)</Text>
        <TouchableOpacity
          style={[setupStyles.clearBtn, { borderColor: deleteBtnColor, opacity: config.options.length === 0 ? 0.4 : 1 }]}
          onPress={() => config.options.length > 0 && setConfig(prev => ({ ...prev, options: [] }))}
          disabled={config.options.length === 0}
        >
          <Text style={[setupStyles.clearBtnText, { color: deleteBtnColor }]}>清除</Text>
        </TouchableOpacity>
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
    </>
  );

  // Mobile layout (single column)
  if (!isDesktop) {
    return (
      <SafeAreaView style={[setupStyles.container, { backgroundColor: activeTheme.bg }]}>
        <View style={[setupStyles.card, { backgroundColor: cardBg, borderColor: activeTheme.accent, maxWidth: 480, width: '100%' }]}>
          <View style={[setupStyles.header, { borderColor: activeTheme.accent, backgroundColor: headerBg }]}>
            <Text style={[setupStyles.headerTitle, { color: activeTheme.text }]}>輪盤製作</Text>
            <TouchableOpacity onPress={async () => { await saveConfig(); navigate('Home'); }}>
              <Text style={[setupStyles.closeBtn, { color: closeBtnColor }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={setupStyles.content} showsVerticalScrollIndicator={false}>
            {rightPanelContent}
            <View style={{ marginTop: 20 }}>{leftPanelContent}</View>
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

  // Desktop layout (left/right split)
  return (
    <SafeAreaView style={[setupStyles.container, { backgroundColor: activeTheme.bg }]}>
      <View style={[setupStyles.card, { backgroundColor: cardBg, borderColor: activeTheme.accent, maxWidth: maxCardWidth, width: '100%' }]}>
        <View style={[setupStyles.header, { borderColor: activeTheme.accent, backgroundColor: headerBg }]}>
          <Text style={[setupStyles.headerTitle, { color: activeTheme.text }]}>輪盤製作</Text>
          <TouchableOpacity onPress={async () => { await saveConfig(); navigate('Home'); }}>
            <Text style={[setupStyles.closeBtn, { color: closeBtnColor }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={setupStyles.splitContainer}>
          {/* Left panel - options list */}
          <ScrollView style={setupStyles.leftPanel} showsVerticalScrollIndicator={false}>
            {leftPanelContent}
          </ScrollView>

          {/* Right panel - settings and import */}
          <ScrollView style={[setupStyles.rightPanel, { borderColor: inputBorderColor }]} showsVerticalScrollIndicator={false}>
            {rightPanelContent}
          </ScrollView>
        </View>

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
  container: { flex: 1, padding: 16, alignItems: 'center' },
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
  importTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  importBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  importBtnText: { fontSize: 16, fontWeight: 'bold' },
  importHint: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  footer: { padding: 16, borderTopWidth: 1 },
  goBtn: { padding: 18, borderRadius: 12, alignItems: 'center' },
  goBtnText: { fontSize: 24, fontWeight: 'bold' },
  // Desktop split layout styles
  splitContainer: { flex: 1, flexDirection: 'row' },
  leftPanel: { flex: 1, padding: 16, paddingRight: 8 },
  rightPanel: { width: 320, padding: 16, paddingLeft: 8, borderLeftWidth: 1 },
  addBtnLarge: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center' },
});

// ============ SPIN SCREEN ============
function SpinScreen() {
  const { navigate, config, activeTheme, result, setResult, isSharing, handleShare, isResultSharing, handleShareResult } = useApp();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [spinning, setSpinning] = useState(false);

  // Calculate optimal wheel size for current screen - maximize wheel size
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;
  const maxWheelWidth = windowWidth - 40; // Less padding on sides
  const maxWheelHeight = windowHeight - 220; // Less space reserved for title and button
  const optimalWheelSize = Math.min(maxWheelWidth, maxWheelHeight, isDesktop ? 700 : 450);

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
  const isClassic = activeTheme.id === 'classic'; // 喜氣
  const isPink = activeTheme.id === 'pink'; // 粉春
  const isFresh = activeTheme.id === 'fresh'; // 清新
  const buttonBg = isPink ? '#F38CA3' : isFresh ? '#5FB36A' : (activeTheme.buttonBg || activeTheme.accent);
  const buttonText = isClassic ? '#8C1D18' : '#FFFFFF';
  // Theme specific back button
  const backBtnBg = isPink ? '#FADADD' : isFresh ? '#5FB36A' : buttonBg;
  const backBtnText = isPink ? '#A65C63' : isClassic ? '#8C1D18' : '#FFFFFF';
  const backBtnBorder = isPink ? '#F3A6B1' : isFresh ? '#5FB36A' : backBtnBg;
  const shadowColor = isPink ? 'rgba(243,140,163,0.3)' : isFresh ? 'rgba(47, 94, 58, 0.25)' : '#000';

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

      <TouchableOpacity
        style={[
          spinStyles.shareBtn,
          {
            backgroundColor: 'transparent',
            borderColor: activeTheme.accent,
            borderWidth: 2,
            opacity: isSharing ? 0.5 : 1,
          },
        ]}
        onPress={() => handleShare('wheel')}
        disabled={isSharing}
      >
        <Text style={[spinStyles.shareBtnText, { color: activeTheme.text }]}>
          {isSharing ? '分享中...' : '分享'}
        </Text>
      </TouchableOpacity>

      <View style={spinStyles.titleBox}>
        <Text style={[spinStyles.title, { color: activeTheme.text }]}>{config.name}</Text>
        <View style={[spinStyles.titleLine, { backgroundColor: isPink ? '#F3A6B1' : isFresh ? '#5FB36A' : activeTheme.accent }]} />
      </View>

      <View style={spinStyles.wheelBox}>
        <Wheel options={config.options} palette={activeTheme.palette} theme={activeTheme} isSpinning={spinning} onSpinEnd={handleSpinEnd} size={optimalWheelSize} />
      </View>

      <View style={spinStyles.btnBox}>
        <TouchableOpacity
          style={[
            spinStyles.spinBtn,
            {
              backgroundColor: buttonBg,
              opacity: spinning ? 0.7 : 1,
              shadowColor: isPink ? 'rgba(243,140,163,0.35)' : isFresh ? 'rgba(47, 94, 58, 0.3)' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: (isPink || isFresh) ? 1 : 0.25,
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
        onShareResult={result ? () => handleShareResult('wheel', result) : undefined}
        isShareLoading={isResultSharing}
        configName={config.name}
      />
    </>
  );

  // Use gradient background for classic (喜氣) theme
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
  backBtn: { position: 'absolute', top: 50, left: 20, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, zIndex: 10 },
  backBtnText: { fontWeight: 'bold', fontSize: 14 },
  shareBtn: { position: 'absolute', top: 50, right: 20, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, zIndex: 10 },
  shareBtnText: { fontWeight: 'bold', fontSize: 14 },
  titleBox: { marginTop: 50, alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  titleLine: { width: 50, height: 3, borderRadius: 2, marginTop: 6 },
  wheelBox: { alignItems: 'center', marginBottom: 20 },
  btnBox: { width: '100%', paddingHorizontal: 50, paddingBottom: 30, maxWidth: 400 },
  spinBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  spinBtnText: { fontSize: 22, fontWeight: 'bold' },
});

// ============ POKE SETUP SCREEN ============
function PokeSetupScreen() {
  const { navigate, pokeConfig, setPokeConfig, pokeTheme, setPokeTheme, addPokeOption, removePokeOption, updatePokeOption, savePokeConfig, setPokedCells } = useApp();
  const { width: windowWidth } = useWindowDimensions();

  // Responsive design - wider layout on desktop with left/right split
  const isDesktop = Platform.OS === 'web' && windowWidth > 900;
  const maxCardWidth = isDesktop ? 900 : windowWidth - 32;

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
      // Skip permission request on Web
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('需要權限', '請允許存取相簿');
          return;
        }
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

  const handleCSVImport = async () => {
    if (Platform.OS === 'web') {
      // Web: use file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.csv,.txt';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const lines = text.split(/[\r\n]+/).filter((line: string) => line.trim());
          const remaining = 50 - pokeConfig.options.length;
          const newOptions: Option[] = lines.slice(0, remaining).map((line: string, i: number) => ({
            id: `csv-${i}-${Date.now()}`,
            type: 'text',
            content: line.trim(),
          }));
          if (newOptions.length > 0) {
            setPokeConfig(prev => ({ ...prev, options: [...prev.options, ...newOptions] }));
            Alert.alert('匯入成功', `已匯入 ${newOptions.length} 個選項`);
          }
        } catch {
          Alert.alert('匯入失敗', '無法讀取檔案');
        }
      };
      input.click();
    } else {
      // Native: use document picker
      try {
        const DocumentPicker = require('expo-document-picker');
        const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/plain'] });
        if (result.canceled || !result.assets?.[0]) return;
        const FileSystem = require('expo-file-system');
        const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const lines = text.split(/[\r\n]+/).filter((line: string) => line.trim());
        const remaining = 50 - pokeConfig.options.length;
        const newOptions: Option[] = lines.slice(0, remaining).map((line: string, i: number) => ({
          id: `csv-${i}-${Date.now()}`,
          type: 'text',
          content: line.trim(),
        }));
        if (newOptions.length > 0) {
          setPokeConfig(prev => ({ ...prev, options: [...prev.options, ...newOptions] }));
          Alert.alert('匯入成功', `已匯入 ${newOptions.length} 個選項`);
        }
      } catch {
        Alert.alert('匯入失敗', '無法讀取檔案');
      }
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
  const isClassic = pokeTheme.id === 'classic'; // 喜氣
  const isPink = pokeTheme.id === 'pink'; // 粉春
  const isFresh = pokeTheme.id === 'fresh'; // 清新
  const cardBg = isPink ? '#FFFFFF' : isFresh ? '#FFFFFF' : pokeTheme.palette[0];
  const headerBg = isPink ? '#FADADD' : isFresh ? '#C9D6CC' : pokeTheme.bg;
  const closeBtnColor = isPink ? '#A65C63' : isFresh ? '#2F5E3A' : pokeTheme.accent;
  const inputBorderColor = isPink ? '#F3A6B1' : isFresh ? '#5FB36A' : pokeTheme.accent;
  const deleteBtnColor = isPink ? '#E07A86' : isFresh ? '#5FB36A' : pokeTheme.accent;
  const inputBg = isPink ? '#FFFFFF' : isFresh ? '#FFFFFF' : pokeTheme.bg;

  // Right panel content (settings and import buttons)
  const rightPanelContent = (
    <>
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
          placeholderTextColor={isPink ? '#6B4A4A' : isFresh ? '#2F5E3A' : pokeTheme.text}
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

      {/* Photo Import Box */}
      <View style={[pokeSetupStyles.importBox, { backgroundColor: inputBg, borderColor: inputBorderColor, marginTop: 20 }]}>
        <Text style={[pokeSetupStyles.importTitle, { color: pokeTheme.text }]}>從相簿匯入</Text>
        <TouchableOpacity style={pokeSetupStyles.importBtn} onPress={handlePhotoImport}>
          <Text style={[pokeSetupStyles.importBtnText, { color: isPink ? '#A65C63' : isFresh ? '#5FB36A' : pokeTheme.accent }]}>📸 匯入相片</Text>
        </TouchableOpacity>
      </View>

      {/* CSV Import Box */}
      <View style={[pokeSetupStyles.importBox, { backgroundColor: inputBg, borderColor: inputBorderColor, marginTop: 12 }]}>
        <Text style={[pokeSetupStyles.importTitle, { color: pokeTheme.text }]}>從檔案匯入</Text>
        <TouchableOpacity style={pokeSetupStyles.importBtn} onPress={handleCSVImport}>
          <Text style={[pokeSetupStyles.importBtnText, { color: isPink ? '#A65C63' : isFresh ? '#5FB36A' : pokeTheme.accent }]}>📄 匯入 CSV 名單</Text>
        </TouchableOpacity>
        <Text style={[pokeSetupStyles.importHint, { color: pokeTheme.label }]}>每行一個選項</Text>
      </View>

      <TouchableOpacity style={[pokeSetupStyles.addBtnLarge, { backgroundColor: pokeTheme.accent, marginTop: 16 }]} onPress={handleAddOption}>
        <Text style={[pokeSetupStyles.addBtnText, { color: pokeTheme.buttonText || pokeTheme.bg }]}>+ 新增選項</Text>
      </TouchableOpacity>
    </>
  );

  // Left panel content (options list)
  const leftPanelContent = (
    <>
      <View style={pokeSetupStyles.optionsHeader}>
        <Text style={[pokeSetupStyles.sectionTitle, { color: pokeTheme.text }]}>選項列表 ({pokeConfig.options.length})</Text>
        <TouchableOpacity
          style={[pokeSetupStyles.clearBtn, { borderColor: deleteBtnColor, opacity: pokeConfig.options.length === 0 ? 0.4 : 1 }]}
          onPress={() => pokeConfig.options.length > 0 && setPokeConfig(prev => ({ ...prev, options: [] }))}
          disabled={pokeConfig.options.length === 0}
        >
          <Text style={[pokeSetupStyles.clearBtnText, { color: deleteBtnColor }]}>清除</Text>
        </TouchableOpacity>
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
    </>
  );

  // Mobile layout (single column)
  if (!isDesktop) {
    return (
      <SafeAreaView style={[pokeSetupStyles.container, { backgroundColor: pokeTheme.bg }]}>
        <View style={[pokeSetupStyles.card, { backgroundColor: cardBg, borderColor: pokeTheme.accent, maxWidth: 480, width: '100%' }]}>
          <View style={[pokeSetupStyles.header, { borderColor: pokeTheme.accent, backgroundColor: headerBg }]}>
            <Text style={[pokeSetupStyles.headerTitle, { color: pokeTheme.text }]}>戳戳樂製作</Text>
            <TouchableOpacity onPress={async () => { await savePokeConfig(); navigate('Home'); }}>
              <Text style={[pokeSetupStyles.closeBtn, { color: closeBtnColor }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={pokeSetupStyles.content} showsVerticalScrollIndicator={false}>
            {rightPanelContent}
            <View style={{ marginTop: 20 }}>{leftPanelContent}</View>
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

  // Desktop layout (left/right split)
  return (
    <SafeAreaView style={[pokeSetupStyles.container, { backgroundColor: pokeTheme.bg }]}>
      <View style={[pokeSetupStyles.card, { backgroundColor: cardBg, borderColor: pokeTheme.accent, maxWidth: maxCardWidth, width: '100%' }]}>
        <View style={[pokeSetupStyles.header, { borderColor: pokeTheme.accent, backgroundColor: headerBg }]}>
          <Text style={[pokeSetupStyles.headerTitle, { color: pokeTheme.text }]}>戳戳樂製作</Text>
          <TouchableOpacity onPress={async () => { await savePokeConfig(); navigate('Home'); }}>
            <Text style={[pokeSetupStyles.closeBtn, { color: closeBtnColor }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={pokeSetupStyles.splitContainer}>
          {/* Left panel - options list */}
          <ScrollView style={pokeSetupStyles.leftPanel} showsVerticalScrollIndicator={false}>
            {leftPanelContent}
          </ScrollView>

          {/* Right panel - settings and import */}
          <ScrollView style={[pokeSetupStyles.rightPanel, { borderColor: inputBorderColor }]} showsVerticalScrollIndicator={false}>
            {rightPanelContent}
          </ScrollView>
        </View>

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
  container: { flex: 1, padding: 16, alignItems: 'center' },
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
  importTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  importBtn: { padding: 14, borderRadius: 12, alignItems: 'center' },
  importBtnText: { fontSize: 16, fontWeight: 'bold' },
  importHint: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  footer: { padding: 16, borderTopWidth: 1 },
  goBtn: { padding: 18, borderRadius: 12, alignItems: 'center' },
  goBtnText: { fontSize: 24, fontWeight: 'bold' },
  // Desktop split layout styles
  splitContainer: { flex: 1, flexDirection: 'row' },
  leftPanel: { flex: 1, padding: 16, paddingRight: 8 },
  rightPanel: { width: 320, padding: 16, paddingLeft: 8, borderLeftWidth: 1 },
  addBtnLarge: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 10, alignItems: 'center' },
});

// ============ POKE GAME SCREEN ============
function PokeGameScreen() {
  const { navigate, pokeConfig, pokeTheme, pokedCells, setPokedCells, pokeResult, setPokeResult, savePokeConfig, isSharing, handleShare, isResultSharing, handleShareResult } = useApp();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Responsive design
  const isDesktop = Platform.OS === 'web' && windowWidth > 768;

  // Calculate optimal grid based on number of options
  const { rows: gridRows, cols: gridCols } = calculateOptimalGrid(
    pokeConfig.options.length,
    windowWidth,
    windowHeight
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

  const isClassic = pokeTheme.id === 'classic'; // 喜氣
  const isPink = pokeTheme.id === 'pink'; // 粉春
  const isFresh = pokeTheme.id === 'fresh'; // 清新
  const buttonBg = isPink ? '#F38CA3' : isFresh ? '#5FB36A' : (pokeTheme.buttonBg || pokeTheme.accent);
  const buttonText = isClassic ? '#8C1D18' : '#FFFFFF';
  const backBtnBg = isPink ? '#FADADD' : isFresh ? '#5FB36A' : buttonBg;
  const backBtnText = isPink ? '#A65C63' : isClassic ? '#8C1D18' : '#FFFFFF';

  // Calculate cell size to fit within screen (with padding and margins)
  const horizontalPadding = isDesktop ? 80 : 40; // More padding on desktop
  const verticalPadding = 280; // Space for header, title, subtitle, and bottom button
  const cellGap = isDesktop ? 12 : 8; // Larger gap on desktop

  const availableWidth = windowWidth - horizontalPadding - (cellGap * (gridCols - 1));
  const availableHeight = windowHeight - verticalPadding - (cellGap * (gridRows - 1));

  const maxCellWidth = availableWidth / gridCols;
  const maxCellHeight = availableHeight / gridRows;

  // Use the smaller of the two to ensure grid fits - larger max on desktop
  const maxCellSize = isDesktop ? 150 : 100;
  const cellSize = Math.min(maxCellWidth, maxCellHeight, maxCellSize);

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

      <TouchableOpacity
        style={[
          pokeGameStyles.shareBtn,
          {
            backgroundColor: 'transparent',
            borderColor: pokeTheme.accent,
            borderWidth: 2,
            opacity: isSharing ? 0.5 : 1,
          },
        ]}
        onPress={() => handleShare('poke')}
        disabled={isSharing}
      >
        <Text style={[pokeGameStyles.shareBtnText, { color: pokeTheme.text }]}>
          {isSharing ? '分享中...' : '分享'}
        </Text>
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
        onShareResult={pokeResult ? () => handleShareResult('poke', pokeResult) : undefined}
        isShareLoading={isResultSharing}
        configName={pokeConfig.name}
        againButtonText="再戳一次"
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
  shareBtn: { position: 'absolute', top: 60, right: 20, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, zIndex: 10 },
  shareBtnText: { fontWeight: 'bold', fontSize: 14 },
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

// ============ SHARE MODAL ============
interface ShareModalProps {
  visible: boolean;
  shareUrl: string | null;
  onClose: () => void;
  theme: Theme;
}

function ShareModal({ visible, shareUrl, onClose, theme }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // For native, you might need expo-clipboard
        Alert.alert('複製連結', shareUrl);
      }
    } catch (e) {
      console.error('Failed to copy:', e);
      Alert.alert('複製失敗', '請手動複製連結');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={shareModalStyles.overlay}>
        <View style={[shareModalStyles.container, { backgroundColor: theme.bg, borderColor: theme.accent }]}>
          <Text style={[shareModalStyles.title, { color: theme.text }]}>分享成功！</Text>
          <Text style={[shareModalStyles.subtitle, { color: theme.text }]}>複製以下連結分享給朋友</Text>

          <View style={[shareModalStyles.urlBox, { backgroundColor: theme.id === 'classic' ? '#6F1612' : 'rgba(0,0,0,0.1)', borderColor: theme.accent }]}>
            <Text style={[shareModalStyles.urlText, { color: theme.text }]} numberOfLines={2} selectable>
              {shareUrl}
            </Text>
          </View>

          <TouchableOpacity
            style={[shareModalStyles.copyBtn, { backgroundColor: theme.accent }]}
            onPress={handleCopy}
          >
            <Text style={[shareModalStyles.copyBtnText, { color: theme.buttonText || '#FFFFFF' }]}>
              {copied ? '已複製！' : '複製連結'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={shareModalStyles.closeBtn} onPress={onClose}>
            <Text style={[shareModalStyles.closeBtnText, { color: theme.text }]}>關閉</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const shareModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 3,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    opacity: 0.8,
  },
  urlBox: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
  },
  urlText: {
    fontSize: 14,
    textAlign: 'center',
  },
  copyBtn: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  copyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 12,
  },
  closeBtnText: {
    fontSize: 16,
    opacity: 0.7,
  },
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
  // Share state
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [isLoadingShare, setIsLoadingShare] = useState(false);
  const [isSharedMode, setIsSharedMode] = useState(false);
  // Result sharing (Entry Point 2)
  const [isResultSharing, setIsResultSharing] = useState(false);
  const [sharedResultData, setSharedResultData] = useState<SharedResult | null>(null);

  const activeTheme = THEMES[config.themeId];
  const pokeTheme = THEMES[pokeConfig.themeId];

  // Helper function to load shared config by ID
  const loadSharedConfig = async (shareId: string) => {
    setIsLoadingShare(true);
    try {
      console.log('[DeepLink] Loading share:', shareId);
      const sharedConfig = await loadShare(shareId);
      if (sharedConfig) {
        setIsSharedMode(true);

        // Check if this is a result share
        if (sharedConfig.sharedResult) {
          setSharedResultData(sharedConfig.sharedResult);
        }

        if (sharedConfig.type === 'wheel') {
          setConfig({
            id: sharedConfig.id,
            name: sharedConfig.name,
            customGreeting: sharedConfig.customGreeting,
            options: sharedConfig.options,
            themeId: sharedConfig.themeId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });

          // If result share, set result to show modal immediately
          if (sharedConfig.sharedResult) {
            const resultOption = sharedConfig.options.find(
              o => o.id === sharedConfig.sharedResult?.optionId
            ) || {
              id: sharedConfig.sharedResult.optionId,
              type: sharedConfig.sharedResult.optionType,
              content: sharedConfig.sharedResult.optionContent,
              label: sharedConfig.sharedResult.optionLabel,
            };
            setResult({
              option: resultOption,
              index: 0,
            });
          }
          setCurrentScreen('Spin');
        } else {
          setPokeConfig({
            id: sharedConfig.id,
            name: sharedConfig.name,
            customGreeting: sharedConfig.customGreeting,
            options: sharedConfig.options,
            themeId: sharedConfig.themeId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
          setPokedCells([]);

          // If result share, set result to show modal immediately
          if (sharedConfig.sharedResult) {
            const resultOption = sharedConfig.options.find(
              o => o.id === sharedConfig.sharedResult?.optionId
            ) || {
              id: sharedConfig.sharedResult.optionId,
              type: sharedConfig.sharedResult.optionType,
              content: sharedConfig.sharedResult.optionContent,
              label: sharedConfig.sharedResult.optionLabel,
            };
            setPokeResult({
              option: resultOption,
              index: 0,
            });
          }
          setCurrentScreen('PokeGame');
        }
        console.log('[DeepLink] Share loaded successfully');
      } else {
        Alert.alert('載入失敗', '找不到分享的內容');
      }
    } catch (e) {
      console.error('[DeepLink] Failed to load shared config:', e);
      Alert.alert('載入失敗', '無法載入分享的內容');
    }
    setIsLoadingShare(false);
  };

  // Extract share ID from URL
  const extractShareId = (url: string): string | null => {
    try {
      // Handle various URL formats:
      // - https://qman-roulette-app.vercel.app/s/xxx
      // - luckydraw://s/xxx
      // - ?share=xxx
      const urlObj = new URL(url);

      // Check query parameter
      const shareParam = urlObj.searchParams.get('share');
      if (shareParam) return shareParam;

      // Check path format /s/xxx
      const pathMatch = urlObj.pathname.match(/\/s\/([a-zA-Z0-9]+)/);
      if (pathMatch) return pathMatch[1];

      return null;
    } catch {
      // Try simple regex match for custom scheme
      const match = url.match(/\/s\/([a-zA-Z0-9]+)/);
      return match ? match[1] : null;
    }
  };

  // Check for share URL parameter on mount (Web + Mobile)
  useEffect(() => {
    const checkShareParam = async () => {
      let shareId: string | null = null;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Web: Check URL parameters
        const params = new URLSearchParams(window.location.search);
        shareId = params.get('share');

        // Also check path format /s/xxx
        if (!shareId) {
          const pathMatch = window.location.pathname.match(/^\/s\/([a-zA-Z0-9]+)$/);
          if (pathMatch) {
            shareId = pathMatch[1];
          }
        }

        // Clear URL after extracting
        if (shareId) {
          window.history.replaceState({}, '', '/');
        }
      } else {
        // Mobile: Check initial URL (Deep Link)
        try {
          const initialUrl = await Linking.getInitialURL();
          console.log('[DeepLink] Initial URL:', initialUrl);
          if (initialUrl) {
            shareId = extractShareId(initialUrl);
          }
        } catch (e) {
          console.error('[DeepLink] Error getting initial URL:', e);
        }
      }

      if (shareId) {
        await loadSharedConfig(shareId);
      }
    };

    checkShareParam();
  }, []);

  // Listen for Deep Links while app is running (Mobile)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = Linking.addEventListener('url', async (event) => {
      console.log('[DeepLink] Received URL:', event.url);
      const shareId = extractShareId(event.url);
      if (shareId) {
        await loadSharedConfig(shareId);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

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

  // Use a ref to always have the latest config for saving
  const configRef = React.useRef(config);
  React.useEffect(() => {
    configRef.current = config;
  }, [config]);

  const saveConfig = async () => {
    try {
      const currentConfig = configRef.current;
      const updated = { ...currentConfig, updatedAt: Date.now() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setConfig(updated);
    } catch (e) {
      console.error('Failed to save config:', e);
    }
  };

  // Use a ref to always have the latest pokeConfig for saving
  const pokeConfigRef = React.useRef(pokeConfig);
  React.useEffect(() => {
    pokeConfigRef.current = pokeConfig;
  }, [pokeConfig]);

  const savePokeConfig = async () => {
    try {
      const currentConfig = pokeConfigRef.current;
      const updated = { ...currentConfig, updatedAt: Date.now() };
      await AsyncStorage.setItem(POKE_STORAGE_KEY, JSON.stringify(updated));
      setPokeConfig(updated);
    } catch (e) {
      console.error('Failed to save poke config:', e);
    }
  };

  const navigate = (screen: ScreenName) => setCurrentScreen(screen);

  // Wheel functions
  const setTheme = async (id: ThemeId) => {
    const currentConfig = configRef.current;
    const newConfig = { ...currentConfig, themeId: id, updatedAt: Date.now() };
    setConfig(newConfig);
    configRef.current = newConfig; // Update ref immediately
    setPokeConfig(prev => ({ ...prev, themeId: id })); // Sync with poke theme
    // Save immediately when theme changes
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
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
  const setPokeTheme = async (id: ThemeId) => {
    const currentPokeConfig = pokeConfigRef.current;
    const currentConfig = configRef.current;
    const newPokeConfig = { ...currentPokeConfig, themeId: id, updatedAt: Date.now() };
    const newConfig = { ...currentConfig, themeId: id, updatedAt: Date.now() };
    setPokeConfig(newPokeConfig);
    setConfig(newConfig);
    pokeConfigRef.current = newPokeConfig;
    configRef.current = newConfig;
    // Save both immediately
    try {
      await AsyncStorage.setItem(POKE_STORAGE_KEY, JSON.stringify(newPokeConfig));
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
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

  // Share function (Entry Point 1: Link Share)
  const handleShare = async (type: GameType) => {
    const configToShare = type === 'wheel' ? config : pokeConfig;
    if (configToShare.options.length === 0) {
      Alert.alert('無法分享', '請先新增至少一個選項');
      return;
    }

    setIsSharing(true);
    try {
      console.log('[Share] Creating share for:', configToShare.name);
      const shareId = await createShare(
        {
          name: configToShare.name,
          customGreeting: configToShare.customGreeting,
          options: configToShare.options,
          themeId: configToShare.themeId,
        },
        type
      );
      console.log('[Share] Share created with ID:', shareId);
      const url = getShareUrl(shareId);
      console.log('[Share] Share URL:', url);

      // Try native share first
      const shareMessage = `來玩玩看吧! ${configToShare.name}`;
      try {
        const shared = await shareContent({
          message: shareMessage,
          url: url,
          title: 'LUCKY抽',
        });
        console.log('[Share] Native share result:', shared);

        // If native share not available or cancelled, show modal as fallback
        if (!shared) {
          setShareUrl(url);
          setShareModalVisible(true);
        }
      } catch (shareError) {
        // Native share failed, show modal as fallback
        console.log('[Share] Native share failed, showing modal:', shareError);
        setShareUrl(url);
        setShareModalVisible(true);
      }
    } catch (e: any) {
      console.error('[Share] Failed to create share:', e);
      console.error('[Share] Error details:', e?.message, e?.code);
      Alert.alert('分享失敗', `無法建立分享連結：${e?.message || '請稍後再試'}`);
    }
    setIsSharing(false);
  };

  // Result share function (Entry Point 2: Result Image Share)
  const handleShareResult = async (type: GameType, resultData: SpinResult) => {
    const configToShare = type === 'wheel' ? config : pokeConfig;
    if (configToShare.options.length === 0) {
      Alert.alert('無法分享', '請先新增至少一個選項');
      return;
    }

    setIsResultSharing(true);
    try {
      console.log('[ResultShare] Creating result share for:', configToShare.name);
      // Create SharedResult from SpinResult
      const sharedResult: SharedResult = {
        optionId: resultData.option.id,
        optionContent: resultData.option.content,
        optionType: resultData.option.type,
        optionLabel: resultData.option.label,
        timestamp: Date.now(),
      };

      // Create share with result
      const shareId = await createShareWithResult(
        {
          name: configToShare.name,
          customGreeting: configToShare.customGreeting,
          options: configToShare.options,
          themeId: configToShare.themeId,
        },
        type,
        sharedResult
      );
      console.log('[ResultShare] Share created with ID:', shareId);
      const url = getShareUrl(shareId);
      console.log('[ResultShare] Share URL:', url);

      // Share message with result
      const resultText = resultData.option.type === 'text'
        ? resultData.option.content
        : (resultData.option.label || '神秘獎品');
      const shareMessage = `我在「${configToShare.name}」抽到了「${resultText}」！\n來玩玩看吧!`;

      try {
        const shared = await shareContent({
          message: shareMessage,
          url: url,
          title: 'LUCKY抽 - 分享結果',
        });
        console.log('[ResultShare] Native share result:', shared);

        // If native share not available, show modal as fallback
        if (!shared) {
          setShareUrl(url);
          setShareModalVisible(true);
        }
      } catch (shareError) {
        // Native share failed, show modal as fallback
        console.log('[ResultShare] Native share failed, showing modal:', shareError);
        setShareUrl(url);
        setShareModalVisible(true);
      }
    } catch (e: any) {
      console.error('[ResultShare] Failed to create result share:', e);
      console.error('[ResultShare] Error details:', e?.message, e?.code);
      Alert.alert('分享失敗', `無法建立分享連結：${e?.message || '請稍後再試'}`);
    }
    setIsResultSharing(false);
  };

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
    // Share
    isSharing,
    shareUrl,
    shareModalVisible,
    setShareModalVisible,
    handleShare,
    isSharedMode,
    // Result sharing
    isResultSharing,
    handleShareResult,
    sharedResultData,
  };

  // Loading screen for shared content
  if (isLoadingShare) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#8C1D18' }}>
          <Text style={{ color: '#FAF6EE', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>LUCKY抽</Text>
          <Text style={{ color: '#FAF6EE', fontSize: 16 }}>載入中...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppContext.Provider value={contextValue}>
        {currentScreen === 'Home' && <HomeScreen />}
        {currentScreen === 'Setup' && <SetupScreen />}
        {currentScreen === 'Spin' && <SpinScreen />}
        {currentScreen === 'PokeSetup' && <PokeSetupScreen />}
        {currentScreen === 'PokeGame' && <PokeGameScreen />}
        {/* Share Modal */}
        <ShareModal
          visible={shareModalVisible}
          shareUrl={shareUrl}
          onClose={() => setShareModalVisible(false)}
          theme={activeTheme}
        />
      </AppContext.Provider>
    </SafeAreaProvider>
  );
}
