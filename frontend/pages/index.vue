<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p class="text-sm text-gray-500 mt-1">Overview of all transactions</p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-400">{{ transactions.length }} transactions</span>
        <NuxtLink
          to="/transactions/new"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Icon name="heroicons:plus-solid" class="w-4 h-4" />
          New Transaction
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.isLoading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="store.error"
      class="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center"
    >
      <Icon name="heroicons:exclamation-triangle-solid" class="w-12 h-12 text-amber-400 mx-auto" />
      <h3 class="mt-4 text-lg font-medium text-gray-700">Something went wrong</h3>
      <p class="mt-1 text-sm text-gray-400 max-w-md mx-auto">
        Unable to connect to the server or load data. Please try again later.
      </p>
      <button
        class="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        @click="store.fetchAll()"
      >
        <Icon name="heroicons:arrow-path-solid" class="w-4 h-4" />
        Retry
      </button>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="transactions.length === 0"
      class="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center"
    >
      <Icon name="heroicons:folder-open-solid" class="w-12 h-12 text-gray-300 mx-auto" />
      <h3 class="mt-4 text-lg font-medium text-gray-700">No transactions yet</h3>
      <p class="mt-1 text-sm text-gray-400">Transactions will appear here once created via the API.</p>
    </div>

    <!-- Transactions Table -->
    <div
      v-else
      class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/50">
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Property</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Agreed Price</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service Fee</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr
              v-for="tx in transactions"
              :key="tx._id"
              class="hover:bg-gray-50/50 transition-colors"
            >
              <!-- Property -->
              <td class="px-6 py-4">
                <template v-if="getProperty(tx)">
                  <p class="text-sm font-medium text-gray-900">{{ getProperty(tx)!.address }}</p>
                  <p class="text-xs text-gray-400">{{ getProperty(tx)!.city }}</p>
                </template>
                <span v-else class="text-sm text-gray-400 font-mono">{{ getPropertyId(tx) }}</span>
              </td>

              <!-- Agreed Price -->
              <td class="px-6 py-4 text-sm font-medium text-gray-800">
                {{ formatCurrency(tx.agreedPrice) }}
              </td>

              <!-- Service Fee -->
              <td class="px-6 py-4 text-sm text-gray-600">
                {{ formatCurrency(tx.totalServiceFee) }}
              </td>

              <!-- Stage Badge -->
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    stageBadgeClass(tx.stage),
                  ]"
                >
                  {{ stageLabel(tx.stage) }}
                </span>
              </td>

              <!-- View Button -->
              <td class="px-6 py-4 text-right">
                <NuxtLink
                  :to="`/transactions/${tx._id}`"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  View
                  <Icon name="heroicons:arrow-right-solid" class="w-4 h-4" />
                </NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTransactionsStore } from '~/stores/transactions.store';
import { TransactionStage } from '~/types';
import type { Transaction, Property } from '~/types';

useHead({ title: 'Dashboard — EstateComm' });

const store = useTransactionsStore();

onMounted(() => {
  store.fetchAll();
});

const transactions = computed(() => store.transactions);

function getProperty(tx: Transaction): Property | null {
  if (tx.propertyId && typeof tx.propertyId === 'object' && '_id' in tx.propertyId) {
    return tx.propertyId;
  }
  return null;
}

function getPropertyId(tx: Transaction): string {
  return typeof tx.propertyId === 'string' ? tx.propertyId : tx.propertyId._id;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function stageLabel(stage: TransactionStage): string {
  const labels: Record<TransactionStage, string> = {
    [TransactionStage.AGREEMENT]: 'Agreement',
    [TransactionStage.EARNEST_MONEY]: 'Earnest Money',
    [TransactionStage.TITLE_DEED]: 'Title Deed',
    [TransactionStage.COMPLETED]: 'Completed',
  };
  return labels[stage];
}

function stageBadgeClass(stage: TransactionStage): string {
  const classes: Record<TransactionStage, string> = {
    [TransactionStage.AGREEMENT]: 'bg-blue-100 text-blue-700',
    [TransactionStage.EARNEST_MONEY]: 'bg-amber-100 text-amber-700',
    [TransactionStage.TITLE_DEED]: 'bg-indigo-100 text-indigo-700',
    [TransactionStage.COMPLETED]: 'bg-emerald-100 text-emerald-700',
  };
  return classes[stage];
}
</script>
