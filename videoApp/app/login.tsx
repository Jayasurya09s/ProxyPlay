import { View, TextInput, TouchableOpacity, Text, Alert, StyleSheet } from "react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import API from "../src/services/api";
import { Colors, Spacing, Shadows } from "../constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Please enter email and password");
      return;
    }
    try {
      setLoading(true);
      const res = await API.post("/auth/login", { email, password });
      await AsyncStorage.setItem("access_token", res.data.access_token);
      await AsyncStorage.setItem("refresh_token", res.data.refresh_token);
      router.replace("/(tabs)");
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Login failed";
      Alert.alert("Login error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={[Colors.background, "#0E1324"]} style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.card, Shadows.soft]}>
        <Text style={styles.title}>Welcome Back</Text>
        <TextInput
          placeholder="Email"
          placeholderTextColor={Colors.textSecondary}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={Colors.textSecondary}
          secureTextEntry
          onChangeText={setPassword}
          style={styles.input}
        />

        <TouchableOpacity onPress={login} disabled={loading} style={styles.primaryButton}>
          <LinearGradient colors={[Colors.neonCyan, Colors.neonMagenta]} style={styles.buttonGradient}>
            <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/signup")} disabled={loading} style={styles.linkButton}>
          <Text style={styles.linkText}>Create an account</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
    padding: Spacing.lg,
  },
  card: {
    width: "92%",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  input: {
    backgroundColor: Colors.card,
    color: Colors.textPrimary,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: Spacing.md,
  },
  buttonGradient: {
    paddingVertical: Spacing.sm + 4,
    alignItems: "center",
  },
  buttonText: {
    color: "#081018",
    fontWeight: "700",
    fontSize: 16,
  },
  linkButton: {
    alignItems: "center",
    marginTop: Spacing.md,
  },
  linkText: {
    color: Colors.neonCyan,
    fontWeight: "600",
  },
});