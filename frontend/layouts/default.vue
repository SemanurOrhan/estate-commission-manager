<template>
  <div class="min-h-screen flex bg-gray-50">
    <!-- Mobile Overlay -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 bg-black/40 z-30 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      ]"
    >
      <!-- Brand -->
      <div class="flex items-center gap-3 px-6 h-16 border-b border-slate-700/50">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
          <Icon name="heroicons:building-office-2-solid" class="w-5 h-5 text-white" />
        </div>
        <span class="text-lg font-semibold tracking-tight">EstateComm</span>
      </div>

      <!-- Navigation -->
      <nav class="mt-6 px-3 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
          :class="[
            isActiveRoute(item.to)
              ? 'bg-white/10 text-white shadow-sm'
              : 'text-slate-300 hover:bg-white/5 hover:text-white',
          ]"
          @click="sidebarOpen = false"
        >
          <Icon :name="item.icon" class="w-5 h-5 flex-shrink-0" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Sidebar Footer -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50">
        <div class="flex items-center gap-3 px-2">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
            <Icon name="heroicons:user-solid" class="w-4 h-4 text-white" />
          </div>
          <div class="text-sm">
            <p class="font-medium text-white">Admin</p>
            <p class="text-slate-400 text-xs">Manager</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Bar -->
      <header class="sticky top-0 z-20 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
        <!-- Mobile Menu Button -->
        <button
          class="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          @click="sidebarOpen = !sidebarOpen"
        >
          <Icon name="heroicons:bars-3-solid" class="w-6 h-6" />
        </button>

        <!-- Page Title -->
        <h1 class="text-lg font-semibold text-gray-800 hidden lg:block">
          {{ pageTitle }}
        </h1>

        <!-- Right-side actions -->
        <div class="flex items-center gap-3">
          <button class="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors relative">
            <Icon name="heroicons:bell-solid" class="w-5 h-5" />
            <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-4 lg:p-6 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();

const sidebarOpen = ref(false);

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'heroicons:squares-2x2-solid' },
  { to: '/agents', label: 'Agents', icon: 'heroicons:user-group-solid' },
  { to: '/properties', label: 'Properties', icon: 'heroicons:home-modern-solid' },
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/agents': 'Agents',
  '/properties': 'Properties',
};

const pageTitle = computed(() => {
  const path = route.path;
  if (path.startsWith('/transactions/')) return 'Transaction Details';
  return pageTitles[path] ?? 'Estate Commission Manager';
});

function isActiveRoute(to: string): boolean {
  if (to === '/') return route.path === '/';
  return route.path.startsWith(to);
}
</script>
