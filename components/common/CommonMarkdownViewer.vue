<script setup lang="ts">
import { marked } from 'marked'

const props = defineProps<{ content?: string }>()

const html = computed(() => {
  if (!props.content) return ''
  return marked.parse(props.content, { async: false }) as string
})
</script>

<template>
  <div class="markdown-viewer prose prose-slate max-w-none" v-html="html" />
</template>

<style>
.markdown-viewer.prose {
  font-size: inherit;
  line-height: 1.7;
}

.markdown-viewer.prose h1,
.markdown-viewer.prose h2,
.markdown-viewer.prose h3,
.markdown-viewer.prose h4 {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
}

.markdown-viewer.prose h1:first-child,
.markdown-viewer.prose h2:first-child,
.markdown-viewer.prose h3:first-child {
  margin-top: 0;
}

.markdown-viewer.prose img {
  border-radius: 8px;
}
</style>
