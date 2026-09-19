import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { login } from "../api";

interface LoginScreenProps {
  onLoginSuccess: (serverUrl: string) => void;
  defaultServerUrl: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  defaultServerUrl,
}) => {
  const [email, setEmail] = useState("russellfoyze007@gmail.com");
  const [password, setPassword] = useState("russell@007");
  const [pinCode, setPinCode] = useState("5683");
  const [serverUrl, setServerUrl] = useState(defaultServerUrl);
  const [showServerConfig, setShowServerConfig] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password || !pinCode) {
      setErrorMessage("Please provide email, password, and 2FA code");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const res = await login(email.trim(), password.trim(), pinCode.trim(), serverUrl.trim());
    setIsLoading(false);

    if (res.success) {
      onLoginSuccess(serverUrl.trim());
    } else {
      setErrorMessage(res.error || "Invalid credentials or 2FA PIN");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* Logo & Header */}
          <View style={styles.brandBox}>
            <View style={styles.logoBadge}>
              <MaterialIcons name="shield" size={32} color="#6366F1" />
            </View>
            <Text style={styles.brandTitle}>MultiPortal</Text>
            <Text style={styles.brandSubtitle}>Private Document Vault · Android Mobile</Text>
          </View>

          {errorMessage && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#6366F1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Enter email"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#6366F1" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Enter password"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* 2FA PIN */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>2FA Security PIN</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="key-outline" size={18} color="#F59E0B" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={pinCode}
                onChangeText={setPinCode}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="5683"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Server Config Toggle */}
          <TouchableOpacity
            style={styles.serverToggleRow}
            onPress={() => setShowServerConfig(!showServerConfig)}
          >
            <Text style={styles.serverToggleText}>
              Backend API ({serverUrl.replace(/https?:\/\//, "").slice(0, 22)}...)
            </Text>
            <Ionicons
              name={showServerConfig ? "chevron-up" : "chevron-down"}
              size={14}
              color="#94A3B8"
            />
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MultiPortal Server URL</Text>
              <TextInput
                style={[styles.input, { paddingLeft: 12 }]}
                value={serverUrl}
                onChangeText={setServerUrl}
                autoCapitalize="none"
                placeholder="http://10.0.2.2:3000"
                placeholderTextColor="#64748B"
              />
            </View>
          )}

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="log-in-outline" size={20} color="#FFF" />
                <Text style={styles.loginButtonText}>Sign In to MultiPortal</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Quick Fill Credentials Note */}
          <Text style={styles.hintText}>
            Pre-configured with credentials: russellfoyze007@gmail.com
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#111726",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#1E293B",
    padding: 24,
  },
  brandBox: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F8FAFC",
  },
  brandSubtitle: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderWidth: 1,
    borderColor: "#EF4444",
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B0F19",
    borderWidth: 1,
    borderColor: "#1E293B",
    borderRadius: 12,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#F8FAFC",
  },
  serverToggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  serverToggleText: {
    fontSize: 11,
    color: "#64748B",
  },
  loginButton: {
    backgroundColor: "#6366F1",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  hintText: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginTop: 12,
  },
});
