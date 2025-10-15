
import { colors } from '@/styles/commonStyles';
import { useTheme } from '@react-navigation/native';
import { Platform } from 'react-native';
import { IconSymbol } from '@/components/IconSymbol';
import React from 'react';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          paddingTop: 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Camera',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="camera.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="photo.stack.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="auth"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.circle.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
