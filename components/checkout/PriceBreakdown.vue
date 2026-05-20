<script setup lang="ts">
interface Props {
  subtotal: number
  discount?: number
  tax?: number
  total: number
  currency?: string
}

withDefaults(defineProps<Props>(), { currency: 'IDR' })

const { formatCurrency } = useFormatters()
</script>

<template>
  <div class="space-y-2 text-sm">
    <div class="flex justify-between text-slate-600">
      <span>Subtotal</span>
      <span>{{ formatCurrency(subtotal) }}</span>
    </div>
    <div v-if="discount && discount > 0" class="flex justify-between text-green-600">
      <span>Diskon</span>
      <span>- {{ formatCurrency(discount) }}</span>
    </div>
    <div v-if="tax && tax > 0" class="flex justify-between text-slate-500">
      <span>PPN (11%)</span>
      <span>{{ formatCurrency(tax) }}</span>
    </div>
    <div class="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-800 text-base">
      <span>Total</span>
      <span class="text-primary-600">{{ formatCurrency(total) }}</span>
    </div>
  </div>
</template>
