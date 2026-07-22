// src/app/dashboard.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchStudentDashboard, StudentDashboardData } from "../services/dashboard";
import { Colors, Gradients, BorderRadius, Shadows } from "../theme";

export default function DashboardScreen() {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchStudentDashboard();
        setData(result);
      } catch (e: any) {
        setError(e.message ?? "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!data) {
    return null;
  }

  const { attendanceToday, feeInfo, recentPayments, recentResults } = data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.greetingText}>Good Evening, Rajesh</Text>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.profileBadge}>
              <Text style={styles.profileText}>R</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.iconButtonOutline}>
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Wavy background illusion or container adjustment */}
      <View style={styles.bodyContainer}>

      {/* Attendance Card */}
      <View style={styles.glassCard}>
        <Text style={styles.sectionTitle}>Today's Attendance</Text>
        <Text style={styles.attendanceValue}>{attendanceToday}%</Text>
      </View>

      {/* Fee Card */}
      <View style={styles.glassCard}>
        <Text style={styles.sectionTitle}>Fees Details</Text>
        <Text style={styles.feeLine}>Paid: ₹{feeInfo.totalPaid}</Text>
        <Text style={styles.feeLine}>Due:  ₹{feeInfo.totalDue}</Text>
      </View>

      {/* Recent Payments */}
      <View style={styles.glassCard}>
        <Text style={styles.sectionTitle}>Recent Payments</Text>
        {recentPayments.length === 0 ? (
          <Text style={styles.emptyText}>No recent payments</Text>
        ) : (
          recentPayments.slice(0, 3).map((p, idx) => (
            <Text key={idx} style={styles.listItem}>• ₹{p.amountPaid} on {new Date(p.paymentDate).toLocaleDateString()}</Text>
          ))
        )}
      </View>

      {/* Recent Results */}
      <View style={styles.glassCard}>
        <Text style={styles.sectionTitle}>Recent Results</Text>
        {recentResults.length === 0 ? (
          <Text style={styles.emptyText}>No results yet</Text>
        ) : (
          recentResults.slice(0, 3).map((r, idx) => (
            <Text key={idx} style={styles.listItem}>
              {r.examName} – {r.subject}: {r.score}/{r.maxScore}
            </Text>
          ))
        )}
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 20,
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    paddingTop: 40, // For safe area if needed
    backgroundColor: '#2C497F',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFB300',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconButtonOutline: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyContainer: {
    flex: 1,
    marginTop: -20,
    paddingHorizontal: 16,
  },
  glassCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius,
    padding: 20,
    marginBottom: 16,
    ...Shadows.soft,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  attendanceValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: Colors.primary,
  },
  feeLine: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  listItem: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: "italic",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  errorText: {
    color: "red",
    fontSize: 16,
  },
});
