// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { login } from "../services/api";
import { Colors, Gradients, BorderRadius, Shadows } from "../theme";
import { useNavigation } from "@react-navigation/native";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    try {
      await login(email, password);
      // Navigate to main app after successful login
      navigation.replace("Main");
    } catch (e: any) {
      Alert.alert("Login Failed", e.response?.data?.message || e.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.glassBox}>
        <Text style={styles.title}>JY School</Text>
        <TextInput
          placeholder="Email"
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={Colors.textSecondary}
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  glassBox: {
    width: "85%",
    padding: 20,
    borderRadius: BorderRadius,
    backgroundColor: Colors.surface,
    ...Shadows.soft,
    // glossy gradient background
    backgroundImage: Gradients.card,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    height: 48,
    borderColor: Colors.textSecondary,
    borderWidth: 1,
    borderRadius: BorderRadius / 2,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: Colors.textPrimary,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius / 2,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LoginScreen;
