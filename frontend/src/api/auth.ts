import api from './axios';

export const login = (data: any) => api.post('/api/auth/login', data);
export const register = (data: any) => api.post('/api/auth/register', data);
export const logout = () => api.post('/api/auth/logout');
export const getMe = () => api.get('/api/auth/me');
export const forgotPassword = (email: string) => api.post('/api/auth/forgot-password', { email });
export const resetPassword = (data: any) => api.post('/api/auth/reset-password', data);
export const changePassword = (data: any) => api.put('/api/auth/change-password', data);
export const updateProfile = (id: string, data: any) => api.put(`/api/users/${id}`, data);
