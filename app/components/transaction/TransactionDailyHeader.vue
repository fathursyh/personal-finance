<script setup lang="ts">
defineProps<{
  income: number
  expense: number
  total: number
}>()

const { formatCurrency } = useFinancialSummary()
</script>

<template>
  <div class="rounded-xl border border-default bg-elevated/60 p-3 sm:p-4 shadow-xs">
    <div class="grid grid-cols-3 divide-x divide-default text-center">
      <!-- Income -->
      <div class="px-2">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
          Income
        </p>
        <p class="mt-1 text-sm sm:text-lg font-bold text-emerald-500 truncate">
          {{ formatCurrency(income) }}
        </p>
      </div>

      <!-- Exp. -->
      <div class="px-2">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
          Exp.
        </p>
        <p class="mt-1 text-sm sm:text-lg font-bold text-rose-500 truncate">
          {{ formatCurrency(expense) }}
        </p>
      </div>

      <!-- Total -->
      <div class="px-2">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted">
          Total
        </p>
        <p
          class="mt-1 text-sm sm:text-lg font-bold truncate"
          :class="total >= 0 ? 'text-highlighted' : 'text-rose-500'"
        >
          {{ formatCurrency(total) }}
        </p>
      </div>
    </div>
  </div>
</template>

