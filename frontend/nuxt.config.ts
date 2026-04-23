export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'nuxt-icon',
  ],

  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3001',
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },
});