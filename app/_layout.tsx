import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, useColorScheme, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { AppStatusProvider } from '../hooks/app-status';
import { NotificationProvider } from '../hooks/notification-context';
import { AuthProvider, useAuth } from '../hooks/useAuth';

function InnerLayout() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [initializing, setInitializing] = useState(true);
  const navigationRef = useRef({ lastAuthState: false, lastUserId: '' });

  // Wait for useAuth to load initial state
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (initializing) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentUserId = user?.id || '';

    // Check if auth state or user has changed
    const authStateChanged = navigationRef.current.lastAuthState !== isAuthenticated;
    const userChanged = navigationRef.current.lastUserId !== currentUserId;

    console.log('RootLayout - isAuthenticated:', isAuthenticated, 'user:', user, 'segments:', segments);

    // Only handle redirects when auth state changes or user changes
    if (authStateChanged || userChanged) {
      navigationRef.current.lastAuthState = isAuthenticated;
      navigationRef.current.lastUserId = currentUserId;

      if (!isAuthenticated && !inAuthGroup) {
        console.log('RootLayout - Redirecting to login (not authenticated)');
        router.replace('/(auth)/login');
      } else if (isAuthenticated && user && inAuthGroup) {
        // Only redirect from auth screens after successful login
        if (user.role === 'client') {
          console.log('RootLayout - Redirecting client to /(tabs)/home');
          router.replace('/(tabs)/home');
        } else if (user.role === 'professionnel') {
          console.log('RootLayout - Redirecting pro to /(pro)/dashboard');
          router.replace('/(pro)/dashboard');
        } else if (user.role === 'admin') {
          console.log('RootLayout - Redirecting admin to /(tabs)/home (web admin panel available)');
          router.replace('/(tabs)/home');
        }
      }
    }
  }, [initializing, isAuthenticated, user, segments, router]);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E64A19" />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppStatusProvider>
          <NotificationProvider>
            <InnerLayout />
          </NotificationProvider>
          <Toast position="top" topOffset={60} />
        </AppStatusProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
});
