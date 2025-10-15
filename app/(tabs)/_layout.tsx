
import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { useTheme } from '@react-navigation/native';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: theme.dark ? '#1e1e1e' : '#ffffff',
          borderTopWidth: 1,
          borderTopColor: theme.dark ? '#333333' : '#e5e5e5',
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="camera.fill"
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol
              name="photo.stack.fill"
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
