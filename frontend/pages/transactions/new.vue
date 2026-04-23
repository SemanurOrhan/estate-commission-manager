<template>
  <div class="space-y-6">
    <NuxtLink to="/" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
      <Icon name="heroicons:arrow-left-solid" class="w-4 h-4" />
      Back to Dashboard
    </NuxtLink>

    <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-2xl mx-auto mt-10">
      <h2 class="text-2xl font-bold text-gray-900 mb-1">New Transaction</h2>
      <p class="text-sm text-gray-500 mb-6">Create a new real estate transaction</p>

      <!-- Loading agents/properties -->
      <div v-if="isLoadingData" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>

      <!-- Load Error -->
      <div v-else-if="loadError" class="py-8">
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <Icon name="heroicons:exclamation-triangle-solid" class="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p class="text-sm font-medium text-amber-800">{{ loadError }}</p>
            <button class="mt-2 text-sm font-medium text-amber-700 hover:text-amber-900 underline" @click="loadData">Retry</button>
          </div>
        </div>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Property Select -->
        <div>
          <label for="propertyId" class="block text-sm font-medium text-gray-700 mb-1">Property</label>
          <select id="propertyId" v-model="form.propertyId" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            <option value="" disabled>Select a property...</option>
            <option v-for="p in propertiesList" :key="p._id" :value="p._id">
              {{ p.address }}, {{ p.city }} — {{ formatCurrency(p.askingPrice) }}
            </option>
          </select>
        </div>

        <!-- Listing Agent -->
        <div>
          <label for="listingAgentId" class="block text-sm font-medium text-gray-700 mb-1">Listing Agent</label>
          <select id="listingAgentId" v-model="form.listingAgentId" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            <option value="" disabled>Select listing agent...</option>
            <option v-for="a in agentsList" :key="a._id" :value="a._id">
              {{ a.firstName }} {{ a.lastName }}
            </option>
          </select>
        </div>

        <!-- Selling Agent -->
        <div>
          <label for="sellingAgentId" class="block text-sm font-medium text-gray-700 mb-1">Selling Agent</label>
          <select id="sellingAgentId" v-model="form.sellingAgentId" required class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white">
            <option value="" disabled>Select selling agent...</option>
            <option v-for="a in agentsList" :key="a._id" :value="a._id">
              {{ a.firstName }} {{ a.lastName }}
            </option>
          </select>
        </div>

        <!-- Prices -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="agreedPrice" class="block text-sm font-medium text-gray-700 mb-1">Agreed Price ($)</label>
            <input
              id="agreedPrice"
              :value="agreedPriceDisplay"
              type="text"
              inputmode="numeric"
              required
              maxlength="15"
              placeholder="200,000"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              @input="onPriceInput($event, 'agreedPrice')"
            />
          </div>
          <div>
            <label for="totalServiceFee" class="block text-sm font-medium text-gray-700 mb-1">Total Service Fee ($)</label>
            <input
              id="totalServiceFee"
              :value="serviceFeeDisplay"
              type="text"
              inputmode="numeric"
              required
              maxlength="15"
              placeholder="10,000"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              @input="onPriceInput($event, 'totalServiceFee')"
            />
          </div>
        </div>

        <!-- Buyer Info (optional) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label for="buyerName" class="block text-sm font-medium text-gray-700 mb-1">Buyer Name <span class="text-gray-400">(optional)</span></label>
            <input id="buyerName" v-model="form.buyerName" type="text" placeholder="Jane Smith" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label for="buyerEmail" class="block text-sm font-medium text-gray-700 mb-1">Buyer Email <span class="text-gray-400">(optional)</span></label>
            <input
              id="buyerEmail"
              v-model="form.buyerEmail"
              type="email"
              placeholder="jane@example.com"
              :class="[
                'w-full px-3 py-2 border rounded-lg text-sm outline-none transition-colors',
                buyerEmailError ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              ]"
              @blur="validateBuyerEmail"
              @input="buyerEmailError = ''"
            />
            <p v-if="buyerEmailError" class="mt-1 text-sm text-red-600">{{ buyerEmailError }}</p>
          </div>
        </div>

        <!-- Error -->
        <div v-if="errorMsg" class="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">{{ errorMsg }}</div>

        <!-- Submit -->
        <button type="submit" :disabled="isSubmitting" class="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg shadow-sm transition-colors">
          <div v-if="isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          <Icon v-else name="heroicons:check-solid" class="w-4 h-4" />
          {{ isSubmitting ? 'Creating...' : 'Create Transaction' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTransactionsStore } from '~/stores/transactions.store';
import type { Agent, Property, ApiResponse, CreateTransactionPayload } from '~/types';

useHead({ title: 'New Transaction — EstateComm' });

const config = useRuntimeConfig();
const router = useRouter();
const store = useTransactionsStore();

const agentsList = ref<Agent[]>([]);
const propertiesList = ref<Property[]>([]);
const isLoadingData = ref(false);
const isSubmitting = ref(false);
const errorMsg = ref('');
const loadError = ref('');
const buyerEmailError = ref('');

const agreedPriceDisplay = ref('');
const serviceFeeDisplay = ref('');

const form = reactive({
  propertyId: '',
  listingAgentId: '',
  sellingAgentId: '',
  agreedPrice: 0,
  totalServiceFee: 0,
  buyerName: '',
  buyerEmail: '',
});

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

function formatNumberWithCommas(n: number): string {
  return n === 0 ? '' : n.toLocaleString('en-US');
}

function onPriceInput(event: Event, field: 'agreedPrice' | 'totalServiceFee'): void {
  const input = event.target as HTMLInputElement;
  const digits = input.value.replace(/[^0-9]/g, '').slice(0, 12);
  const numericValue = digits ? parseInt(digits, 10) : 0;
  const formatted = formatNumberWithCommas(numericValue);

  form[field] = numericValue;
  if (field === 'agreedPrice') {
    agreedPriceDisplay.value = formatted;
  } else {
    serviceFeeDisplay.value = formatted;
  }
  nextTick(() => { input.value = formatted; });
}

function validateBuyerEmail(): void {
  const email = form.buyerEmail.trim();
  if (!email) { buyerEmailError.value = ''; return; }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.includes('@')) {
    buyerEmailError.value = "Please include an '@' in the email address.";
  } else if (!emailRegex.test(email)) {
    buyerEmailError.value = 'Please enter a valid email address (e.g., name@domain.com).';
  } else {
    buyerEmailError.value = '';
  }
}

