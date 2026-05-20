import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  vite: {
    plugins: [tailwindcss()]
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.staging.drillspace.id/api/v1',
      analyticsEnabled: process.env.NUXT_PUBLIC_ANALYTICS_ENABLED || 'false'
    }
  },

  app: {
    head: {
      titleTemplate: '%s | DrillSpace',
      title: 'DrillSpace',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#2F80D2' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  nitro: {
    prerender: {
      routes: ['/robots.txt']
    }
  }
})
