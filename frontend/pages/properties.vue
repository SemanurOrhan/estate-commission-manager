<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Properties</h2>
        <p class="text-sm text-gray-500 mt-1">Manage listed properties</p>
      </div>
    </div>

    <!-- Add Property Form -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">Add New Property</h3>
      <form @submit.prevent="handleCreate" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label for="address" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input id="address" v-model="form.address" type="text" required placeholder="123 Main Street" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
        </div>
        <div>
          <label for="city" class="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input id="city" v-model="form.city" type="text" required placeholder="Istanbul" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
        </div>
        <div>
          <label for="postcode" class="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
          <input id="postcode" v-model="form.postcode" type="text" required placeholder="34000" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
        </div>
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select id="type" v-model="form.type" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white">
            <option value="sale">Sale</option>
            <option value="rental">Rental</option>
          </select>
        </div>
        <div>
          <label for="askingPrice" class="block text-sm font-medium text-gray-700 mb-1">Asking Price ($)</label>
          <input id="askingPrice" v-model.number="form.askingPrice" type="number" required min="0" placeholder="250000" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
        </div>
        <div>
          <label for="description" class="block text-sm font-medium text-gray-700 mb-1">Description <span class="text-gray-400">(optional)</span></label>
          <input id="description" v-model="form.description" type="text" placeholder="Beautiful apartment..." class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow" />
        </div>
        <div class="lg:col-span-3 md:col-span-2 flex items-center gap-3">
          <button type="submit" :disabled="isSubmitting" class="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
            <div v-if="isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            <Icon v-else name="heroicons:plus-solid" class="w-4 h-4" />
            {{ isSubmitting ? 'Adding...' : 'Add Property' }}
          </button>
          <span v-if="successMsg" class="text-sm text-emerald-600">{{ successMsg }}</span>
          <span v-if="errorMsg" class="text-sm text-red-600">{{ errorMsg }}</span>
        </div>
      </form>
    </div>

    <!-- Property List -->
    <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div v-if="isLoadingList" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
      <div v-else-if="listError" class="p-6">
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Icon name="heroicons:exclamation-triangle-solid" class="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p class="text-sm font-medium text-amber-800">{{ listError }}</p>
            <button class="mt-2 text-sm font-medium text-amber-700 hover:text-amber-900 underline" @click="fetchProperties">Retry</button>
          </div>
        </div>
      </div>
      <div v-else-if="properties.length === 0" class="p-12 text-center">
        <Icon name="heroicons:home-modern-solid" class="w-12 h-12 text-gray-300 mx-auto" />
        <h3 class="mt-4 text-lg font-medium text-gray-700">No properties yet</h3>
        <p class="mt-1 text-sm text-gray-400">Add your first property above.</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left">
          <thead>
            <tr class="border-b border-gray-100 bg-gray-50/50">
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">City</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Asking Price</th>
              <th class="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="prop in properties" :key="prop._id" class="hover:bg-gray-50/50 transition-colors">
              <td class="px-6 py-4">
                <p class="text-sm font-medium text-gray-900">{{ prop.address }}</p>
                <p class="text-xs text-gray-400">{{ prop.postcode }}</p>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">{{ prop.city }}</td>
              <td class="px-6 py-4">
                <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', prop.type === 'sale' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700']">
                  {{ prop.type === 'sale' ? 'Sale' : 'Rental' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm font-medium text-gray-800">{{ formatCurrency(prop.askingPrice) }}</td>
              <td class="px-6 py-4 text-right">
                <button
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  @click="handleDelete(prop._id)"
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
import type { Property, ApiResponse } from '~/types';

useHead({ title: 'Properties — EstateComm' });

const config = useRuntimeConfig();
const properties = ref<Property[]>([]);
const isLoadingList = ref(false);
const isSubmitting = ref(false);
const successMsg = ref('');
const errorMsg = ref('');
const listError = ref('');

const form = reactive({
  address: '',
  city: '',
  postcode: '',
  type: 'sale' as 'sale' | 'rental',
  askingPrice: 0,
  description: '',
});

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

async function fetchProperties(): Promise<void> {
  isLoadingList.value = true;
  listError.value = '';
  try {
    const response = await $fetch<ApiResponse<Property[]>>('/properties', { baseURL: config.public.apiBase });
    properties.value = response.data;
  } catch (err: unknown) {
    const fetchErr = err as Record<string, any>;
    listError.value = fetchErr?.data?.message || (err instanceof Error ? err.message : 'Failed to load properties.');
  } finally { isLoadingList.value = false; }
}

async function handleCreate(): Promise<void> {
  isSubmitting.value = true;
  successMsg.value = '';
  errorMsg.value = '';
  try {
    const body: Record<string, unknown> = { address: form.address, city: form.city, postcode: form.postcode, type: form.type, askingPrice: form.askingPrice };
    if (form.description.trim()) body.description = form.description;
    const response = await $fetch<ApiResponse<Property>>('/properties', { baseURL: config.public.apiBase, method: 'POST', body });
    properties.value.push(response.data);
    successMsg.value = `${response.data.address} added!`;
    Object.assign(form, { address: '', city: '', postcode: '', type: 'sale', askingPrice: 0, description: '' });
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to create property.';
  } finally { isSubmitting.value = false; }
}

onMounted(() => { fetchProperties(); });

async function handleDelete(id: string): Promise<void> {
  if (!confirm('Are you sure you want to delete this property?')) return;
  try {
    await $fetch(`/properties/${id}`, {
      baseURL: config.public.apiBase,
      method: 'DELETE',
    });
    properties.value = properties.value.filter((p) => p._id !== id);
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to delete property.';
  }
}
</script>
