// src/services/api.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE = "http://localhost:5000/api"; // adjust if needed

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Add JWT token to every request if present
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("jwtToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (email: string, password: string) => {
  const response = await api.post("/auth/login", { email, password });
  const { token } = response.data;
  await AsyncStorage.setItem("jwtToken", token);
  return token;
};
