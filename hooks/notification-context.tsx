import bookingService from '@/services/booking.service';
import notificationService from '@/services/notification.service';
import { computeEveReminder, configureForegroundNotifications, registerForPushNotificationsAsync, scheduleReminderLocal } from '@/utils/notifications';
import { toast } from '@/utils/toast';
import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './useAuth';

type NotificationContextType = Record<string, never>;

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const lastRegisteredTokenRef = useRef<string | null>(null);
  const receivedListenerRef = useRef<any>(null);
  const responseListenerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    // In Expo Go, avoid importing expo-notifications to prevent runtime warnings/errors about remote push
    if (Constants?.appOwnership === 'expo') {
      return () => {
        mounted = false;
      };
    }
    // Foreground listener: show a toast for incoming notifications
    (async () => {
      await configureForegroundNotifications();
      const Notifications = await import('expo-notifications');
      if (!mounted) return;
      receivedListenerRef.current = Notifications.addNotificationReceivedListener((notification: any) => {
        const title = notification.request.content.title || 'Notification';
        const body = notification.request.content.body || '';
        toast.info(body || title, { title });
      });

      responseListenerRef.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
        // Optionally, navigate based on data
        // const data = response.notification.request.content.data as any;
      });
    })();

    return () => {
      mounted = false;
      if (receivedListenerRef.current) receivedListenerRef.current.remove();
      if (responseListenerRef.current) responseListenerRef.current.remove();
    };
  }, []);

  useEffect(() => {
    // Register push token when authenticated
    const setup = async () => {
      if (!isAuthenticated || !user) {
        if (lastRegisteredTokenRef.current) {
          try {
            await notificationService.unregisterDevice(lastRegisteredTokenRef.current);
          } catch {}
          lastRegisteredTokenRef.current = null;
        }
        return;
      }
      const { token, error } = await registerForPushNotificationsAsync();
      if (error) {
        toast.info(error, { title: 'Notifications' });
      }
      if (token && token !== lastRegisteredTokenRef.current) {
        lastRegisteredTokenRef.current = token;
        await notificationService.registerDevice(token);
      }

  // Schedule local reminders for upcoming bookings (eve of appointment)
  // To prevent duplicate local notifications when provider re-runs (e.g., auth state refresh),
  // maintain a simple in-memory set of booking IDs we already scheduled during this session.
  // (For persistence across cold restarts you could store in AsyncStorage with an expiry keyed by date.)
      try {
        const norm = (s?: string) => (s || '').toLowerCase();
        const isConfirmed = (s?: string) => ['confirmed', 'confirmé', 'approved', 'accepted'].includes(norm(s));

        const bookings = user.role === 'professionnel'
          ? await bookingService.getBookingsByProfessional(user.id)
          : await bookingService.getMyBookings();

        const scheduledIds = new Set<string>();
        for (const b of bookings) {
          if (!(b as any)?.appointmentDate && !(b as any)?.dateTime) continue;
          const dateIso = (b as any).appointmentDate || (b as any).dateTime;
          if (!isConfirmed((b as any).status)) continue;
          const bookingId = (b as any).id ?? `${dateIso}`;
          if (scheduledIds.has(bookingId)) continue; // already scheduled this session
          const when = computeEveReminder(dateIso);
          if (when) {
            const title = 'Rappel de rendez-vous';
            const body = `Rendez-vous demain à ${new Date(dateIso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
            await scheduleReminderLocal(when, title, body);
            scheduledIds.add(bookingId);
          }
        }
      } catch {
        // ignore scheduling failures
      }
    };

    setup();
  }, [isAuthenticated, user]);

  const value = useMemo(() => ({}), []);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};
