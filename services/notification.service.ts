import { Platform } from 'react-native';
import api from './api';

class NotificationService {
  async registerDevice(pushToken: string) {
    try {
      await api.post('/notifications/register', {
        token: pushToken,
        platform: Platform.OS,
      });
    } catch {
      // Silently ignore to avoid blocking UX; backend may not be ready yet
    }
  }

  async unregisterDevice(pushToken: string) {
    try {
      await api.post('/notifications/unregister', {
        token: pushToken,
      });
    } catch {
      // ignore
    }
  }
}

export default new NotificationService();
