import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { RootStackParamList, ThemeId, Option } from '../types';
import { useWheel } from '../context/WheelContext';
import { THEMES } from '../constants/themes';

type SetupScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Setup'>;
};

export const SetupScreen: React.FC<SetupScreenProps> = ({ navigation }) => {
  const {
    config,
    activeTheme,
    setConfig,
    setTheme,
    addOption,
    removeOption,
    updateOption,
    saveConfig,
  } = useWheel();

  const handleAddOption = () => {
    if (config.options.length >= 12) {
      Alert.alert('已達上限', '最多只能新增 12 個選項');
      return;
    }
    addOption({
      id: Date.now().toString(),
      type: 'text',
      content: '新獎項',
    });
  };

  const handleCSVImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
      });

      if (result.canceled || !result.assets?.[0]) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const lines = content.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

      const newOptions: Option[] = lines.slice(0, 12).map((l, i) => ({
        id: `csv-${i}-${Date.now()}`,
        type: 'text',
        content: l.split(',')[0],
      }));

      setConfig((prev) => ({ ...prev, options: newOptions }));
      Alert.alert('匯入成功', `已匯入 ${newOptions.length} 個選項`);
    } catch (error) {
      Alert.alert('匯入失敗', '無法讀取 CSV 檔案');
    }
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
        base64: true,
      });

      if (result.canceled || !result.assets) return;

      const remaining = 12 - config.options.length;
      const newOptions: Option[] = result.assets.slice(0, remaining).map((asset, i) => ({
        id: `img-${i}-${Date.now()}`,
        type: 'image',
        content: asset.uri,
        label: `相片 ${config.options.length + i + 1}`,
      }));

      setConfig((prev) => ({
        ...prev,
        options: [...prev.options, ...newOptions],
      }));
    } catch (error) {
      Alert.alert('匯入失敗', '無法讀取相片');
    }
  };

  const handleGoToSpin = async () => {
    if (config.options.length === 0) {
      Alert.alert('提示', '請先新增至少一個選項');
      return;
    }
    await saveConfig();
    navigation.navigate('Spin');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeTheme.bg }]}>
      <View style={[styles.card, { backgroundColor: activeTheme.palette[0], borderColor: activeTheme.accent }]}>
        {/* Header */}
        <View style={[styles.header, { borderColor: activeTheme.accent, backgroundColor: activeTheme.bg }]}>
          <Text style={[styles.headerTitle, { color: activeTheme.text }]}>獎項名單配置</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={[styles.closeBtnText, { color: activeTheme.accent }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title input */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: activeTheme.label }]}>
              Custom Title • 客製化標題 (顯示於輪盤上方)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: activeTheme.bg, color: activeTheme.text, borderColor: activeTheme.accent }]}
              value={config.name}
              onChangeText={(text) => setConfig((prev) => ({ ...prev, name: text }))}
              placeholder="輸入輪盤標題"
              placeholderTextColor={activeTheme.label}
            />
          </View>

          {/* Theme selection */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: activeTheme.label }]}>
              Theme Style • 主題配色
            </Text>
            <View style={styles.themeGrid}>
              {(Object.keys(THEMES) as ThemeId[]).map((tid) => (
                <TouchableOpacity
                  key={tid}
                  style={[
                    styles.themeBtn,
                    {
                      backgroundColor: THEMES[tid].bg,
                      borderColor: config.themeId === tid ? THEMES[tid].accent : 'transparent',
                      opacity: config.themeId === tid ? 1 : 0.6,
                    },
                  ]}
                  onPress={() => setTheme(tid)}
                >
                  <View style={styles.themePalette}>
                    {THEMES[tid].palette.map((c, i) => (
                      <View key={i} style={[styles.paletteColor, { backgroundColor: c }]} />
                    ))}
                  </View>
                  <Text style={[styles.themeName, { color: THEMES[tid].text }]}>
                    {THEMES[tid].name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Options list */}
          <View style={styles.section}>
            <View style={styles.optionsHeader}>
              <Text style={[styles.sectionTitle, { color: activeTheme.text }]}>
                獎項列表 ({config.options.length}/12)
              </Text>
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: activeTheme.accent }]}
                onPress={handleAddOption}
              >
                <Text style={[styles.addBtnText, { color: activeTheme.bg }]}>+ 新增</Text>
              </TouchableOpacity>
            </View>

            {config.options.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: activeTheme.label, backgroundColor: activeTheme.bg }]}>
                <Text style={[styles.emptyText, { color: activeTheme.label }]}>
                  目前沒有選項，請匯入或點擊新增
                </Text>
              </View>
            ) : (
              <View style={styles.optionsList}>
                {config.options.map((opt, i) => (
                  <View
                    key={opt.id}
                    style={[styles.optionItem, { backgroundColor: activeTheme.bg, borderColor: activeTheme.accent }]}
                  >
                    <View style={[styles.optionIndex, { backgroundColor: activeTheme.accent }]}>
                      <Text style={[styles.optionIndexText, { color: activeTheme.bg }]}>{i + 1}</Text>
                    </View>
                    {opt.type === 'text' ? (
                      <TextInput
                        style={[styles.optionInput, { color: activeTheme.text }]}
                        value={opt.content}
                        onChangeText={(text) => updateOption(opt.id, text)}
                      />
                    ) : (
                      <Text style={[styles.optionLabel, { color: activeTheme.text }]}>
                        {opt.label || '相片貼紙'}
                      </Text>
                    )}
                    <TouchableOpacity onPress={() => removeOption(opt.id)}>
                      <Text style={[styles.removeBtn, { color: activeTheme.accent }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Import tools */}
          <View style={[styles.importBox, { backgroundColor: activeTheme.bg, borderColor: activeTheme.accent }]}>
            <Text style={[styles.importTitle, { color: activeTheme.text }]}>匯入相片</Text>
            <TouchableOpacity
              style={[styles.importBtn, { borderColor: activeTheme.accent }]}
              onPress={handleCSVImport}
            >
              <Text style={[styles.importBtnText, { color: activeTheme.accent }]}>📄 匯入 CSV 名單</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.importBtn, { borderColor: activeTheme.accent }]}
              onPress={handlePhotoImport}
            >
              <Text style={[styles.importBtnText, { color: activeTheme.accent, fontSize: 28 }]}>📸</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Footer button */}
        <View style={[styles.footer, { borderColor: activeTheme.accent, backgroundColor: activeTheme.bg }]}>
          <TouchableOpacity
            style={[
              styles.goBtn,
              {
                backgroundColor: activeTheme.accent,
                borderColor: activeTheme.palette[3],
                opacity: config.options.length === 0 ? 0.5 : 1,
              },
            ]}
            onPress={handleGoToSpin}
            disabled={config.options.length === 0}
          >
            <Text style={[styles.goBtnText, { color: activeTheme.bg === '#FFF5F5' ? '#FFF' : activeTheme.bg }]}>
              抽獎GO
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 4,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  closeBtn: {
    padding: 8,
  },
  closeBtnText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    fontWeight: 'bold',
    borderWidth: 2,
  },
  themeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 3,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  themePalette: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  paletteColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  themeName: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  optionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: {
    fontWeight: 'bold',
  },
  emptyBox: {
    padding: 40,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  optionsList: {
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIndexText: {
    fontWeight: 'bold',
  },
  optionInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
  },
  optionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  removeBtn: {
    fontSize: 24,
    opacity: 0.4,
  },
  importBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 4,
    marginBottom: 20,
  },
  importTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 8,
  },
  importBtn: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    marginTop: 12,
  },
  importBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  goBtn: {
    padding: 20,
    borderRadius: 12,
    borderBottomWidth: 6,
    alignItems: 'center',
  },
  goBtnText: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 8,
  },
});

export default SetupScreen;
