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
      class="sticky top-14 sm:top-16 z-10 flex items-center justify-between px-3 py-2 sm:px-4 bg-elevated/95 backdrop-blur-md border-y border-default/80"
    >
      <!-- Left side: Day number + Day-of-week pill -->
      <div class="flex items-center gap-2">
        <span class="text-base sm:text-lg font-bold text-highlighted">
          {{ group.dayNumber }}
        </span>

        <span
          class="px-2 py-0.5 text-xs font-semibold rounded"
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
          class="text-[10px] py-0"
        >
          Today
        </UBadge>
      </div>

      <!-- Right side: Daily Income & Expense totals -->
      <div class="flex items-center gap-3 text-xs sm:text-sm">
        <span
          v-if="group.totalIncome > 0"
          class="font-semibold text-emerald-500"
        >
          +{{ formatCurrency(group.totalIncome) }}
        </span>

        <span
          class="font-bold"
          :class="group.totalExpense > 0 ? 'text-rose-500' : 'text-muted'"
        >
          {{ group.totalExpense > 0 ? '-' : '' }}{{ formatCurrency(group.totalExpense) }}
        </span>
      </div>
    </div>

    <!-- Category / Budget Subtotals Pill Bar (if multiple categories) -->
    <div
      v-if="group.budgetSubtotals.length > 0"
      class="flex flex-wrap items-center gap-1.5 px-3 py-1.5 sm:px-4 bg-muted/20 border-b border-default/30 text-[11px]"
    >
      <span class="text-[10px] font-semibold uppercase tracking-wider text-muted mr-1">
        Daily Breakdown:
      </span>
      <div
        v-for="sub in group.budgetSubtotals"
        :key="sub.budgetName"
        class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 bg-elevated border border-default/50"
      >
        <span class="text-[10px] font-bold text-highlighted uppercase">
          {{ sub.budgetName }}:
        </span>
        <span
          class="font-medium"
          :class="sub.totalExpense > 0 ? 'text-rose-500' : 'text-emerald-500'"
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
