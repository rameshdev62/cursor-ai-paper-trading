import React from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PaperTradingProvider } from './src/context/PaperTradingContext';
import { WatchlistScreen } from './src/screens/WatchlistScreen';
import { ScannerScreen } from './src/screens/ScannerScreen';
import { PositionsScreen } from './src/screens/PositionsScreen';
import { PortfolioScreen } from './src/screens/PortfolioScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { colors } from './src/theme/colors';

const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperTradingProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: {
                backgroundColor: colors.surface,
                borderTopColor: colors.border,
                height: Platform.OS === 'ios' ? 88 : 64,
                paddingBottom: Platform.OS === 'ios' ? 28 : 5,
                paddingTop: 8,
              },
              tabBarLabelStyle: {
                fontSize: 10,
                fontWeight: '700',
                marginTop: 2,
              },
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.textMuted,
              tabBarIcon: ({ color, size }) => {
                const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
                  Watchlist: 'eye',
                  Scanner: 'analytics',
                  Positions: 'briefcase',
                  Portfolio: 'wallet',
                  Settings: 'settings-outline',
                };
                return (
                  <Ionicons name={icons[route.name] ?? 'ellipse'} size={size} color={color} />
                );
              },
            })}
          >
            <Tab.Screen name="Watchlist" component={WatchlistScreen} />
            <Tab.Screen name="Scanner" component={ScannerScreen} />
            <Tab.Screen name="Positions" component={PositionsScreen} />
            <Tab.Screen name="Portfolio" component={PortfolioScreen} />
            <Tab.Screen name="Settings" component={SettingsScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      </PaperTradingProvider>
    </SafeAreaProvider>
  );
}
