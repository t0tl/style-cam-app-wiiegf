
import React, { useState, useRef, useEffect } from "react";
import { Stack } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const { width, height } = Dimensions.get("window");

const STYLE_FILTERS = [
  { id: "none", name: "Original", color: colors.primary },
  { id: "vintage", name: "Vintage", color: "#D4A574" },
  { id: "modern", name: "Modern", color: "#64B5F6" },
  { id: "elegant", name: "Elegant", color: "#9C27B0" },
  { id: "casual", name: "Casual", color: "#4CAF50" },
  { id: "sporty", name: "Sporty", color: "#FF5722" },
];

export default function CameraScreen() {
  const theme = useTheme();
  const [facing, setFacing] = useState<CameraType>("front");
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedStyle, setSelectedStyle] = useState("none");
  const [flash, setFlash] = useState<"off" | "on">("off");
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    console.log("Camera screen mounted");
  }, []);

  if (!permission) {
    console.log("Camera permissions loading...");
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.message, { color: theme.colors.text }]}>
          Loading camera...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    console.log("Camera permissions not granted");
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.permissionContainer}>
          <IconSymbol name="camera.fill" size={80} color={colors.primary} />
          <Text style={[styles.permissionTitle, { color: theme.colors.text }]}>
            Camera Access Required
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            We need your permission to access the camera so you can try on different styles
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: colors.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    console.log("Toggling camera facing");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const toggleFlash = () => {
    console.log("Toggling flash");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFlash((current) => (current === "off" ? "on" : "off"));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        console.log("Taking picture...");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        
        console.log("Picture taken:", photo?.uri);

        if (photo) {
          const savedOutfits = await AsyncStorage.getItem("savedOutfits");
          const outfits = savedOutfits ? JSON.parse(savedOutfits) : [];
          
          const newOutfit = {
            id: Date.now().toString(),
            uri: photo.uri,
            style: selectedStyle,
            timestamp: new Date().toISOString(),
          };
          
          outfits.unshift(newOutfit);
          await AsyncStorage.setItem("savedOutfits", JSON.stringify(outfits));
          
          console.log("Outfit saved successfully");
          Alert.alert("Success!", "Your outfit has been saved");
        }
      } catch (error) {
        console.log("Error taking picture:", error);
        Alert.alert("Error", "Failed to take picture. Please try again.");
      }
    }
  };

  const selectStyle = (styleId: string) => {
    console.log("Selected style:", styleId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStyle(styleId);
  };

  const renderHeaderRight = () => (
    <TouchableOpacity onPress={toggleFlash} style={styles.headerButton}>
      <IconSymbol
        name={flash === "on" ? "bolt.fill" : "bolt.slash.fill"}
        color={flash === "on" ? colors.accent : theme.colors.text}
        size={24}
      />
    </TouchableOpacity>
  );

  return (
    <>
      {Platform.OS === "ios" && (
        <Stack.Screen
          options={{
            title: "StyleTry Camera",
            headerRight: renderHeaderRight,
            headerTransparent: true,
            headerBlurEffect: "systemMaterial",
          }}
        />
      )}
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          flash={flash}
        >
          {selectedStyle !== "none" && (
            <View style={styles.styleOverlay}>
              <View style={[styles.styleBadge, { backgroundColor: STYLE_FILTERS.find(s => s.id === selectedStyle)?.color }]}>
                <Text style={styles.styleBadgeText}>
                  {STYLE_FILTERS.find((s) => s.id === selectedStyle)?.name}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.controlsContainer}>
            <View style={styles.stylesContainer}>
              {STYLE_FILTERS.map((style) => (
                <TouchableOpacity
                  key={style.id}
                  style={[
                    styles.styleButton,
                    {
                      backgroundColor: selectedStyle === style.id ? style.color : colors.card,
                      borderColor: style.color,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => selectStyle(style.id)}
                >
                  <Text
                    style={[
                      styles.styleButtonText,
                      {
                        color: selectedStyle === style.id ? "#FFFFFF" : colors.text,
                      },
                    ]}
                  >
                    {style.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.bottomControls}>
              <TouchableOpacity
                style={[styles.controlButton, { backgroundColor: colors.card }]}
                onPress={toggleCameraFacing}
              >
                <IconSymbol name="arrow.triangle.2.circlepath.camera.fill" size={28} color={colors.text} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.captureButton, { backgroundColor: colors.primary }]}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={[styles.controlButton, { backgroundColor: "transparent" }]} />
            </View>
          </View>
        </CameraView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  styleOverlay: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 60,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  styleBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  styleBadgeText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  stylesContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  styleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  styleButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.3)",
    elevation: 5,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 4px 16px rgba(0, 0, 0, 0.4)",
    elevation: 8,
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
  },
});
