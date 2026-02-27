import Toast from 'react-native-toast-message';

export const toast = {
  success(message: string, params?: { title?: string; text2?: string; autoHide?: boolean; visibilityTime?: number }) {
    Toast.show({ type: 'success', text1: params?.title ?? 'Succès', text2: message || params?.text2, autoHide: params?.autoHide ?? true, visibilityTime: params?.visibilityTime ?? 2500 });
  },
  error(message: string, params?: { title?: string; text2?: string; autoHide?: boolean; visibilityTime?: number }) {
    Toast.show({ type: 'error', text1: params?.title ?? 'Erreur', text2: message || params?.text2, autoHide: params?.autoHide ?? true, visibilityTime: params?.visibilityTime ?? 3000 });
  },
  info(message: string, params?: { title?: string; text2?: string; autoHide?: boolean; visibilityTime?: number }) {
    Toast.show({ type: 'info', text1: params?.title ?? 'Info', text2: message || params?.text2, autoHide: params?.autoHide ?? true, visibilityTime: params?.visibilityTime ?? 2500 });
  },
};

export default toast;
