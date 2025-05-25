export default {
  name: "ValdirCar",
  slug: "valdircar",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#007AFF"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: false
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#007AFF"
    }
  },
  web: {
    favicon: "./assets/favicon.png"
  },
  extra: {
    // Supabase configuration
    supabaseUrl: "https://lsztkttgzmiaeerbrdax.supabase.co",
    supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3aXlsd253emlmYWVudmRtbmJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4NzIyMDQsImV4cCI6MjA2MzQ0ODIwNH0.dNhfG_rgcIYxY6d7zqQ7Yhr8MKp4ZwPZ4Ajm2oMumF4",
  },
  plugins: [
    "expo-router"
  ]
}; 