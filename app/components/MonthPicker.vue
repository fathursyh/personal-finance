<script setup lang="ts">
const { selectedMonth, fetchTransactions } = useTransactions()

const currentYearMonth = new Date().toISOString().slice(0, 7)

const displayMonth = computed(() => {
  const [yearStr, monthStr] = selectedMonth.value.split('-')
  const year = Number.parseInt(yearStr ?? '', 10)
  const month = Number.parseInt(monthStr ?? '', 10)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
})

const isCurrentMonth = computed(() => selectedMonth.value === currentYearMonth)

function changeMonth(delta: number) {
  const [yearStr, monthStr] = selectedMonth.value.split('-')
  let year = Number.parseInt(yearStr ?? '', 10)
  let month = Number.parseInt(monthStr ?? '', 10) + delta

  if (month > 12) {
    month = 1
    year += 1
  } else if (month < 1) {
    month = 12
    year -= 1
  }

  const nextMonth = `${year}-${String(month).padStart(2, '0')}`
  fetchTransactions(nextMonth)
}

function resetToCurrentMonth() {
  fetchTransactions(currentYearMonth)
}
</script>

<template>
  <div class="inline-flex items-center gap-1 rounded-lg border border-default bg-elevated/50 p-1">
    <UButton
      icon="i-lucide-chevron-left"
      color="neutral"
      variant="ghost"
      size="xs"
      aria-label="Previous month"
      @click="changeMonth(-1)"
    />

    <span class="px-2 text-xs font-semibold text-highlighted min-w-[110px] text-center">
      {{ displayMonth }}
    </span>

    <UButton
      icon="i-lucide-chevron-right"
      color="neutral"
      variant="ghost"
      size="xs"
      aria-label="Next month"
      @click="changeMonth(1)"
    />

    <UButton
      v-if="!isCurrentMonth"
      label="Today"
      color="primary"
      variant="subtle"
      size="xs"
      class="ms-1"
      @click="resetToCurrentMonth"
    />
  </div>
</template>
