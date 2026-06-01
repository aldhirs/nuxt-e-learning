<script setup lang="ts">
interface Props {
  subtotal: number
  discount?: number
  tax?: number
  total: number
  currency?: string
  // showTaxAlways: tampilkan baris Pajak walaupun nilainya 0 (transparansi
  // ke user — terutama di halaman detail order setelah checkout selesai).
  showTaxAlways?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currency: 'IDR',
  showTaxAlways: true
})

const { formatCurrency } = useFormatters()

// Hitung persentase pajak dari subtotal saat ini. Pakai pembulatan integer
// agar UI tidak menampilkan desimal aneh untuk PPN bulat (11%, 12%).
const taxPercentLabel = computed(() => {
  const subtotal = props.subtotal
  const tax = props.tax ?? 0
  if (subtotal <= 0 || tax <= 0) return ''
  const pct = Math.round((tax / subtotal) * 100)
  return ` (${pct}%)`
})
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
    <div v-if="showTaxAlways || (tax && tax > 0)" class="flex justify-between text-slate-500">
      <span>Tax{{ taxPercentLabel }}</span>
      <span>{{ formatCurrency(tax ?? 0) }}</span>
    </div>
    <div class="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-800 text-base">
      <span>Grand Total</span>
      <span class="text-primary-600">{{ formatCurrency(total) }}</span>
    </div>
  </div>
</template>
