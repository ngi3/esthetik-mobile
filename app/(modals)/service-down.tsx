import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppStatus } from '../../hooks/app-status';

export default function ServiceDownScreen() {
  const { backendDown, lastBackendError, isConnected } = useAppStatus();
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Service indisponible' }} />
      <Text style={styles.title}>Serveur indisponible</Text>
      <Text style={styles.message}>Nous rencontrons un problème pour communiquer avec le serveur. {lastBackendError || ''}</Text>
      <Text style={styles.sub}>Statut connexion: {isConnected ? 'En ligne' : 'Hors ligne'}</Text>
      <TouchableOpacity
        style={[styles.button, backendDown ? styles.buttonDisabled : styles.buttonEnabled]}
        disabled={backendDown}
        onPress={() => {
          // Will auto-dismiss when backendDown becomes false via provider effect
        }}
      >
        <Text style={styles.buttonText}>{backendDown ? 'Vérification…' : 'Revenir'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#E64A19' },
  message: { fontSize: 16, lineHeight: 22, marginBottom: 24, color: '#444' },
  sub: { fontSize: 14, color: '#666', marginBottom: 32 },
  button: { paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  buttonEnabled: { backgroundColor: '#E64A19' },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
