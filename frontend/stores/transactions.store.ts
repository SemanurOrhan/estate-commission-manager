import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Transaction, ApiResponse, TransactionStage } from '~/types';

export const useTransactionsStore = defineStore('transactions', () => {
  // State
  const transactions = ref<Transaction[]>([]);
  const currentTransaction = ref<Transaction | null>(null);
  const total = ref(0);
  const isLoading = ref(false);
  const isAdvancing = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const completedTransactions = computed<Transaction[]>(() =>
    transactions.value.filter((t) => t.stage === 'completed'),
  );

  const transactionById = computed(() => {
    return (id: string): Transaction | undefined =>
      transactions.value.find((t) => t._id === id);
  });

  // Actions
  async function fetchAll(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const config = useRuntimeConfig();
      const response = await $fetch<ApiResponse<Transaction[]>>('/transactions', {
        baseURL: config.public.apiBase,
      });
      transactions.value = response.data;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch transactions.';
      error.value = message;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchOne(id: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const config = useRuntimeConfig();
      const response = await $fetch<ApiResponse<Transaction>>(`/transactions/${id}`, {
        baseURL: config.public.apiBase,
      });
      currentTransaction.value = response.data;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch transaction.';
      error.value = message;
    } finally {
      isLoading.value = false;
    }
  }

  async function advanceStage(id: string, notes?: string): Promise<void> {
    isAdvancing.value = true;
    error.value = null;
    try {
      const config = useRuntimeConfig();
      const response = await $fetch<ApiResponse<Transaction>>(`/transactions/${id}/advance`, {
        baseURL: config.public.apiBase,
        method: 'PATCH',
        body: { notes },
      });
      currentTransaction.value = response.data;

      // Listeden ilgili transactionu bulur ve günceller
      const idx = transactions.value.findIndex((t) => t._id === id);
      if (idx !== -1) {
        transactions.value[idx] = response.data;
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Stage transition failed.';
      error.value = message;
      throw err;
    } finally {
      isAdvancing.value = false;
    }
  }

  return {
    // State
    transactions,
    currentTransaction,
    total,
    isLoading,
    isAdvancing,
    error,
    // Getters
    completedTransactions,
    transactionById,
    // Actions
    fetchAll,
    fetchOne,
    advanceStage,
  };
});
