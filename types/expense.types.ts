// types/expense.types.ts

export interface Expense {
  id: string; // UUID
  category: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  professionalId: string; // UUID
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseDto {
  category: string;
  description: string;
  amount: number;
  date: string; // ISO date string (YYYY-MM-DD)
  professionalId: string; // UUID
}

export interface UpdateExpenseDto {
  category?: string;
  description?: string;
  amount?: number;
  date?: string;
}

export interface ExpenseStats {
  year: number;
  month: number;
  total: number;
}
