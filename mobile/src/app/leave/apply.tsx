import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { Colors, BorderRadius, Shadows } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api'; // assuming an api service exists

export default function ApplyLeaveScreen() {
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveType, setLeaveType] = useState('Sick Leave'); // default
  const [reason, setReason] = useState('Fever'); // default
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!leaveDate) {
      Alert.alert('Error', 'Please select a leave date');
      return;
    }
    
    setLoading(true);
    try {
      // API call to the backend
      // await api.post('/api/leave', { type: leaveType, startDate: leaveDate, endDate: leaveDate, reason });
      
      Alert.alert('Success', 'Leave applied successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to apply leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerTitle: "Apply Leave",
          headerStyle: { backgroundColor: '#2C497F' }, // dark blue from screenshot
          headerTintColor: '#fff',
          headerBackTitleVisible: false,
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          
          {/* Warning Box */}
          <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={20} color="#D32F2F" style={styles.warningIcon} />
            <Text style={styles.warningText}>Note : Apply Today's Leave before 00:00 AM</Text>
          </View>

          {/* Sub Header */}
          <View style={styles.subHeader}>
            <Ionicons name="calendar-outline" size={20} color="#2C497F" />
            <Text style={styles.subHeaderText}>You can apply one day leave only</Text>
          </View>

          {/* Leave Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Leave Date</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="calendar" size={20} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9E9E9E"
                value={leaveDate}
                onChangeText={setLeaveDate}
              />
            </View>
          </View>

          {/* Leave Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Leave Type</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="options-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Select Leave Type"
                placeholderTextColor="#9E9E9E"
                value={leaveType}
                onChangeText={setLeaveType}
              />
              <Ionicons name="caret-down" size={16} color="#9E9E9E" style={styles.dropdownIcon} />
            </View>
          </View>

          {/* Leave Reason */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Leave Reason</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="chatbubble-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput 
                style={styles.input}
                placeholder="Select Leave Reason"
                placeholderTextColor="#9E9E9E"
                value={reason}
                onChangeText={setReason}
              />
              <Ionicons name="caret-down" size={16} color="#9E9E9E" style={styles.dropdownIcon} />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>{loading ? 'SUBMITTING...' : 'SUBMIT'}</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2C497F', // Background matches header color outside the card
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    minHeight: '100%',
    ...Shadows.soft,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningIcon: {
    marginRight: 8,
  },
  warningText: {
    color: '#D32F2F',
    fontSize: 13,
    fontWeight: '500',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    paddingBottom: 16,
  },
  subHeaderText: {
    marginLeft: 10,
    color: '#2C497F',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    height: '100%',
  },
  dropdownIcon: {
    marginLeft: 10,
  },
  submitButton: {
    backgroundColor: '#2C497F',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...Shadows.soft,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
