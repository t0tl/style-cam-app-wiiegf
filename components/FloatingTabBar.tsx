
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 8,
  },
  containerVertical: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    alignItems: 'flex-end',
    paddingBottom: 0,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  tabBarVertical: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabButtonVertical: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    width: '100%',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelVertical: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  indicator: {
    position: 'absolute',
    height: 3,
    bottom: 0,
    borderRadius: 1.5,
  },
  indicatorVertical: {
    position: 'absolute',
    width: 3,
    right: 0,
    borderRadius: 1.5,
  },
});

export default function FloatingTabBar({
  tabs,
  containerWidth = Dimensions.get('window').width * 0.9,
  borderRadius = 25,
  bottomMargin = 20,
}: FloatingTabBarProps) {
  const router = useRouter();
  const theme = useTheme();
  const pathname = usePathname();
  const indicatorPosition = useSharedValue(0);

  // Check if we're on the camera view
  const isCameraView = pathname === '/(tabs)/(home)/index' || pathname === '/(tabs)/(home)';
  console.log('Current pathname:', pathname, 'isCameraView:', isCameraView);

  const currentTabIndex = tabs.findIndex((tab) => pathname.includes(tab.name));

  React.useEffect(() => {
    if (currentTabIndex !== -1) {
      indicatorPosition.value = withSpring(currentTabIndex, {
        damping: 20,
        stiffness: 90,
      });
    }
  }, [currentTabIndex]);

  const handleTabPress = (route: string) => {
    console.log('Navigating to:', route);
    router.push(route as any);
  };

  const indicatorStyle = useAnimatedStyle(() => {
    if (isCameraView) {
      // Vertical indicator
      const tabHeight = 60; // Approximate height per tab
      return {
        transform: [
          {
            translateY: interpolate(
              indicatorPosition.value,
              [0, tabs.length - 1],
              [0, (tabs.length - 1) * tabHeight]
            ),
          },
        ],
        height: tabHeight,
      };
    } else {
      // Horizontal indicator
      const tabWidth = containerWidth / tabs.length;
      return {
        transform: [
          {
            translateX: interpolate(
              indicatorPosition.value,
              [0, tabs.length - 1],
              [0, (tabs.length - 1) * tabWidth]
            ),
          },
        ],
        width: tabWidth,
      };
    }
  });

  return (
    <SafeAreaView
      style={[
        isCameraView ? styles.containerVertical : styles.container,
        !isCameraView && { marginBottom: bottomMargin },
      ]}
      edges={['bottom']}
    >
      <BlurView
        intensity={80}
        tint={theme.dark ? 'dark' : 'light'}
        style={[
          isCameraView ? styles.tabBarVertical : styles.tabBar,
          {
            width: isCameraView ? 70 : containerWidth,
            borderRadius,
            backgroundColor: theme.dark
              ? 'rgba(30, 30, 30, 0.8)'
              : 'rgba(255, 255, 255, 0.9)',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            elevation: 8,
          },
        ]}
      >
        {tabs.map((tab, index) => {
          const isActive = currentTabIndex === index;
          return (
            <TouchableOpacity
              key={tab.name}
              style={isCameraView ? styles.tabButtonVertical : styles.tabButton}
              onPress={() => handleTabPress(tab.route)}
            >
              <IconSymbol
                name={tab.icon as any}
                size={24}
                color={isActive ? colors.primary : colors.text}
              />
              <Text
                style={[
                  isCameraView ? styles.tabLabelVertical : styles.tabLabel,
                  {
                    color: isActive ? colors.primary : colors.text,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <Animated.View
          style={[
            isCameraView ? styles.indicatorVertical : styles.indicator,
            indicatorStyle,
            { backgroundColor: colors.primary },
          ]}
        />
      </BlurView>
    </SafeAreaView>
  );
}
