<template>
  <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 bg-emerald-50 border-b border-emerald-100">
      <div class="flex items-center gap-2">
        <Icon name="heroicons:banknotes-solid" class="w-5 h-5 text-emerald-600" />
        <h3 class="text-lg font-semibold text-emerald-800">Commission Breakdown</h3>
      </div>
      <p class="text-sm text-emerald-600 mt-1">
        Calculated at {{ formattedDate }}
      </p>
    </div>

    <!-- Body -->
    <div class="p-6 space-y-6">
      <!-- Total Service Fee -->
      <div class="flex items-center justify-between pb-4 border-b border-gray-100">
        <span class="text-sm font-medium text-gray-500">Total Service Fee</span>
        <span class="text-xl font-bold text-gray-900">{{ formatCurrency(breakdown.totalServiceFee) }}</span>
      </div>

      <!-- Split Visual -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Agency Share -->
        <div class="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div class="flex items-center gap-2 mb-2">
            <Icon name="heroicons:building-office-2-solid" class="w-4 h-4 text-slate-600" />
            <span class="text-sm font-medium text-slate-700">Agency Share</span>
          </div>
          <p class="text-2xl font-bold text-slate-900">{{ formatCurrency(breakdown.agencyAmount) }}</p>
          <p class="text-xs text-slate-500 mt-1">{{ breakdown.agencyPercentage }}% of total fee</p>
        </div>

        <!-- Agent Shares -->
        <div
          v-for="entry in breakdown.agentEntries"
          :key="entry.agentId"
          class="bg-blue-50 rounded-lg p-4 border border-blue-200"
        >
          <div class="flex items-center gap-2 mb-2">
            <Icon name="heroicons:user-solid" class="w-4 h-4 text-blue-600" />
            <span class="text-sm font-medium text-blue-700">{{ entry.agentName }}</span>
          </div>
          <p class="text-2xl font-bold text-blue-900">{{ formatCurrency(entry.amount) }}</p>
          <div class="flex items-center gap-2 mt-1">
            <span
              :class="[
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                entry.role === 'dual'
                  ? 'bg-purple-100 text-purple-700'
                  : entry.role === 'listing'
                    ? 'bg-teal-100 text-teal-700'
                    : 'bg-orange-100 text-orange-700',
              ]"
            >
              {{ roleLabel(entry.role) }}
            </span>
            <span class="text-xs text-blue-500">{{ entry.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CommissionBreakdown } from '~/types';

const props = defineProps<{
  breakdown: CommissionBreakdown;
}>();

const formattedDate = computed(() => {
  const date = new Date(props.breakdown.calculatedAt);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const verificationTotal = computed(() => {
  const agentTotal = props.breakdown.agentEntries.reduce(
    (sum, e) => sum + e.amount,
    0,
  );
  return props.breakdown.agencyAmount + agentTotal;
});

const isBalanced = computed(
  () => verificationTotal.value === props.breakdown.totalServiceFee,
);

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function roleLabel(role: 'listing' | 'selling' | 'dual'): string {
  const labels: Record<typeof role, string> = {
    listing: 'Listing Agent',
    selling: 'Selling Agent',
    dual: 'Dual Agent',
  };
  return labels[role];
}
</script>
