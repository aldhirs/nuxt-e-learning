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
    ssoApiKey: '',
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'https://api.staging.drillspace.id/api/v1',
      clientBaseUrl: process.env.NUXT_PUBLIC_CLIENT_BASE_URL || 'https://staging.lms.drillspace.id',
      analyticsEnabled: process.env.NUXT_PUBLIC_ANALYTICS_ENABLED || 'false',
      // Feature flag: storefront profile-edit page. Default ON now that BE
      // ships PUT /auth/storefront/me. Set NUXT_PUBLIC_ENABLE_PROFILE_EDIT=false
      // to force-disable for a kill-switch deploy.
      enableProfileEdit: (process.env.NUXT_PUBLIC_ENABLE_PROFILE_EDIT ?? 'true') !== 'false',
      // MinIO URL transform: replace internal host with public CDN host.
      // Must match VITE_FILE_URL_TRANSFORM_TO in vue-e-learning.
      fileUrlTransformFrom: process.env.NUXT_PUBLIC_FILE_URL_TRANSFORM_FROM || 'minio:9000',
      fileUrlTransformTo: process.env.NUXT_PUBLIC_FILE_URL_TRANSFORM_TO || 's3.minio.imaremaritimjakarta.id'
    }
  },

  app: {
    head: {
      titleTemplate: '%s | DrillSpace',
      title: 'DrillSpace',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#2f7ed0' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  nitro: {
    prerender: {
      routes: ['/robots.txt']
    }
  }
})
