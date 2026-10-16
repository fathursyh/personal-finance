<script setup lang="ts">
defineProps<{
  income: number
  expense: number
  total: number
}>()

const { formatCurrency } = useFinancialSummary()
</script>

<template>
  <div class="rounded-xl border border-default bg-elevated/70 p-3 sm:p-4 shadow-2xs">
    <div class="grid grid-cols-3 divide-x divide-default text-center">
      <!-- Income -->
      <div class="px-2 sm:px-4">
        <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted">
          Income
        </p>
        <p class="mt-0.5 sm:mt-1 text-xs sm:text-lg md:text-xl font-bold font-mono text-emerald-500 dark:text-emerald-400 truncate">
          {{ formatCurrency(income) }}
        </p>
      </div>

      <!-- Expense -->
      <div class="px-2 sm:px-4">
        <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted">
          <span class="sm:hidden">Exp.</span>
          <span class="hidden sm:inline">Expense</span>
        </p>
        <p class="mt-0.5 sm:mt-1 text-xs sm:text-lg md:text-xl font-bold font-mono text-rose-500 dark:text-rose-400 truncate">
          {{ formatCurrency(expense) }}
        </p>
      </div>

      <!-- Net Total -->
      <div class="px-2 sm:px-4">
        <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted">
          <span class="sm:hidden">Total</span>
          <span class="hidden sm:inline">Net Balance</span>
        </p>
        <p
          class="mt-0.5 sm:mt-1 text-xs sm:text-lg md:text-xl font-bold font-mono truncate"
          :class="total >= 0 ? 'text-highlighted' : 'text-rose-500 dark:text-rose-400'"
        >
          {{ formatCurrency(total) }}
        </p>
      </div>
    </div>
  </div>
</template>
