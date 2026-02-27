import NetInfo from '@react-native-community/netinfo';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { API_URL } from '../config/api.config';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  location?: string;
  role: 'client' | 'professionnel' | 'admin';
  salon?: string;
  specialities?: string[];
  verified?: boolean;
  rating?: number;
  reviews?: number;
  status?: 'online' | 'offline' | 'busy' | 'available';
  bannerImageUrl?: string;
  presentation?: string;
  bio?: string;
  openingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  login: (credentials: { email: string; password: string }) => Promise<{ ok: boolean; message?: string }>;
  signup: (userData: Omit<User, 'id'> & { password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const email = (credentials.email || '').trim().toLowerCase();
      const password = (credentials.password || '').trim();
      console.log('useAuth - Login attempt for:', email);
      const net = await NetInfo.fetch();
      if (!(net.isConnected && net.isInternetReachable !== false)) {
        return { ok: false, message: 'Pas de connexion Internet' };
      }
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      console.log('useAuth - Login successful, user role:', userData.role);
      await SecureStore.setItemAsync(TOKEN_KEY, access_token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      console.log('useAuth - State updated, user:', userData);
      return { ok: true };
    } catch (error: any) {
      const isNetwork = !error?.response;
      const serverMessage =
        error?.response?.data?.message || error?.response?.data?.error || (isNetwork ? 'Serveur injoignable' : error.message);
      console.error('Erreur de login:', error?.response?.data || error.message, 'API_URL:', API_URL);
      return { ok: false, message: serverMessage };
    }
  };

  const signup = async (userData: Omit<User, 'id'> & { password: string }) => {
    try {
      const payload = {
        ...userData,
        email: (userData.email || '').trim().toLowerCase(),
        password: (userData.password || '').trim(),
      } as typeof userData;
      console.log('useAuth - Registering user with role:', payload.role);
  await api.post('/auth/register', payload);

      const loginResponse = await api.post('/auth/login', {
        email: payload.email,
        password: payload.password,
      });

      const { access_token, user: loggedInUser } = loginResponse.data;
      console.log('useAuth - Signup successful, user role:', loggedInUser.role);
      await SecureStore.setItemAsync(TOKEN_KEY, access_token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(loggedInUser));
      setUser(loggedInUser);
      setIsAuthenticated(true);
      return true;
    } catch (error: any) {
      console.error('Erreur de signup:', error?.response?.data || error.message);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  };

  useEffect(() => {
    const loadAuthState = async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);

      if (token && userJson) {
        try {
          const userData = JSON.parse(userJson);
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err: any) {
          console.error('Erreur loading auth state:', err);
          setUser(null);
          setIsAuthenticated(false);
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          await SecureStore.deleteItemAsync(USER_KEY);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    };
    loadAuthState();
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, user, setUser, setIsAuthenticated, login, signup, logout }),
    [isAuthenticated, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
