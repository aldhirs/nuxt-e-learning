<script setup lang="ts">
defineOptions({ inheritAttrs: false })

interface Props {
  src?: string | null
  alt?: string
  imgClass?: string
  // 'course' = gradient + book icon; 'partner' | 'avatar' = initial letter inside parent styled container
  type?: 'course' | 'partner' | 'avatar'
  // Initial letter shown when type is partner/avatar and image is absent/broken
  initial?: string
}

const props = withDefaults(defineProps<Props>(), { type: 'course' })

const broken = ref(false)
const imgEl = ref<HTMLImageElement | null>(null)

watch(() => props.src, () => { broken.value = false })

// SSR hydration fix: @error fires before Vue hydrates when using cached broken URLs.
// After mount, check if the img element already failed (complete but zero naturalWidth).
onMounted(() => {
  if (imgEl.value?.complete && imgEl.value.naturalWidth === 0) {
    broken.value = true
  }
})
</script>

<template>
  <template v-if="src && !broken">
    <img
      ref="imgEl"
      :src="src"
      :alt="alt"
      :class="imgClass"
      loading="lazy"
      @error="broken = true"
    />
  </template>
  <template v-else>
    <!-- Custom placeholder via slot takes priority over built-in type fallbacks -->
    <slot name="placeholder">
      <div
        v-if="type === 'course'"
        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200"
      >
        <svg class="w-8 h-8 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
      <span v-else>{{ initial ?? '?' }}</span>
    </slot>
  </template>
</template>
