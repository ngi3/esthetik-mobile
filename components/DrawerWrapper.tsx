// components/DrawerWrapper.tsx
import { toast } from '@/utils/toast';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    DrawerLayoutAndroid,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

const DRAWER_WIDTH = 240;

interface DrawerWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showNewRdvButton?: boolean;
  onNewRdvPress?: () => void;
}

export default function DrawerWrapper({
  children,
  title,
  subtitle,
  showNewRdvButton = false,
  onNewRdvPress,
}: DrawerWrapperProps) {
  const drawerRef = useRef<DrawerLayoutAndroid>(null);
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isOpenRef = useRef(false);
  const lastPressRef = useRef(0);
  const pendingRouteRef = useRef<string | null>(null);

  const openDrawer = () => drawerRef.current?.openDrawer();
  const closeDrawer = () => drawerRef.current?.closeDrawer();

  const handleHamburgerPress = () => {
    // Prevent rapid double taps that can glitch the drawer state
    const now = Date.now();
    if (now - lastPressRef.current < 300) return;
    lastPressRef.current = now;

    if (Platform.OS !== 'android') {
      // Temporary fallback on iOS: avoid using DrawerLayoutAndroid
      toast.info('Le menu latéral est disponible sur Android. Arrive bientôt sur iOS.');
      return;
    }

    if (isOpenRef.current) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };

  const menuItems = [
    { label: 'Aperçu', icon: 'home-outline', route: '/(pro)/dashboard' },
    { label: 'RDV', icon: 'calendar-outline', route: '/(pro)/rdv' },
    { label: 'Validation', icon: 'checkmark-circle-outline', route: '/(pro)/validation' },
    { label: 'Services', icon: 'cut-outline', route: '/(pro)/services' },
    { label: 'Portfolio', icon: 'images-outline', route: '/(pro)/portfolio' },
    { label: 'Avis', icon: 'star-outline', route: '/(pro)/avis' },
    { label: 'Dépenses', icon: 'card-outline', route: '/(pro)/depenses' },
  ];

  const handleLogout = async () => {
    await logout();
    pendingRouteRef.current = '/(auth)/login';
    closeDrawer();
  };

  // Remplacer la comparaison stricte par une détection tolérante (supporte /route et /route/...)
  const isRouteActive = (route?: string) => {
    if (!route || !pathname) return false;
    if (pathname === route) return true;
    try {
      return pathname.startsWith(route.endsWith('/') ? route : route + '/');
    } catch {
      return false;
    }
  };

  const navigationView = () => (
    <View style={styles.drawerContainer}>
      <View style={styles.drawerLogo}>
        <Text style={styles.logoText}>Esthetik</Text>
      </View>

      <View style={styles.drawerMenu}>
        {menuItems.map((item) => {
          const isActive = isRouteActive(item.route);

          return (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.drawerMenuItem,
                isActive && styles.activeDrawerMenuItem,
              ]}
              onPress={() => {
                // Defer navigation until drawer is fully closed to avoid stuck states
                if (item.route) {
                  pendingRouteRef.current = item.route;
                }
                closeDrawer();
              }}
            >
              {isActive && <View style={styles.activeLeftIndicator} />}
              <Ionicons
                name={item.icon as any}
                size={24}
                color={isActive ? '#E64A19' : '#888'}
              />
              <Text
                style={[
                  styles.drawerMenuText,
                  isActive && styles.activeDrawerMenuText,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.logoutSeparator} />
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#E53935" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Close drawer when the route changes to avoid stuck overlay state
  useEffect(() => {
    if (isOpenRef.current) closeDrawer();
  }, [pathname]);

  // Cleanup on unmount to ensure drawer is closed
  useEffect(() => {
    return () => {
      if (isOpenRef.current) closeDrawer();
    };
  }, []);

  return (
    <DrawerLayoutAndroid
      ref={drawerRef}
      drawerWidth={DRAWER_WIDTH}
      drawerPosition="left"
      renderNavigationView={navigationView}
      drawerBackgroundColor="#fff"
  // Gestes autorisés (ouverture/fermeture via gestes et bouton)
  drawerLockMode="unlocked"
      // GESTE DE GLISSEMENT ACTIF
      onDrawerSlide={() => {
        // Optionally handle drawer sliding here if needed
      }}
      onDrawerOpen={() => {
        isOpenRef.current = true;
      }}
      onDrawerClose={() => {
        isOpenRef.current = false;
        if (pendingRouteRef.current) {
          const to = pendingRouteRef.current;
          pendingRouteRef.current = null;
          // Use replace for side navigation to avoid stacking
          router.replace(to);
        }
      }}
      onDrawerStateChanged={(state) => {
        // Useful for debugging stuck overlay issues
        // state: 'Idle' | 'Dragging' | 'Settling'
        // console.log('Drawer state:', state);
      }}
      // ÉVITE LES CONFLITS
      keyboardDismissMode="on-drag"
      statusBarBackgroundColor="#fff"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleHamburgerPress} style={styles.hamburger}>
            <Ionicons name="menu" size={28} color="#E64A19" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {showNewRdvButton && (
            <TouchableOpacity style={styles.newRdvButton} onPress={onNewRdvPress}>
              <Text style={styles.newRdvText}>+ Nouveau RDV</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ScrollView sécurisé */}
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === ScrollView) {
            return React.cloneElement(child as React.ReactElement<any>, {
              keyboardShouldPersistTaps: 'handled',
              nestedScrollEnabled: true,
              scrollEventThrottle: 16,
            });
          }
          return child;
        })}
      </SafeAreaView>
    </DrawerLayoutAndroid>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hamburger: { marginRight: 16 },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#E64A19' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  newRdvButton: {
    backgroundColor: '#E64A19',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  newRdvText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  drawerContainer: { flex: 1, backgroundColor: '#fff', paddingTop: 50, paddingHorizontal: 16 },
  drawerLogo: { marginBottom: 40 },
  logoText: { fontSize: 22, fontWeight: 'bold', color: '#E64A19' },

  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden', // empêche les débordements lors du highlight
  },
  activeDrawerMenuItem: {
    backgroundColor: '#FFF1E6', // fond plus contrasté (clair-orangé)
    marginLeft: -16, // étend la surbrillance jusqu'au bord du drawer
    marginRight: -16,
    paddingLeft: 22, // espace pour l'indicateur à gauche
    paddingRight: 16,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  activeLeftIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 6,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: '#E64A19',
  },
  drawerMenuText: {
    marginLeft: 14,
    fontSize: 16,
    color: '#888',
    flex: 1,
  },
  activeDrawerMenuText: {
    color: '#E64A19',
    fontWeight: '700',
  },

  drawerMenu: { flex: 1 },
  logoutSeparator: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  logoutText: { marginLeft: 14, fontSize: 16, color: '#E53935', fontWeight: '600' },
});
