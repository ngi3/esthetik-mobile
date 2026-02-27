import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import { usePathname, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import bookingService from '../services/booking.service';

const menu = [
  { label: 'Aperçu', icon: 'home-outline', route: '/(pro)/dashboard' },
  { label: 'RDV', icon: 'calendar-outline', route: '/(pro)/rdv' },
  { label: 'Validation', icon: 'checkmark-circle-outline', route: '/(pro)/validation' },
  { label: 'Services', icon: 'cut-outline', route: '/(pro)/services' },
  { label: 'Portfolio', icon: 'images-outline', route: '/(pro)/portfolio' },
  { label: 'Avis', icon: 'star-outline', route: '/(pro)/avis' },
  { label: 'Dépenses', icon: 'card-outline', route: '/(pro)/depenses' },
];

export default function ProDrawerContent(props: any) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);

  const loadCounts = useCallback(async () => {
    if (!user?.id) return;

    try {
      const bookings = await bookingService.getBookingsByProfessional(user.id);

      const pending = bookings.filter((b: any) =>
        b.status.toLowerCase() === 'en attente' || b.status.toLowerCase() === 'pending'
      ).length;

      const confirmed = bookings.filter((b: any) =>
        b.status.toLowerCase() === 'confirmé' || b.status.toLowerCase() === 'confirmed'
      ).length;

      setPendingCount(pending);
      setConfirmedCount(confirmed);
    } catch (error) {
      console.error('Erreur chargement compteurs:', error);
    }
  }, [user?.id]);

  // Charger au montage
  useEffect(() => {
    loadCounts();
    // Recharger périodiquement toutes les 5 secondes pour capturer les changements
    const interval = setInterval(loadCounts, 5000);
    return () => clearInterval(interval);
  }, [loadCounts]);

  // Recharger quand le drawer devient visible
  useFocusEffect(
    React.useCallback(() => {
      loadCounts();
    }, [loadCounts])
  );

  const isActive = (route: string) => {
    if (!pathname) return false;

    // Extract the screen name from the route (e.g., '/(pro)/dashboard' -> '/dashboard')
    const screenName = route.split('/').pop();

    // Check if current pathname ends with the screen name
    if (pathname === `/${screenName}` || pathname.endsWith(`/${screenName}`)) {
      return true;
    }

    return false;
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            props.navigation.closeDrawer();
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 30, flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.logo}>Esthetik</Text>
      </View>
      <View style={styles.menu}>
        {menu.map((item) => {
          // Déterminer le compteur à afficher
          let badgeCount = 0;
          if (item.label === 'Validation') badgeCount = pendingCount;
          if (item.label === 'RDV') badgeCount = confirmedCount;
          const active = isActive(item.route);

          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuItem, active && styles.activeItem]}
              onPress={() => {
                props.navigation.closeDrawer();
                router.replace(item.route);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.row}>
                <Ionicons
                  name={item.icon as any}
                  size={22}
                  color={active ? '#E64A19' : '#888'}
                />
                <Text style={[styles.label, active && styles.activeLabel]}>
                  {item.label}
                </Text>
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badgeCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Logout button at the bottom */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#E53935" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, marginBottom: 20 },
  logo: { fontSize: 22, fontWeight: 'bold', color: '#E64A19' },
  menu: { flex: 1 },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  label: { marginLeft: 12, fontSize: 16, color: '#666', flex: 1, minWidth: 100 },
  activeLabel: { color: '#E64A19', fontWeight: '700' },
  activeItem: { backgroundColor: '#FFF5F5' },
  badge: {
    backgroundColor: '#E64A19',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 16, paddingBottom: 20, paddingHorizontal: 16 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#FFEBEE', borderRadius: 12 },
  logoutText: { marginLeft: 12, fontSize: 16, color: '#E53935', fontWeight: '600' },
});
