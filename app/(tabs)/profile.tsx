
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { useTheme } from "@react-navigation/native";
import { colors } from "@/styles/commonStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

interface SavedOutfit {
  id: string;
  uri: string;
  style: string;
  timestamp: string;
}

export default function SavedOutfitsScreen() {
  const theme = useTheme();
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);

  const loadOutfits = async () => {
    try {
      console.log("Loading saved outfits...");
      const savedOutfits = await AsyncStorage.getItem("savedOutfits");
      if (savedOutfits) {
        const parsed = JSON.parse(savedOutfits);
        console.log("Loaded outfits:", parsed.length);
        setOutfits(parsed);
      } else {
        console.log("No saved outfits found");
        setOutfits([]);
      }
    } catch (error) {
      console.log("Error loading outfits:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOutfits();
    }, [])
  );

  const deleteOutfit = async (id: string) => {
    try {
      console.log("Deleting outfit:", id);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const updatedOutfits = outfits.filter((outfit) => outfit.id !== id);
      await AsyncStorage.setItem("savedOutfits", JSON.stringify(updatedOutfits));
      setOutfits(updatedOutfits);
      
      Alert.alert("Deleted", "Outfit removed from your collection");
    } catch (error) {
      console.log("Error deleting outfit:", error);
      Alert.alert("Error", "Failed to delete outfit");
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Delete Outfit",
      "Are you sure you want to delete this outfit?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteOutfit(id) },
      ]
    );
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Saved Outfits
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {outfits.length} {outfits.length === 1 ? "outfit" : "outfits"} saved
        </Text>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== "ios" && styles.contentContainerWithTabBar,
        ]}
      >
        {outfits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="photo.stack" size={80} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Saved Outfits Yet
            </Text>
            <Text style={[styles.emptyMessage, { color: colors.textSecondary }]}>
              Start capturing your favorite looks using the camera!
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {outfits.map((outfit) => (
              <View key={outfit.id} style={[styles.card, { backgroundColor: colors.card }]}>
                <Image source={{ uri: outfit.uri }} style={styles.image} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.styleText, { color: theme.colors.text }]}>
                      {outfit.style}
                    </Text>
                    <TouchableOpacity
                      onPress={() => confirmDelete(outfit.id)}
                      style={styles.deleteButton}
                    >
                      <IconSymbol name="trash.fill" size={18} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                    {formatDate(outfit.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  contentContainerWithTabBar: {
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  emptyMessage: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.1)",
    elevation: 3,
  },
  image: {
    width: "100%",
    height: CARD_WIDTH * 1.3,
    backgroundColor: "#E0E0E0",
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  styleText: {
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  deleteButton: {
    padding: 4,
  },
  dateText: {
    fontSize: 12,
  },
});
