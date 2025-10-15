
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
  ActivityIndicator,
  Modal,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useOutfitGeneration } from "@/hooks/useOutfitGeneration";
import { supabase } from "@/app/integrations/supabase/client";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { generateOutfit, loading, error } = useOutfitGeneration();

  useEffect(() => {
    console.log("Camera screen mounted");
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    console.log("Auth status:", !!session);
  };

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
          base64: true,
        });
        
        console.log("Picture taken:", photo?.uri);

        if (photo) {
          // If a style is selected and user is authenticated, generate outfit
          if (selectedStyle !== "none" && isAuthenticated) {
            console.log("Generating outfit with style:", selectedStyle);
            
            if (!photo.base64) {
              Alert.alert("Error", "Failed to capture image data");
              return;
            }

            const result = await generateOutfit({
              imageData: photo.base64,
              style: selectedStyle,
              mimeType: 'image/jpeg',
            });

            if (result) {
              console.log("Outfit generation result:", result);
              
              if (result.imageUrl) {
                setGeneratedImage(result.imageUrl);
                setShowResultModal(true);
                
                // Save to local storage
                const savedOutfits = await AsyncStorage.getItem("savedOutfits");
                const outfits = savedOutfits ? JSON.parse(savedOutfits) : [];
                
                const newOutfit = {
                  id: Date.now().toString(),
                  uri: result.imageUrl,
                  style: selectedStyle,
                  timestamp: new Date().toISOString(),
                };
                
                outfits.unshift(newOutfit);
                await AsyncStorage.setItem("savedOutfits", JSON.stringify(outfits));
              } else {
                // Show the text response
                Alert.alert(
                  "Style Analysis",
                  result.message || "Outfit transformation completed",
                  [
                    {
                      text: "OK",
                      onPress: () => console.log("Alert dismissed"),
                    },
                  ]
                );
              }
            }
          } else {
            // Just save the original photo
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

  const closeResultModal = () => {
    setShowResultModal(false);
    setGeneratedImage(null);
  };

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

          {!isAuthenticated && selectedStyle !== "none" && (
            <View style={styles.authWarning}>
              <View style={[styles.authWarningBadge, { backgroundColor: 'rgba(255, 152, 0, 0.9)' }]}>
                <IconSymbol name="exclamationmark.triangle.fill" size={16} color="#FFFFFF" />
                <Text style={styles.authWarningText}>
                  Sign in to use AI style transformation
                </Text>
              </View>
            </View>
          )}

          {loading && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Generating your new outfit...</Text>
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
                disabled={loading}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>

              <View style={[styles.controlButton, { backgroundColor: "transparent" }]} />
            </View>
          </View>
        </CameraView>

        {/* Result Modal */}
        <Modal
          visible={showResultModal}
          transparent={true}
          animationType="fade"
          onRequestClose={closeResultModal}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  Your New Outfit
                </Text>
                <TouchableOpacity onPress={closeResultModal}>
                  <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              {generatedImage && (
                <Image
                  source={{ uri: generatedImage }}
                  style={styles.resultImage}
                  resizeMode="contain"
                />
              )}
              
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={closeResultModal}
              >
                <Text style={styles.modalButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  authWarning: {
    position: "absolute",
    top: Platform.OS === "ios" ? 150 : 110,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  authWarningBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  authWarningText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    gap: 15,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.3)",
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  resultImage: {
    width: "100%",
    height: 400,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
