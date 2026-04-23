<template>
  <div class="space-y-6">
    <!-- Back Link -->
    <NuxtLink
      to="/"
      class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
    >
      <Icon name="heroicons:arrow-left-solid" class="w-4 h-4" />
      Back to Dashboard
    </NuxtLink>

    <!-- Loading State -->
    <div v-if="store.isLoading" class="flex items-center justify-center py-20">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>

    <!-- Error State -->
    <div
      v-else-if="store.error"
      class="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm"
    >
      {{ store.error }}
    </div>

    <!-- Main Content -->
    <template v-else-if="transaction">
      <!-- Header Card -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Transaction Details</h2>
            <p class="text-sm text-gray-400 mt-1">ID: {{ transaction._id }}</p>
          </div>
          <span
            :class="[
              'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium self-start',
              stageBadgeClass(transaction.stage),
            ]"
          >
            {{ stageLabel(transaction.stage) }}
          </span>
        </div>

        <!-- Property & Agent Info -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <!-- Property -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="heroicons:home-modern-solid" class="w-4 h-4 text-gray-500" />
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Property</span>
            </div>
            <template v-if="propertyData">
              <p class="font-semibold text-gray-800">{{ propertyData.address }}</p>
              <p class="text-sm text-gray-500">{{ propertyData.city }}, {{ propertyData.postcode }}</p>
            </template>
            <p v-else class="text-sm text-gray-400">{{ transaction.propertyId }}</p>
          </div>

          <!-- Listing Agent -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="heroicons:user-solid" class="w-4 h-4 text-teal-500" />
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Listing Agent</span>
            </div>
            <template v-if="listingAgent">
              <p class="font-semibold text-gray-800">{{ listingAgent.firstName }} {{ listingAgent.lastName }}</p>
              <p class="text-sm text-gray-500">{{ listingAgent.email }}</p>
            </template>
            <p v-else class="text-sm text-gray-400">{{ transaction.listingAgentId }}</p>
          </div>

          <!-- Selling Agent -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <Icon name="heroicons:user-solid" class="w-4 h-4 text-orange-500" />
              <span class="text-xs font-medium text-gray-500 uppercase tracking-wide">Selling Agent</span>
            </div>
            <template v-if="sellingAgent">
              <p class="font-semibold text-gray-800">{{ sellingAgent.firstName }} {{ sellingAgent.lastName }}</p>
              <p class="text-sm text-gray-500">{{ sellingAgent.email }}</p>
            </template>
            <p v-else class="text-sm text-gray-400">{{ transaction.sellingAgentId }}</p>
          </div>
        </div>

        <!-- Financial Info -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Agreed Price</p>
            <p class="text-lg font-bold text-gray-900 mt-1">{{ formatCurrency(transaction.agreedPrice) }}</p>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Service Fee</p>
            <p class="text-lg font-bold text-gray-900 mt-1">{{ formatCurrency(transaction.totalServiceFee) }}</p>
          </div>
          <div v-if="transaction.buyerName" class="text-center p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Buyer</p>
            <p class="text-lg font-semibold text-gray-900 mt-1">{{ transaction.buyerName }}</p>
          </div>
          <div v-if="transaction.buyerEmail" class="text-center p-3 bg-gray-50 rounded-lg">
            <p class="text-xs text-gray-500 uppercase tracking-wide">Buyer Email</p>
            <p class="text-sm font-medium text-gray-700 mt-2">{{ transaction.buyerEmail }}</p>
          </div>
        </div>
      </div>

      <!-- Stage Tracker -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 class="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Stage Progress</h3>
        <TransactionStageTracker :current-stage="transaction.stage" />

        <!-- Advance Button -->
        <div v-if="!isCompleted" class="mt-6 flex items-center gap-3">
          <button
            :disabled="store.isAdvancing"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
            @click="handleAdvance"
          >
            <div v-if="store.isAdvancing" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            <Icon v-else name="heroicons:forward-solid" class="w-4 h-4" />
            {{ store.isAdvancing ? 'Advancing...' : 'Advance Stage' }}
          </button>
        </div>
      </div>

      <!-- Commission Breakdown (only when completed) -->
      <CommissionBreakdownPanel
        v-if="isCompleted && transaction.commissionBreakdown"
        :breakdown="transaction.commissionBreakdown"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { useTransactionsStore } from '~/stores/transactions.store';
import { TransactionStage } from '~/types';
import type { Agent, Property } from '~/types';

const route = useRoute();
const store = useTransactionsStore();

const id = computed(() => {
  const param = route.params.id;
  return Array.isArray(param) ? param[0] : param;
});

useHead({ title: computed(() => `Transaction ${id.value} — EstateComm`) });

onMounted(() => {
  store.fetchOne(id.value);
});

const transaction = computed(() => store.currentTransaction);

const isCompleted = computed(
  () => transaction.value?.stage === TransactionStage.COMPLETED,
);

const propertyData = computed((): Property | null => {
  const prop = transaction.value?.propertyId;
  if (prop && typeof prop === 'object' && '_id' in prop) return prop;
  return null;
});

const listingAgent = computed((): Agent | null => {
  const agent = transaction.value?.listingAgentId;
  if (agent && typeof agent === 'object' && '_id' in agent) return agent;
  return null;
});

const sellingAgent = computed((): Agent | null => {
  const agent = transaction.value?.sellingAgentId;
  if (agent && typeof agent === 'object' && '_id' in agent) return agent;
  return null;
});

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

async function handleAdvance(): Promise<void> {
  try {
    await store.advanceStage(id.value);
  } catch {
    // Error is already handled by the store
  }
}
</script>
