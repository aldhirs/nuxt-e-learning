export function useFormatters() {
  function formatCurrency(amount: number, currency = 'IDR'): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  function formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(dateStr))
  }

  function formatDatetime(dateStr: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Jakarta',
      timeZoneName: 'short'
    }).format(new Date(dateStr))
  }

  function discountPercent(price: number, compareAt: number): number {
    return Math.round((1 - price / compareAt) * 100)
  }

  return { formatCurrency, formatDuration, formatDate, formatDatetime, discountPercent }
}
