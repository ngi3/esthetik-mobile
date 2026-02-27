import { Stack, router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStatus } from '../../hooks/app-status';

export default function OfflineScreen() {
  const { isConnected } = useAppStatus();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Hors ligne' }} />
      <Text style={styles.title}>Pas de connexion Internet</Text>
  <Text style={styles.message}>Veuillez vérifier votre connexion réseau. L&apos;application réessaiera automatiquement.</Text>
      <TouchableOpacity
        style={[styles.button, isConnected ? styles.buttonEnabled : styles.buttonDisabled]}
        disabled={!isConnected}
        onPress={() => {
          if (isConnected) {
            router.dismissAll();
          }
        }}
      >
        <Text style={styles.buttonText}>{isConnected ? 'Revenir' : 'En attente…'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#E64A19' },
  message: { fontSize: 16, lineHeight: 22, marginBottom: 32, color: '#444' },
  button: { paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonEnabled: { backgroundColor: '#E64A19' },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
