import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export default function TabLayout() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;

    console.log('TabLayout - Checking auth, user:', user);
    // Guard: Only clients can access this area
    if (!isAuthenticated) {
      console.log('TabLayout - Not authenticated, redirecting to login');
      hasRedirected.current = true;
      router.replace('/(auth)/login');
    } else if (user && user.role !== 'client') {
      console.log('TabLayout - User is not client, redirecting to pro dashboard');
      hasRedirected.current = true;
      router.replace('/(pro)/dashboard');
    }
  }, [isAuthenticated, user, router]);

  // Show loading while checking auth - only if user is not loaded yet
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E64A19" />
      </View>
    );
  }

  // If user is loaded but not a client, show loading while redirecting
  if (user.role !== 'client') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E64A19" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'clientspace') {
            iconName = focused ? 'people' : 'people-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#E64A19',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="clientspace" options={{ title: 'Espace Client' }} />
    </Tabs>
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
