import 'dotenv/config';

export default {
  expo: {
    name: "LUCKY抽",
    slug: "lucky-draw-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#8C1D18"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.cjhengdigital.luckydraw",
      buildNumber: "4",
      infoPlist: {
        NSPhotoLibraryUsageDescription: "允許存取相簿以匯入抽獎選項的照片",
        NSPhotoLibraryAddUsageDescription: "允許儲存圖片至相簿",
        CFBundleDisplayName: "LUCKY抽",
        ITSAppUsesNonExemptEncryption: false
      },
      associatedDomains: ["applinks:qman-roulette-app.vercel.app"]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#8C1D18"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.cjhengdigital.luckydraw",
      permissions: ["android.permission.RECORD_AUDIO"],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "qman-roulette-app.vercel.app",
              pathPrefix: "/s"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
      output: "single",
      name: "LUCKY抽 - 輪盤與戳戳樂",
      shortName: "LUCKY抽",
      description: "線上製作輪盤抽獎與戳戳樂遊戲"
    },
    scheme: "luckydraw",
    plugins: [
      [
        "expo-image-picker",
        {
          photosPermission: "允許 LUCKY抽 存取您的相簿以匯入抽獎選項的照片"
        }
      ],
      "expo-document-picker"
    ],
    extra: {
      eas: {
        projectId: "75fa0bae-9947-4866-8609-64d532fff890"
      },
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
    },
    owner: "chen_max19"
  }
};
