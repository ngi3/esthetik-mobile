import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { router, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { pingHealth } from '../services/health.service';
import statusBus from '../services/status-bus';

export type AppStatusContextType = {
  isConnected: boolean | null;
  backendDown: boolean;
  lastBackendError?: string;
  setBackendDown: (down: boolean, reason?: string) => void;
};

const AppStatusContext = createContext<AppStatusContextType | undefined>(undefined);

export function AppStatusProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [backendDown, setBackendDownState] = useState(false);
  const [lastBackendError, setLastBackendError] = useState<string | undefined>(undefined);
  const segments = useSegments();
  const navRef = useRef({ lastRoute: '' });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = !!(state.isConnected && state.isInternetReachable !== false);
      setIsConnected(connected);
    });
    return () => unsubscribe();
  }, []);

  // Listen to backend up/down events from axios
  useEffect(() => {
    const down = (reason?: string) => {
      setBackendDownState(true);
      setLastBackendError(reason);
    };
    const up = () => {
      setBackendDownState(false);
      setLastBackendError(undefined);
    };
    statusBus.on('backend:down', down);
    statusBus.on('backend:up', up);
    return () => {
      statusBus.off('backend:down', down);
      statusBus.off('backend:up', up);
    };
  }, []);

  // Navigate to appropriate modal screens based on status
  useEffect(() => {
    const path = `/${segments.join('/')}`;
    const inOffline = segments.includes('(modals)') && segments[segments.length - 1] === 'offline';
    const inServiceDown = segments.includes('(modals)') && segments[segments.length - 1] === 'service-down';

    // Offline takes priority
    if (isConnected === false && !inOffline) {
      navRef.current.lastRoute = path;
      router.push('/(modals)/offline');
      return;
    }

    // If back online and we were on offline screen, go back
    if (isConnected && inOffline) {
      // Always dismiss the modal when back online; avoid router.back() with empty stack
      router.dismissAll();
    }

    // Handle backend down page only when online but server unreachable
    if (isConnected && backendDown && !inServiceDown && !inOffline) {
      navRef.current.lastRoute = path;
      router.push('/(modals)/service-down');
      return;
    }

    if ((!backendDown || !isConnected) && inServiceDown) {
      // Always dismiss the modal; avoid router.back() when there's no stack
      router.dismissAll();
    }
  }, [isConnected, backendDown, segments]);

  // Heartbeat: when online but backendDown, ping /health periodically to auto-recover
  useEffect(() => {
    if (!isConnected || !backendDown) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      if (cancelled) return;
      const h = await pingHealth();
      if (h?.ok) {
        statusBus.setBackendUp();
      }
    }, 10000); // every 10s
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isConnected, backendDown]);

  const value = useMemo(
    () => ({
      isConnected,
      backendDown,
      lastBackendError,
      setBackendDown: (down: boolean, reason?: string) => {
        if (down) statusBus.setBackendDown(reason);
        else statusBus.setBackendUp();
      },
    }),
    [isConnected, backendDown, lastBackendError]
  );

  return <AppStatusContext.Provider value={value}>{children}</AppStatusContext.Provider>;
}

export function useAppStatus() {
  const ctx = useContext(AppStatusContext);
  if (!ctx) throw new Error('useAppStatus must be used within AppStatusProvider');
  return ctx;
}
