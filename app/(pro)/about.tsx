// app/(pro)/about.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/user.service';
import { toast } from '../../utils/toast';

const DAYS = [
  { key: 'monday', label: 'Lundi' },
  { key: 'tuesday', label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday', label: 'Jeudi' },
  { key: 'friday', label: 'Vendredi' },
  { key: 'saturday', label: 'Samedi' },
  { key: 'sunday', label: 'Dimanche' },
];

export default function AboutScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();
  const [presentation, setPresentation] = useState(user?.presentation || '');
  const [openingHours, setOpeningHours] = useState<Record<string, string>>(
    user?.openingHours || {}
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await userService.updateMe({
        presentation,
        openingHours,
      });
      setUser(updated);
      toast.success('Vos informations ont été mises à jour !');
      router.back();
    } catch (error) {
      console.error('Error saving about:', error);
      toast.error('Impossible de sauvegarder les informations');
    } finally {
      setSaving(false);
    }
  };

  const updateHours = (day: string, value: string) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: value,
    }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>À propos</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Présentation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Présentation</Text>
          <Text style={styles.sectionSubtitle}>
            Parlez de vous, de votre expérience et de vos prestations
          </Text>
          <TextInput
            style={styles.textArea}
            placeholder="Ex: Passionnée par l'art des ongles et les soins esthétiques, je vous accueille dans mon studio moderne à Cocody..."
            placeholderTextColor="#999"
            value={presentation}
            onChangeText={setPresentation}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Horaires d'ouverture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horaires d&apos;ouverture</Text>
          <Text style={styles.sectionSubtitle}>
            Indiquez vos horaires pour chaque jour de la semaine
          </Text>
          {DAYS.map((day) => (
            <View key={day.key} style={styles.dayRow}>
              <Text style={styles.dayLabel}>{day.label}</Text>
              <TextInput
                style={styles.hoursInput}
                placeholder="Ex: 09:00 - 18:00 ou Fermé"
                placeholderTextColor="#999"
                value={openingHours[day.key] || ''}
                onChangeText={(value) => updateHours(day.key, value)}
              />
            </View>
          ))}
        </View>

        {/* Bouton de sauvegarde */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    width: 100,
  },
  hoursInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#333',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E64A19',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
