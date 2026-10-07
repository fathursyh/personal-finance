<script setup lang="ts">
defineProps<{
  income: number
  expense: number
  total: number
}>()

const { formatCurrency } = useFinancialSummary()
</script>

<template>
  <div class="rounded-lg border border-default bg-elevated/60 p-2 sm:p-3 shadow-2xs">
    <div class="grid grid-cols-3 divide-x divide-default text-center">
      <!-- Income -->
      <div class="px-1 sm:px-2">
        <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted">
          Income
        </p>
        <p class="mt-0.5 text-xs sm:text-base font-bold text-emerald-500 truncate">
          {{ formatCurrency(income) }}
        </p>
      </div>

      <!-- Exp. -->
      <div class="px-1 sm:px-2">
        <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted">
          Exp.
        </p>
        <p class="mt-0.5 text-xs sm:text-base font-bold text-rose-500 truncate">
          {{ formatCurrency(expense) }}
        </p>
      </div>

      <!-- Total -->
      <div class="px-1 sm:px-2">
        <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted">
          Total
        </p>
        <p
          class="mt-0.5 text-xs sm:text-base font-bold truncate"
          :class="total >= 0 ? 'text-highlighted' : 'text-rose-500'"
        >
          {{ formatCurrency(total) }}
        </p>
      </div>
    </div>
  </div>
</template>
