import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WheelConfig, Option, ThemeId, SpinResult } from '../types';
import { THEMES, DEFAULT_WHEEL_CONFIG } from '../constants/themes';

interface WheelContextType {
  config: WheelConfig;
  activeTheme: typeof THEMES.royal;
  isSpinning: boolean;
  result: SpinResult | null;
  targetSector: number;
  setConfig: React.Dispatch<React.SetStateAction<WheelConfig>>;
  setTheme: (themeId: ThemeId) => void;
  addOption: (option: Option) => void;
  removeOption: (id: string) => void;
  updateOption: (id: string, content: string) => void;
  spin: () => void;
  clearResult: () => void;
  saveConfig: () => Promise<void>;
  loadConfig: () => Promise<void>;
}

const WheelContext = createContext<WheelContextType | undefined>(undefined);

const STORAGE_KEY = '@qman_wheel_config';

export const WheelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<WheelConfig>(DEFAULT_WHEEL_CONFIG);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [targetSector, setTargetSector] = useState(0);
  const [rotation, setRotation] = useState(0);

  const activeTheme = THEMES[config.themeId];

  useEffect(() => {
    loadConfig();
  }, []);

  const saveConfig = async () => {
    try {
      const updatedConfig = { ...config, updatedAt: Date.now() };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
      setConfig(updatedConfig);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  };

  const loadConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConfig(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  };

  const setTheme = (themeId: ThemeId) => {
    setConfig((prev) => ({ ...prev, themeId }));
  };

  const addOption = (option: Option) => {
    if (config.options.length >= 12) return;
    setConfig((prev) => ({
      ...prev,
      options: [...prev.options, option],
    }));
  };

  const removeOption = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      options: prev.options.filter((o) => o.id !== id),
    }));
  };

  const updateOption = (id: string, content: string) => {
    setConfig((prev) => ({
      ...prev,
      options: prev.options.map((o) => (o.id === id ? { ...o, content } : o)),
    }));
  };

  const spin = () => {
    if (isSpinning || config.options.length < 1) return;

    const TOTAL_SECTORS = 12;
    // Use crypto-grade random for fairness (falls back to Math.random)
    const randomValue = typeof crypto !== 'undefined' && crypto.getRandomValues
      ? crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1)
      : Math.random();
    const targetSectorIndex = Math.floor(randomValue * TOTAL_SECTORS);

    setTargetSector(targetSectorIndex);
    setIsSpinning(true);
    setResult(null);

    setTimeout(() => {
      setIsSpinning(false);
      const winningOption = config.options[targetSectorIndex % config.options.length];
      setResult({ option: winningOption, index: targetSectorIndex });
    }, 5000);
  };

  const clearResult = () => {
    setResult(null);
  };

  return (
    <WheelContext.Provider
      value={{
        config,
        activeTheme,
        isSpinning,
        result,
        targetSector,
        setConfig,
        setTheme,
        addOption,
        removeOption,
        updateOption,
        spin,
        clearResult,
        saveConfig,
        loadConfig,
      }}
    >
      {children}
    </WheelContext.Provider>
  );
};

export const useWheel = () => {
  const context = useContext(WheelContext);
  if (!context) {
    throw new Error('useWheel must be used within a WheelProvider');
  }
  return context;
};
