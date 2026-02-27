import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const isExpoGo = () => Constants?.appOwnership === 'expo';

async function getNotifications() {
  return await import('expo-notifications');
}

// Configure how notifications behave when the app is foregrounded (call on app start)
export async function configureForegroundNotifications() {
  if (isExpoGo()) return; // Avoid importing the module in Expo Go to prevent remote-push warnings
  const Notifications = await getNotifications();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false, // we'll show our own toast in foreground
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<{ token?: string; error?: string }> {
  try {
    let token: string | undefined;

    if (!Device.isDevice) {
      return { error: 'Push notifications require a physical device.' };
    }

    // Remote push (especially on Android) is not supported in Expo Go since SDK 53
    if (isExpoGo()) {
      return { error: 'Remote push requires a Development Build (not Expo Go). See https://expo.fyi/dev-client' };
    }

    const Notifications = await getNotifications();
    // Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { error: 'Notification permission not granted.' };
    }

    // Prefer passing projectId explicitly to avoid token issues in dev builds
    const projectId = (Constants as any)?.expoConfig?.extra?.eas?.projectId
      || (Constants as any)?.easConfig?.projectId;
    const pushTokenData = await (await getNotifications()).getExpoPushTokenAsync(
      projectId ? { projectId } : undefined as any,
    );
    token = pushTokenData.data;

    return { token };
  } catch (e: any) {
    return { error: e?.message || 'Failed to register for notifications' };
  }
}

export async function scheduleReminderLocal(date: Date, title: string, body: string) {
  if (date.getTime() <= Date.now()) return;
  if (isExpoGo()) return; // skip in Expo Go to avoid importing the module and triggering warnings
  try {
    const Notifications = await getNotifications();
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      // New trigger API requires an object with an explicit type
      trigger: { type: 'date', date },
    });
  } catch {
    // ignore scheduling errors gracefully
  }
}

export function computeEveReminder(appointmentIso: string): Date | null {
  try {
    const appt = new Date(appointmentIso);
    const eve = new Date(appt);
    // Go to day before
    eve.setDate(appt.getDate() - 1);
    // Set to 09:00 local
    eve.setHours(9, 0, 0, 0);
    if (eve.getTime() <= Date.now()) return null;
    return eve;
  } catch {
    return null;
  }
}
