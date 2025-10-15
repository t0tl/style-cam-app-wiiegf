
import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Onboarding from 'react-native-onboarding-swiper';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const handleDone = async () => {
    try {
      await AsyncStorage.setItem('hasOnboarded', 'true');
      console.log('Onboarding completed, navigating to main app');
      router.replace('/(tabs)/(home)/');
    } catch (error) {
      console.log('Error saving onboarding status:', error);
    }
  };

  return (
    <Onboarding
      onDone={handleDone}
      onSkip={handleDone}
      pages={[
        {
          backgroundColor: colors.primary,
          image: (
            <View style={styles.imageContainer}>
              <Text style={styles.emoji}>📸</Text>
            </View>
          ),
          title: 'Welcome to StyleTry',
          subtitle: 'Try on different styles using your camera in real-time',
        },
        {
          backgroundColor: colors.secondary,
          image: (
            <View style={styles.imageContainer}>
              <Text style={styles.emoji}>✨</Text>
            </View>
          ),
          title: 'Virtual Try-On',
          subtitle: 'See how different styles look on you instantly with our camera feature',
        },
        {
          backgroundColor: colors.accent,
          image: (
            <View style={styles.imageContainer}>
              <Text style={styles.emoji}>💾</Text>
            </View>
          ),
          title: 'Save Your Favorites',
          subtitle: 'Capture and save your favorite looks to review later',
        },
      ]}
      containerStyles={styles.container}
      titleStyles={styles.title}
      subTitleStyles={styles.subtitle}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: width * 0.3,
    marginBottom: 20,
  },
  emoji: {
    fontSize: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  },
});
