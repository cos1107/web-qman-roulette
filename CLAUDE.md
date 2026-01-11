# LUCKY抽 - 抽獎輪盤與戳戳樂 App

## 專案資訊

- **GitHub:** https://github.com/cos1107/web-qman-roulette
- **Web 版:** 部署於 Vercel
- **App 名稱:** LUCKY抽
- **Bundle ID:** com.cjhengdigital.luckydraw

## 技術棧

- **框架:** React Native + Expo SDK 54
- **語言:** TypeScript
- **狀態管理:** React Context + AsyncStorage（本地持久化）
- **導航:** React Navigation（目前未使用，所有畫面在 App.tsx）
- **動畫:** React Native Reanimated + Animated API
- **SVG:** react-native-svg
- **平台:** iOS / Android / Web

## 專案結構

```
qman-roulette-app/
├── App.tsx                 # 主程式（包含所有畫面和元件）
├── src/
│   ├── components/         # 可重用元件
│   │   ├── Wheel.tsx       # 輪盤元件
│   │   ├── ResultModal.tsx # 結果彈窗
│   │   ├── CelebrationOverlay.tsx  # 慶祝動畫
│   │   ├── Lantern.tsx     # 燈籠裝飾
│   │   └── PlumBlossom.tsx # 梅花裝飾
│   ├── screens/            # 畫面（目前主要邏輯在 App.tsx）
│   │   ├── HomeScreen.tsx
│   │   ├── SetupScreen.tsx
│   │   └── SpinScreen.tsx
│   ├── constants/
│   │   └── themes.ts       # 主題配色定義
│   ├── context/
│   │   └── WheelContext.tsx
│   ├── types/
│   │   └── index.ts        # TypeScript 類型定義
│   └── utils/
├── assets/                 # 圖片資源
│   ├── icon.png            # App 圖示
│   ├── splash-icon.png     # 啟動畫面
│   └── horse-icon.png      # 小馬圖示
├── style-reference/        # 設計參考圖片
├── app.json                # Expo 配置
├── eas.json                # EAS Build 配置
└── vercel.json             # Vercel 部署配置
```

## 主要功能

### 1. 輪盤抽獎 (Wheel Mode)
- 自訂抽獎選項（文字或圖片）
- 旋轉動畫 + 結果彈窗
- 慶祝動畫效果

### 2. 戳戳樂 (Poke Mode)
- 格子隨機排列獎項
- 點擊揭曉結果
- 支援圖片選項

### 3. 主題系統
三種主題（定義於 App.tsx）：
- `classic` - 喜氣紅金（預設）
- `pink` - 粉春綻放
- `fresh` - 清新自然

### 4. 圖片匯入
- 使用 expo-image-picker 從相簿選擇
- 支援為圖片加上文字標籤

## 常用命令

```bash
# 開發
npm start                    # 啟動 Expo 開發伺服器
npm run web                  # 啟動 Web 版開發
npm run android              # 啟動 Android 模擬器
npm run ios                  # 啟動 iOS 模擬器

# 建置
npm run build:web            # 建置 Web 版（輸出到 dist/）
npx eas build --platform ios # 建置 iOS（需 EAS 帳號）
npx eas build --platform android # 建置 Android

# 部署
npx vercel --prod            # 部署 Web 版到 Vercel
```

## 畫面流程

```
Home (首頁)
  ├── 輪盤模式 → Setup (設定選項) → Spin (轉盤)
  └── 戳戳樂模式 → PokeSetup (設定選項) → PokeGame (遊戲)
```

## 重要類型定義

```typescript
type ScreenName = 'Home' | 'Setup' | 'Spin' | 'PokeSetup' | 'PokeGame';
type ThemeId = 'classic' | 'pink' | 'fresh';
type GameMode = 'wheel' | 'poke';

interface Option {
  id: string;
  type: 'text' | 'image';
  content: string;      // 文字內容或圖片 base64/URI
  label?: string;       // 圖片的文字標籤
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
```

## 儲存機制

使用 AsyncStorage 儲存：
- `wheelConfigs` - 輪盤設定列表
- `pokeConfigs` - 戳戳樂設定列表
- `currentWheelConfigId` - 當前選中的輪盤 ID
- `currentPokeConfigId` - 當前選中的戳戳樂 ID

## 注意事項

1. **單一檔案架構**: 目前主要邏輯都在 `App.tsx`（約 2800+ 行），src/ 下的檔案是舊版結構
2. **跨平台相容**: 需注意 Web 和 Native 的差異（如 Alert）
3. **圖片處理**: 圖片以 base64 儲存於 AsyncStorage，大量圖片可能影響效能
4. **主題配色**: App.tsx 中的 THEMES 是實際使用的版本，src/constants/themes.ts 是舊版

## 開發狀態

- [x] 輪盤抽獎功能
- [x] 戳戳樂功能
- [x] 三種主題配色
- [x] 圖片匯入
- [x] Web 版部署 (Vercel)
- [ ] 音效功能
- [ ] 分享結果功能
- [ ] 多輪盤管理優化

## 相關連結

- EAS Project ID: `75fa0bae-9947-4866-8609-64d532fff890`
- Expo Owner: `chen_max19`
