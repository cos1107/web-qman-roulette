import { Theme, ThemeId } from '../types';

export const THEMES: Record<ThemeId, Theme> = {
  classic: {
    id: 'classic',
    name: '粉春綻放',
    palette: ['#FF6B35', '#F7931E', '#FFB347', '#FFCC66'],
    bg: '#FFF5EE',
    accent: '#FF6B35',
    text: '#5D4E37',
    label: '#8B5A2B',
  },
  royal: {
    id: 'royal',
    name: '迎春報喜',
    palette: ['#5B2C83', '#E8B923', '#FF69B4', '#9D4EDD'],
    bg: '#1A0A2E',
    accent: '#E8B923',
    text: '#F5E6D3',
    label: '#D4A5FF',
  },
  emerald: {
    id: 'emerald',
    name: '福壽金貴',
    palette: ['#1a4d2e', '#a30000', '#C9A227', '#E8D48A'],
    bg: '#0e2a19',
    accent: '#C9A227',
    text: '#F5E6B8',
    label: '#F5E6B8',
  },
};

export const LUNAR_GREETINGS = [
  '新春大吉，好運連連！',
  '恭喜發財，紅包拿來！',
  '龍馬精神，萬事如意！',
  '歲歲平安，年年有餘！',
  '前程似錦，大展宏圖！',
];

export const DEFAULT_WHEEL_CONFIG = {
  id: 'default',
  name: '2026 迎春 • 開運輪盤',
  options: [],
  themeId: 'royal' as ThemeId,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
