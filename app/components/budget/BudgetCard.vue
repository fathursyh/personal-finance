<script setup lang="ts">
import type { BudgetSummaryItem } from '~/composables/useFinancialSummary'

const props = defineProps<{
  budget: BudgetSummaryItem
  selected?: boolean
}>()

const emit = defineEmits<{
  edit: [budget: BudgetSummaryItem]
  delete: [budget: BudgetSummaryItem]
  select: [budget: BudgetSummaryItem]
}>()

const { formatCurrency } = useFinancialSummary()

const isOverBudget = computed(() => props.budget.remaining < 0)

const progressColor = computed(() => {
  if (isOverBudget.value) return 'error'
  if (props.budget.status === 'warning') return 'warning'
  return 'primary'
})

const badgeColor = computed(() => {
  if (isOverBudget.value) return 'error'
  if (props.budget.status === 'warning') return 'warning'
  return 'success'
})

const menuItems = [
  [
    {
      label: 'Edit Budget',
      icon: 'i-lucide-pencil',
      onSelect: () => emit('edit', props.budget)
    },
    {
      label: 'Delete Budget',
      icon: 'i-lucide-trash-2',
      color: 'error' as const,
      onSelect: () => emit('delete', props.budget)
    }
  ]
]
</script>

<template>
  <UCard
    class="relative overflow-hidden cursor-pointer select-none transition-all hover:shadow-md hover:border-primary/50"
    :class="{
      'ring-2 ring-primary border-primary bg-primary/5 dark:bg-primary/10 shadow-sm': selected
    }"
    @click="emit('select', budget)"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <div
          class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
          :class="{
            'bg-emerald-500/10 text-emerald-500': budget.color === 'emerald',
            'bg-amber-500/10 text-amber-500': budget.color === 'amber',
            'bg-rose-500/10 text-rose-500': budget.color === 'rose',
            'bg-violet-500/10 text-violet-500': budget.color === 'violet',
            'bg-cyan-500/10 text-cyan-500': budget.color === 'cyan'
          }"
        >
          <UIcon
            :name="budget.icon || 'i-lucide-wallet'"
            class="size-5"
          />
        </div>

        <div class="min-w-0 truncate">
          <h3 class="font-semibold text-highlighted truncate text-base">
            {{ budget.name }}
          </h3>
          <p class="text-xs text-muted flex items-center gap-1">
            <UIcon
              name="i-lucide-clock"
              class="size-3"
            />
            Updated {{ budget.lastUpdatedFormatted }}
          </p>
        </div>
      </div>

      <div
        class="flex items-center gap-1"
        @click.stop
      >
        <UBadge
          :color="badgeColor"
          variant="subtle"
          size="xs"
        >
          <template v-if="isOverBudget">
            Over by {{ formatCurrency(Math.abs(budget.remaining)) }}
          </template>
          <template v-else>
            {{ budget.percentage }}% used
          </template>
        </UBadge>

        <UDropdownMenu :items="menuItems">
          <UButton
            icon="i-lucide-more-vertical"
            color="neutral"
            variant="ghost"
            size="xs"
            aria-label="Budget actions"
          />
        </UDropdownMenu>
      </div>
    </div>

    <!-- Amounts: Left of Total -->
    <div class="mt-4 flex items-baseline justify-between">
      <div>
        <p class="text-xs uppercase tracking-wider text-muted font-medium">
          Remaining
        </p>
        <p
          class="text-2xl font-bold tracking-tight"
          :class="isOverBudget ? 'text-rose-500' : 'text-highlighted'"
        >
          {{ formatCurrency(Math.max(0, budget.remaining)) }}
        </p>
      </div>

      <div class="text-right">
        <p class="text-xs text-muted">
          Spent <span class="font-medium text-highlighted">{{ formatCurrency(budget.spent) }}</span>
        </p>
        <p class="text-xs text-muted">
          of <span class="font-semibold text-highlighted">{{ formatCurrency(Number(budget.amount)) }}</span>
        </p>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="mt-3">
      <UProgress
        :model-value="budget.percentage"
        :color="progressColor"
        size="sm"
      />
    </div>
  </UCard>
</template>
