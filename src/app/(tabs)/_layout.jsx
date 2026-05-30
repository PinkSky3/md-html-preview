import { Tabs } from "expo-router";
import { Home, History } from "lucide-react-native";
import { useAppSettings, useTheme } from "@/utils/useAppSettings";
import { useTranslation } from "@/utils/i18n";

export default function TabLayout() {
  const language = useAppSettings((s) => s.language);
  const theme = useTheme();
  const t = useTranslation(language);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopWidth: 1,
          borderTopColor: theme.tabBorder,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabHome,
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t.tabHistory,
          tabBarIcon: ({ color }) => <History size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
