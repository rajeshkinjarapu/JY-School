import React, { createContext, useEffect, useState } from 'react';
import type { User } from '../types';
import { getMe } from '../api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Merge profile photo into user.photoUrl if missing
const mergeProfilePhoto = (userData: any): any => {
  if (!userData) return userData;
  // Student: use student.photoUrl if user.photoUrl is empty
  if (userData.role === 'STUDENT' && !userData.photoUrl && userData.student?.photoUrl) {
    return { ...userData, photoUrl: userData.student.photoUrl };
  }
  // Teacher: use teacher.photoUrl if user.photoUrl is empty
  if (userData.role === 'TEACHER' && !userData.photoUrl && userData.teacher?.photoUrl) {
    return { ...userData, photoUrl: userData.teacher.photoUrl };
  }
  return userData;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const response = await getMe();
        const userData = response.data || response;
        setUser(mergeProfilePhoto(userData));
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser(mergeProfilePhoto(userData));
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    const merged = mergeProfilePhoto(updatedUser);
    setUser(merged);
    localStorage.setItem('user', JSON.stringify(merged));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
