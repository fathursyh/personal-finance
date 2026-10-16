<script setup lang="ts">
import type { PaymentMethod, TransactionWithBudget } from '~/types/database.types'

const props = defineProps<{
  transaction: TransactionWithBudget
}>()

const emit = defineEmits<{
  (e: 'edit' | 'delete', transaction: TransactionWithBudget): void
}>()

const { formatCurrency } = useFinancialSummary()

const budgetColorClass = computed(() => {
  if (props.transaction.type === 'income' && !props.transaction.budget) {
    return 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20'
  }
  const color = props.transaction.budget?.color
  switch (color) {
    case 'rose':
      return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    case 'emerald':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    case 'amber':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    case 'violet':
      return 'bg-violet-500/10 text-violet-500 border-violet-500/20'
    case 'cyan':
      return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
    case 'primary':
      return 'bg-primary/10 text-primary border-primary/20'
    default:
      return 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
  }
})

const budgetDisplayName = computed(() => {
  if (props.transaction.budget?.name) {
    return props.transaction.budget.name
  }
  return props.transaction.type === 'income' ? 'INCOME' : 'LAIN LAIN'
})

function getPaymentIcon(method: PaymentMethod) {
  switch (method) {
    case 'Cash':
      return 'i-lucide-banknote'
    case 'Debit Card':
    case 'Credit Card':
      return 'i-lucide-credit-card'
    case 'Bank Transfer':
      return 'i-lucide-landmark'
    case 'E-Wallet':
      return 'i-lucide-smartphone'
    case 'QRIS':
      return 'i-lucide-qr-code'
    default:
      return 'i-lucide-credit-card'
  }
}
</script>

<template>
  <div
    class="flex items-center justify-between px-2.5 py-2.5 sm:px-5 sm:py-3.5 transition-colors hover:bg-elevated/60 cursor-pointer select-none group"
    @click="emit('edit', transaction)"
  >
    <!-- Left Column: Category Tag -->
    <div class="w-20 sm:w-32 md:w-36 shrink-0 flex items-center pr-2 sm:pr-3">
      <span
        class="inline-block max-w-full truncate px-2 py-0.5 sm:py-1 text-[9px] sm:text-xs font-bold tracking-wide rounded-md border uppercase text-center"
        :class="budgetColorClass"
        :title="budgetDisplayName"
      >
        {{ budgetDisplayName }}
      </span>
    </div>

    <!-- Center Column: Note/Description + Account -->
    <div class="min-w-0 flex-1 px-1.5 sm:px-3">
      <p class="text-xs sm:text-base font-semibold text-highlighted line-clamp-2 wrap-break-word leading-snug">
        {{ transaction.description }}
      </p>

      <div class="mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted truncate">
        <UIcon
          :name="getPaymentIcon(transaction.payment_method)"
          class="size-3.5 sm:size-4 shrink-0 text-muted"
        />
        <span class="truncate font-medium">{{ transaction.payment_method }}</span>
      </div>
    </div>

    <!-- Right Column: Amount + Actions -->
    <div
      class="shrink-0 flex items-center gap-1.5 sm:gap-3 text-right pl-2 sm:pl-3"
      @click.stop
    >
      <span
        class="text-xs sm:text-base md:text-lg font-bold font-mono tracking-tight whitespace-nowrap"
        :class="transaction.type === 'income' ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'"
      >
        {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(Number(transaction.amount)) }}
      </span>

      <UDropdownMenu
        :items="[
          [
            { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => emit('edit', transaction) },
            { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => emit('delete', transaction) }
          ]
        ]"
      >
        <UButton
          icon="i-lucide-more-vertical"
          color="neutral"
          variant="ghost"
          size="xs"
          class="size-7 sm:size-8 p-0 text-muted hover:text-highlighted"
          aria-label="Actions"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>
