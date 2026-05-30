<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[--color-bg]">
    <AppNavbar />
    <main id="main-content" class="flex-1">
      <Transition name="page" mode="out-in">
        <div :key="route.path">
          <slot />
        </div>
      </Transition>
    </main>
    <AppFooter />
    <AppToast />
  </div>
</template>
