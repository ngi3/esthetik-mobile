// app/(pro)/depenses.tsx
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import expenseService from '../../services/expense.service';
import { Expense } from '../../types/expense.types';
import { toast } from '../../utils/toast';

const categories = [
  { label: 'Produits', value: 'Produits' },
  { label: 'Transport', value: 'Transport' },
  { label: 'Matériel', value: 'Matériel' },
  { label: 'Formation', value: 'Formation' },
  { label: 'Loyer', value: 'Loyer' },
  { label: 'Publicité', value: 'Publicité' },
];

export default function ExpensesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState('Produits');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: 'Dépenses' });
  }, [navigation]);

  useEffect(() => {
    loadExpenses();
    loadMonthlyStats();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
      loadMonthlyStats();
    }, [])
  );

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseService.getMyExpenses();
      setExpenses(data);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Impossible de charger les dépenses');
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyStats = async () => {
    try {
      const stats = await expenseService.getMonthlyStats();
      setMonthlyTotal(stats.total);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    await loadMonthlyStats();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // On Android, close picker automatically after selection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    // On iOS, keep picker open until user manually closes it with "Terminé" button
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleAddExpense = async () => {
    if (!description || !amount || !date || !user?.id) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      await expenseService.createExpense({
        category,
        description,
        amount: parseFloat(amount),
        date: date.toISOString().split('T')[0], // Format YYYY-MM-DD
        professionalId: user.id,
      });

  toast.success(`${description} ajoutée !`);
      setModalVisible(false);

      // Réinitialiser
      setDescription('');
      setAmount('');
      setDate(null);
      setCategory('Produits');

      // Recharger les données
      await loadExpenses();
      await loadMonthlyStats();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Impossible d'ajouter la dépense");
    }
  };

  const handleDelete = (expense: Expense) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer cette dépense ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await expenseService.deleteExpense(expense.id);
              toast.success('Dépense supprimée');
              await loadExpenses();
              await loadMonthlyStats();
            } catch (error: any) {
              toast.error(error?.response?.data?.message || 'Impossible de supprimer la dépense');
            }
          },
        },
      ]
    );
  };

  const formatAmount = (amount: number): string => {
    return `${amount.toLocaleString('fr-FR')} XOF`;
  };

  const formatDisplayDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  };

  if (loading && expenses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E64A19" />
        <Text style={styles.loadingText}>Chargement des dépenses...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E64A19']} />
        }
      >
        {/* Total */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total des dépenses ce mois</Text>
          <Text style={styles.totalValue}>{formatAmount(monthlyTotal)}</Text>
        </View>

        {/* Bouton Nouvelle Dépense */}
        <TouchableOpacity
          style={styles.newExpenseButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.newExpenseText}>+ Nouvelle Dépense</Text>
        </TouchableOpacity>

        {expenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Aucune dépense</Text>
            <Text style={styles.emptySubtext}>Ajoutez votre première dépense</Text>
          </View>
        ) : (
          /* Liste des dépenses */
          expenses.map((expense) => (
            <View key={expense.id} style={styles.expenseCard}>
              <View style={styles.leftSection}>
                <View style={styles.iconWrapper}>
                  <Ionicons name="wallet-outline" size={22} color="#4CAF50" />
                </View>
                <View style={styles.info}>
                  <Text style={styles.category}>{expense.category}</Text>
                  <Text style={styles.description}>{expense.description}</Text>
                  <View style={styles.dateRow}>
                    <Ionicons name="calendar-outline" size={14} color="#999" />
                    <Text style={styles.date}>{formatDisplayDate(expense.date)}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.rightSection}>
                <Text style={styles.price}>{formatAmount(expense.amount)}</Text>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(expense)}>
                  <Ionicons name="trash-outline" size={20} color="#E53935" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
  </ScrollView>

      {/* MODAL AJOUT DÉPENSE */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter une Dépense</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Catégorie */}
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={category}
                onValueChange={(itemValue) => setCategory(itemValue)}
                style={styles.picker}
                dropdownIconColor="#2196F3"
              >
                {categories.map((cat) => (
                  <Picker.Item
                    key={cat.value}
                    label={cat.label}
                    value={cat.value}
                  />
                ))}
              </Picker>
            </View>

            {/* Description */}
            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
            />

            {/* Montant */}
            <TextInput
              style={styles.input}
              placeholder="Montant (XOF)"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            {/* Date Picker */}
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, date && { color: '#333' }]}>
                {date ? formatDate(date) : 'dd/mm/yyyy'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#666" />
            </TouchableOpacity>

            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={date || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.doneButtonText}>Terminé</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Bouton Ajouter */}
            <TouchableOpacity
              style={[
                styles.addButton,
                (!description || !amount || !date) && styles.addButtonDisabled,
              ]}
              onPress={handleAddExpense}
              disabled={!description || !amount || !date}
            >
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#fdf8f5',
  },

  totalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 2,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E64A19',
    marginTop: 4,
  },

  newExpenseButton: {
    backgroundColor: '#E64A19',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'flex-end',
    marginBottom: 24,
    elevation: 2,
  },
  newExpenseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },

  expenseCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },

  leftSection: { flexDirection: 'row', flex: 1 },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  info: { flex: 1 },
  category: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },

  rightSection: { alignItems: 'flex-end' },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#E64A19',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdf8f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fdf8f5',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },

  pickerContainer: {
    borderWidth: 2,
    borderColor: '#2196F3',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },

  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
    color: '#999',
  },

  addButton: {
    backgroundColor: '#E64A19',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  doneButton: {
    backgroundColor: '#E64A19',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
