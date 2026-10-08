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
    class="flex items-center justify-between px-2.5 py-2 sm:px-4 sm:py-2.5 transition-colors hover:bg-elevated/40 cursor-pointer select-none"
    @click="emit('edit', transaction)"
  >
    <!-- Left Column: Category Tag -->
    <div class="w-18 sm:w-22 shrink-0 flex items-center pr-1.5 sm:pr-2">
      <span
        class="inline-block max-w-full truncate px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold tracking-wider rounded border uppercase text-center"
        :class="budgetColorClass"
        :title="budgetDisplayName"
      >
        {{ budgetDisplayName }}
      </span>
    </div>

    <!-- Center Column: Note/Description + Account -->
    <div class="min-w-0 flex-1 px-1 sm:px-2">
      <p class="text-xs sm:text-sm font-semibold text-highlighted line-clamp-2 break-words leading-snug">
        {{ transaction.description }}
      </p>

      <div class="mt-0.5 flex items-center gap-1.5 text-[10px] sm:text-xs text-muted truncate">
        <UIcon
          :name="getPaymentIcon(transaction.payment_method)"
          class="size-3 sm:size-3.5 shrink-0"
        />
        <span class="truncate">{{ transaction.payment_method }}</span>
      </div>
    </div>

    <!-- Right Column: Amount + Action menu -->
    <div
      class="shrink-0 flex items-center gap-1 sm:gap-2 text-right pl-1 sm:pl-2"
      @click.stop
    >
      <span
        class="text-xs sm:text-sm font-bold whitespace-nowrap"
        :class="transaction.type === 'income' ? 'text-emerald-500' : 'text-rose-500'"
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
          class="size-6 p-0 text-muted hover:text-highlighted"
          aria-label="Actions"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>
