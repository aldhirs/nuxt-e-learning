<template>
  <div class="min-h-screen flex flex-col bg-slate-50">
    <AppNavbar />
    <main id="main-content" class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
