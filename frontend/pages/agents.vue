<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Agents</h2>
        <p class="text-sm text-gray-500 mt-1">Manage your real estate agents</p>
      </div>
    </div>

    <!-- Add Agent Form -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Add New Agent</h3>
      <form @submit.prevent="handleCreate" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
          <input
            id="firstName"
            v-model="form.firstName"
            type="text"
            required
            placeholder="John"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          />
        </div>
        <div>
          <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
          <input
            id="lastName"
            v-model="form.lastName"
            type="text"
            required
            placeholder="Doe"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          />
        </div>
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            placeholder="john@agency.com"
            :class="[
              'w-full px-3 py-2 border rounded-lg text-sm outline-none transition-shadow',
              emailError ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            ]"
            @blur="validateEmail"
            @input="emailError = ''"
          />
          <p v-if="emailError" class="mt-1 text-sm text-red-600">{{ emailError }}</p>
        </div>
        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            id="phone"
            :value="phoneDisplay"
            type="tel"
            required
            maxlength="17"
            placeholder="555 123 4567"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            @input="onPhoneInput"
          />
        </div>
        <div class="md:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <div v-if="isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            <Icon v-else name="heroicons:plus-solid" class="w-4 h-4" />
            {{ isSubmitting ? 'Adding...' : 'Add Agent' }}
          </button>
          <span v-if="successMsg" class="text-sm text-emerald-600">{{ successMsg }}</span>
          <span v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</span>
        </div>
      </form>
    </div>

    <!-- Agent List -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <!-- Loading -->
      <div v-if="isLoadingList" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>

      <!-- List Error -->
      <div v-else-if="listError" class="p-6">
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Icon name="heroicons:exclamation-triangle-solid" class="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p class="text-sm font-medium text-amber-800">{{ listError }}</p>
            <button class="mt-2 text-sm font-medium text-amber-700 hover:text-amber-900 underline" @click="fetchAgents">Retry</button>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="agents.length === 0" class="p-12 text-center">
        <Icon name="heroicons:user-group-solid" class="w-12 h-12 text-gray-300 mx-auto" />
        <h3 class="mt-4 text-lg font-medium text-gray-700">No agents yet</h3>
        <p class="mt-1 text-sm text-gray-400">Add your first agent above.</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/50">
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="agent in agents" :key="agent._id" class="hover:bg-gray-50/50 transition-colors">
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-gray-900">{{ agent.firstName }} {{ agent.lastName }}</p>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ agent.email }}</td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ agent.phone }}</td>
              <td class="px-6 py-4">
                <span
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    agent.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500',
                  ]"
                >
                  {{ agent.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <button
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  @click="handleDelete(agent._id)"
                >
                  <Icon name="heroicons:trash-solid" class="w-4 h-4" />
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Agent, ApiResponse } from '~/types';

useHead({ title: 'Agents — EstateComm' });

const config = useRuntimeConfig();

const agents = ref<Agent[]>([]);
const isLoadingList = ref(false);
const isSubmitting = ref(false);
const successMsg = ref('');
const errorMsg = ref('');
const listError = ref('');
const emailError = ref('');
const phoneDisplay = ref('');

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
});

function validateEmail(): void {
  const email = form.email.trim();
  if (!email) { emailError.value = ''; return; }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.includes('@')) {
    emailError.value = "Please include an '@' in the email address.";
  } else if (!emailRegex.test(email)) {
    emailError.value = 'Please enter a valid email address (e.g., name@domain.com).';
  } else {
    emailError.value = '';
  }
}

function onPhoneInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const digits = input.value.replace(/[^0-9]/g, '').slice(0, 15);
  let formatted = '';
  for (let i = 0; i < digits.length; i++) {
    if (i === 3 || i === 6 || i === 10) formatted += ' ';
    formatted += digits[i];
  }
  form.phone = formatted.trim();
  phoneDisplay.value = formatted.trim();
  nextTick(() => { input.value = formatted.trim(); });
}

async function fetchAgents(): Promise<void> {
  isLoadingList.value = true;
  listError.value = '';
  try {
    const response = await $fetch<ApiResponse<Agent[]>>('/agents', {
      baseURL: config.public.apiBase,
    });
    agents.value = response.data;
  } catch (err: unknown) {
    const fetchErr = err as Record<string, any>;
    listError.value = fetchErr?.data?.message || (err instanceof Error ? err.message : 'Failed to load agents.');
  } finally {
    isLoadingList.value = false;
  }
}

async function handleCreate(): Promise<void> {
  isSubmitting.value = true;
  successMsg.value = '';
  errorMsg.value = '';
  try {
    const response = await $fetch<ApiResponse<Agent>>('/agents', {
      baseURL: config.public.apiBase,
      method: 'POST',
      body: { ...form },
    });
    agents.value.push(response.data);
    successMsg.value = `${response.data.firstName} ${response.data.lastName} added!`;
    form.firstName = '';
    form.lastName = '';
    form.email = '';
    form.phone = '';
    phoneDisplay.value = '';
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to create agent.';
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  fetchAgents();
});

async function handleDelete(id: string): Promise<void> {
  if (!confirm('Are you sure you want to delete this agent?')) return;
  try {
    await $fetch(`/agents/${id}`, {
      baseURL: config.public.apiBase,
      method: 'DELETE',
    });
    agents.value = agents.value.filter((a) => a._id !== id);
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to delete agent.';
  }
}
</script>
