<script setup lang="ts">
import type { TransactionWithBudget } from '~/types/database.types'
import type { DailyTransactionGroup } from '~/types/timeline.types'

defineProps<{
  group: DailyTransactionGroup
}>()

const emit = defineEmits<{
  (e: 'edit' | 'delete', transaction: TransactionWithBudget): void
}>()

const { formatCurrency } = useFinancialSummary()
</script>

<template>
  <div class="border-b border-default last:border-b-0">
    <!-- Sticky Date Header -->
    <div
      class="sticky top-0 z-10 flex items-center justify-between px-2.5 py-2 sm:px-5 sm:py-2.5 bg-elevated border-b border-default shadow-2xs"
    >
      <!-- Left side: Day number + Day-of-week pill -->
      <div class="flex items-center gap-2 sm:gap-2.5">
        <span class="text-base sm:text-xl font-bold font-mono text-highlighted">
          {{ group.dayNumber }}
        </span>

        <span
          class="px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-md"
          :class="{
            'bg-rose-500/15 text-rose-500 dark:text-rose-400': group.isSunday,
            'bg-blue-500/15 text-blue-500 dark:text-blue-400': group.isSaturday,
            'bg-neutral-500/15 text-neutral-600 dark:text-neutral-300': !group.isSunday && !group.isSaturday
          }"
        >
          {{ group.dayOfWeek }}
        </span>

        <UBadge
          v-if="group.isToday"
          color="primary"
          variant="subtle"
          size="xs"
          class="text-[10px] sm:text-xs py-0.5 px-1.5 font-medium"
        >
          Today
        </UBadge>
      </div>

      <!-- Right side: Daily Income & Expense totals -->
      <div class="flex items-center gap-2.5 sm:gap-4">
        <span
          v-if="group.totalIncome > 0"
          class="font-bold font-mono text-emerald-500 dark:text-emerald-400 text-xs sm:text-sm"
        >
          +{{ formatCurrency(group.totalIncome) }}
        </span>

        <span
          class="font-bold font-mono text-xs sm:text-sm"
          :class="group.totalExpense > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-muted'"
        >
          {{ group.totalExpense > 0 ? '-' : '' }}{{ formatCurrency(group.totalExpense) }}
        </span>
      </div>
    </div>

    <!-- Category / Budget Subtotals Pill Bar (if multiple categories) -->
    <div
      v-if="group.budgetSubtotals.length > 1"
      class="flex flex-wrap items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-5 sm:py-2 bg-muted/15 border-b border-default/30"
    >
      <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted mr-0.5">
        Breakdown:
      </span>
      <div
        v-for="sub in group.budgetSubtotals"
        :key="sub.budgetName"
        class="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 bg-elevated border border-default/50 text-[10px] sm:text-xs"
      >
        <span class="font-bold text-highlighted uppercase">
          {{ sub.budgetName }}:
        </span>
        <span
          class="font-semibold font-mono"
          :class="sub.totalExpense > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400'"
        >
          {{ formatCurrency(sub.totalExpense > 0 ? sub.totalExpense : sub.totalIncome) }}
        </span>
      </div>
    </div>

    <!-- Transaction List for this day -->
    <div class="divide-y divide-default/40">
      <TransactionTimelineRow
        v-for="tx in group.transactions"
        :key="tx.id"
        :transaction="tx"
        @edit="emit('edit', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>
</template>
