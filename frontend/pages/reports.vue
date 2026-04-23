<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Financial Reports</h2>
        <p class="text-sm text-gray-500 mt-1">Overview of completed transactions and earnings</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.isLoading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>

    <template v-else>
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p class="text-sm font-medium text-gray-500">Total Revenue (Agreed Prices)</p>
          <p class="text-3xl font-bold text-gray-900 mt-2">{{ formatCurrency(totalRevenue) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 border-l-4 border-l-emerald-500">
          <p class="text-sm font-medium text-gray-500">Total Agency Earnings</p>
          <p class="text-3xl font-bold text-emerald-600 mt-2">{{ formatCurrency(totalAgencyEarnings) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 border-l-4 border-l-blue-500">
          <p class="text-sm font-medium text-gray-500">Total Agents Earnings</p>
          <p class="text-3xl font-bold text-blue-600 mt-2">{{ formatCurrency(totalAgentsEarnings) }}</p>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
        <div class="px-6 py-4 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-800">Completed Transactions</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50/50">
                <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
                <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date Completed</th>
                <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agreed Price</th>
                <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Total Fee</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="completedTx.length === 0">
                <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                  No completed transactions found.
                </td>
              </tr>
              <tr v-for="tx in completedTx" :key="tx._id" class="hover:bg-gray-50/50 transition-colors">
                <td class="px-6 py-4">
                  <p class="text-sm font-medium text-gray-900">{{ getProperty(tx)?.address || 'Unknown Property' }}</p>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ formatDate(tx.updatedAt) }}
                </td>
                <td class="px-6 py-4 text-sm font-medium text-gray-800">
                  {{ formatCurrency(tx.agreedPrice) }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600 text-right">
                  {{ formatCurrency(tx.totalServiceFee) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useTransactionsStore } from '~/stores/transactions.store';
import type { Transaction, Property } from '~/types';

useHead({ title: 'Financial Reports — EstateComm' });

const store = useTransactionsStore();

onMounted(() => {
  store.$reset();
  store.fetchAll();
});

const completedTx = computed(() => store.completedTransactions);

const totalRevenue = computed(() => {
  return completedTx.value.reduce((sum, tx) => sum + tx.agreedPrice, 0);
});

const totalAgencyEarnings = computed(() => {
  return completedTx.value.reduce((sum, tx) => sum + (tx.commissionBreakdown?.agencyAmount || 0), 0);
});

const totalAgentsEarnings = computed(() => {
  return completedTx.value.reduce((sum, tx) => {
    const agentsTotal = tx.commissionBreakdown?.agentEntries.reduce((aSum, entry) => aSum + entry.amount, 0) || 0;
    return sum + agentsTotal;
  }, 0);
});

function getProperty(tx: Transaction): Property | null {
  if (tx.propertyId && typeof tx.propertyId === 'object' && '_id' in tx.propertyId) {
    return tx.propertyId;
  }
  return null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}
</script>
