<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Transaction Details</h2>
    <p class="text-gray-500">Transaction detail view coming soon.</p>
    <p class="text-sm text-gray-400 mt-2">ID: {{ $route.params.id }}</p>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
useHead({ title: `Transaction ${route.params.id} — EstateComm` });
</script>
