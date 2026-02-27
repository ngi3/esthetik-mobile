// services/expense.service.ts
import { CreateExpenseDto, Expense, ExpenseStats, UpdateExpenseDto } from '../types/expense.types';
import api from './api';

class ExpenseService {
  /**
   * Récupérer toutes les dépenses du professionnel connecté
   */
  async getMyExpenses(): Promise<Expense[]> {
    try {
      const response = await api.get('/expenses');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching expenses:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Récupérer une dépense par ID
   */
  async getExpenseById(id: string): Promise<Expense> {
    try {
      const response = await api.get(`/expenses/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching expense:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Créer une nouvelle dépense
   */
  async createExpense(data: CreateExpenseDto): Promise<Expense> {
    try {
      const response = await api.post('/expenses', data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating expense:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Mettre à jour une dépense
   */
  async updateExpense(id: string, data: UpdateExpenseDto): Promise<Expense> {
    try {
      const response = await api.put(`/expenses/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Error updating expense:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Supprimer une dépense
   */
  async deleteExpense(id: string): Promise<void> {
    try {
      await api.delete(`/expenses/${id}`);
    } catch (error: any) {
      console.error('Error deleting expense:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques mensuelles (total du mois)
   */
  async getMonthlyStats(year?: number, month?: number): Promise<ExpenseStats> {
    try {
      const params: any = {};
      if (year) params.year = year;
      if (month) params.month = month;

      const response = await api.get('/expenses/stats', { params });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching expense stats:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new ExpenseService();
