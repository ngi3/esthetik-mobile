import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import ProDrawerContent from '../../components/ProDrawerContent';
import { useAuth } from '../../hooks/useAuth';

export default function ProLayout() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;

    console.log('ProLayout - Checking auth, user:', user);
    // Guard: Only professionals can access this area
    if (!isAuthenticated) {
      console.log('ProLayout - Not authenticated, redirecting to login');
      hasRedirected.current = true;
      router.replace('/(auth)/login');
    } else if (user && user.role !== 'professionnel') {
      console.log('ProLayout - User is not professional, redirecting to client tabs');
      hasRedirected.current = true;
      router.replace('/(tabs)/home');
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

  // If user is loaded but not a professional, show loading while redirecting
  if (user.role !== 'professionnel') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E64A19" />
      </View>
    );
  }

  return (
    <Drawer
      initialRouteName="dashboard"
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerTitleStyle: { color: '#E64A19', fontWeight: 'bold' },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={{ paddingHorizontal: 12 }}
          >
            <Ionicons name="menu" size={24} color="#E64A19" />
          </TouchableOpacity>
        ),
      })}
      drawerContent={(props) => <ProDrawerContent {...props} />}
    />
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
