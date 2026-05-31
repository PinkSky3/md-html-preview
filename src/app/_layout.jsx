import { useAppSettings } from "@/utils/useAppSettings";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function RootLayout() {
  const initSettings = useAppSettings((s) => s.init);

  useEffect(() => {
    initSettings();
  }, [initSettings]);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="preview"
          options={{
            headerShown: true,
            headerTitle: "文件预览",
            presentation: "modal",
          }}
        />
      </Stack>
    </View>
  );
}