async function loadData(): Promise<void> {
  isLoadingData.value = true;
  loadError.value = '';
  try {
    const [agentsRes, propsRes] = await Promise.all([
      $fetch<ApiResponse<Agent[]>>('/agents', { baseURL: config.public.apiBase }),
      $fetch<ApiResponse<Property[]>>('/properties', { baseURL: config.public.apiBase }),
    ]);
    agentsList.value = agentsRes.data;
    propertiesList.value = propsRes.data;
  } catch (err: unknown) {
    const fetchErr = err as Record<string, any>;
    loadError.value = fetchErr?.data?.message || (err instanceof Error ? err.message : 'Failed to load necessary data.');
  } finally { isLoadingData.value = false; }
}

async function handleSubmit(): Promise<void> {
  isSubmitting.value = true;
  errorMsg.value = '';
  try {
    const payload: CreateTransactionPayload = {
      propertyId: form.propertyId,
      listingAgentId: form.listingAgentId,
      sellingAgentId: form.sellingAgentId,
      agreedPrice: form.agreedPrice,
      totalServiceFee: form.totalServiceFee,
    };
    if (form.buyerName.trim()) payload.buyerName = form.buyerName;
    if (form.buyerEmail.trim()) payload.buyerEmail = form.buyerEmail;

    await store.createTransaction(payload);
    router.push('/');
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to create transaction.';
  } finally { isSubmitting.value = false; }
}

onMounted(() => { loadData(); });
</script>
