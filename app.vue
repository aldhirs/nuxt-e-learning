<template>
  <!-- Top progress bar during navigation: route middleware (e.g. partner-auth)
       waits on the API before the page changes, so without it a click looks
       like it did nothing. -->
  <NuxtLoadingIndicator color="var(--color-primary-500)" :height="3" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
