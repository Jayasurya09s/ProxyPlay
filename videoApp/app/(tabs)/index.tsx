import { View, Text, Image, TouchableOpacity, FlatList, Alert, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import API from "../../src/services/api";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Spacing, Shadows } from "../../constants/theme";
import { StatusBar } from "expo-status-bar";

export default function Dashboard() {
  const [videos, setVideos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [lastLoadedPage, setLastLoadedPage] = useState(0);

  const fetchDashboard = async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await API.get("/dashboard", { params: { page: pageNum, limit: 10 } });
      const { videos: newVideos, pagination } = res.data;
      
      // Update page first
      setPage(pageNum);
      setTotalPages(pagination.pages);
      
      // Then update videos based on page
      if (pageNum === 1) {
        setVideos(newVideos);
      } else {
        setVideos((prev) => [...prev, ...newVideos]);
      }
    } catch (e: any) {
      if (e?.response?.status === 401) {
        await AsyncStorage.removeItem("access_token");
        await AsyncStorage.removeItem("refresh_token");
        Alert.alert("Session expired", "Please log in again.");
        router.replace("/login");
      } else {
        Alert.alert("Error", e?.message || "Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(1);
  }, []);

  const loadMore = () => {
    // Prevent multiple calls for same page
    if (page < totalPages && !loading && lastLoadedPage !== page) {
      setLastLoadedPage(page);
      fetchDashboard(page + 1);
    }
  };

  return (
    <LinearGradient colors={[Colors.background, "#0E1324"]} style={styles.container}>
      <StatusBar style="light" />
      <FlatList
        contentContainerStyle={{ padding: Spacing.lg }}
        data={videos}
        keyExtractor={(item: any) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          page < totalPages && !loading ? (
            <TouchableOpacity onPress={loadMore} style={styles.loadMore}>
              <Text style={styles.loadMoreText}>Load More Videos</Text>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }: any) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: "/player", params: item })}
            style={[styles.card, Shadows.soft]}
          >
            <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.75)"]}
              style={styles.overlay}
            />
            <View style={styles.textWrap}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  thumbnail: {
    width: "100%",
    height: 200,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
  },
  textWrap: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  desc: {
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: 14,
  },
  loadMore: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  loadMoreText: {
    color: Colors.neonCyan,
    fontWeight: "600",
  },
});