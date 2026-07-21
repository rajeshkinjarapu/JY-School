// src/screens/DashboardScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { fetchStudentDashboard, StudentDashboardData } from "../services/dashboard";
import { Colors, Gradients, BorderRadius, Shadows } from "../theme";

const DashboardScreen = () => {
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
      {/* Attendance Card */}
      <View style={styles.glassCard}>
        <Text style={styles.sectionTitle}>Today's Attendance</Text>
        <Text style={styles.attendanceValue}>{attendanceToday}%</Text>
      </View>

      {/* Fee Card */}
      <View style={styles.glassCard}>
        <Text style={styles.sectionTitle}>Fees</Text>
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
            <Text key={idx} style={styles.listItem}>• {p.amountPaid} on {new Date(p.paymentDate).toLocaleDateString()}</Text>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    alignItems: "center",
  },
  glassCard: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius,
    padding: 20,
    marginBottom: 16,
    ...Shadows.soft,
    backgroundImage: Gradients.card,
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
    marginBottom: 2,
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

export default DashboardScreen;
