// src/navigation/AppNavigator.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import { Colors, Gradients } from "../theme";
import { View, Text } from "react-native";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: Colors.primary },
      headerTintColor: "#fff",
      tabBarStyle: { backgroundColor: Colors.surface },
    }}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    {/* Future tabs like Attendance, Fees, etc. can be added here */}
  </Tab.Navigator>
);

const AppNavigator = () => {
  // Simple auth flow: if token exists, show app tabs, else login
  // For now, always show login then tabs after login (handled inside LoginScreen)
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={AppTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
