export type OptionType = 'text' | 'image';

export type ThemeId = 'classic' | 'royal' | 'emerald';

export interface Option {
  id: string;
  type: OptionType;
  content: string;
  label?: string;
}

export interface WheelConfig {
  id: string;
  name: string;
  options: Option[];
  themeId: ThemeId;
  createdAt: number;
  updatedAt: number;
}

export interface SpinResult {
  option: Option;
  index: number;
}

export interface Theme {
  id: ThemeId;
  name: string;
  palette: string[];
  bg: string;
  accent: string;
  text: string;
  label: string;
}

export type RootStackParamList = {
  Home: undefined;
  Setup: undefined;
  Spin: undefined;
};
