<template>
  <div class="w-full">
    <div class="flex items-center">
      <template v-for="(step, index) in stages" :key="step.key">
        <!-- Step Circle + Label -->
        <div class="flex flex-col items-center relative">
          <div
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-2',
              stepState(step.key) === 'completed'
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-200'
                : stepState(step.key) === 'current'
                  ? `${step.activeColor} border-current text-white shadow-md ${step.activeShadow}`
                  : 'bg-white border-gray-300 text-gray-400',
            ]"
          >
            <Icon
              v-if="stepState(step.key) === 'completed'"
              name="heroicons:check-solid"
              class="w-5 h-5"
            />
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span
            :class="[
              'mt-2 text-xs font-medium text-center whitespace-nowrap',
              stepState(step.key) === 'completed'
                ? 'text-emerald-600'
                : stepState(step.key) === 'current'
                  ? 'text-gray-800'
                  : 'text-gray-400',
            ]"
          >
            {{ step.label }}
          </span>
        </div>

        <!-- Connector Line -->
        <div
          v-if="index < stages.length - 1"
          :class="[
            'flex-1 h-0.5 mx-2 mb-6 transition-all duration-300',
            currentStageIndex > index ? 'bg-emerald-400' : 'bg-gray-200',
          ]"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { TransactionStage } from '~/types';

interface StageStep {
  key: TransactionStage;
  label: string;
  activeColor: string;
  activeShadow: string;
}

const props = defineProps<{
  currentStage: TransactionStage;
}>();

const stages: StageStep[] = [
  {
    key: TransactionStage.AGREEMENT,
    label: 'Agreement',
    activeColor: 'bg-blue-500 border-blue-500',
    activeShadow: 'shadow-blue-200',
  },
  {
    key: TransactionStage.EARNEST_MONEY,
    label: 'Earnest Money',
    activeColor: 'bg-amber-500 border-amber-500',
    activeShadow: 'shadow-amber-200',
  },
  {
    key: TransactionStage.TITLE_DEED,
    label: 'Title Deed',
    activeColor: 'bg-indigo-500 border-indigo-500',
    activeShadow: 'shadow-indigo-200',
  },
  {
    key: TransactionStage.COMPLETED,
    label: 'Completed',
    activeColor: 'bg-emerald-500 border-emerald-500',
    activeShadow: 'shadow-emerald-200',
  },
];

const stageOrder: TransactionStage[] = [
  TransactionStage.AGREEMENT,
  TransactionStage.EARNEST_MONEY,
  TransactionStage.TITLE_DEED,
  TransactionStage.COMPLETED,
];

const currentStageIndex = computed(() =>
  stageOrder.indexOf(props.currentStage),
);

function stepState(key: TransactionStage): 'completed' | 'current' | 'upcoming' {
  const stepIndex = stageOrder.indexOf(key);
  if (stepIndex < currentStageIndex.value) return 'completed';
  if (stepIndex === currentStageIndex.value) return 'current';
  return 'upcoming';
}
</script>
