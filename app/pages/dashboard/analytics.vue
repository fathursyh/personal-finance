<script setup lang="ts">
import type { PaymentMethod } from '~/types/database.types'

definePageMeta({
  layout: 'dashboard',
  title: 'Analytics'
})

useHead({
  title: 'Analytics - Financial Tracker'
})

const { budgets, fetchBudgets } = useBudgets()
const { transactions, selectedMonth, fetchTransactions } = useTransactions()
const {
  budgetSummaries,
  totalBudget,
  totalSpent,
  totalRemaining,
  overallPercentage,
  formatCurrency
} = useFinancialSummary()

onMounted(async () => {
  await Promise.all([
    fetchBudgets(),
    fetchTransactions()
  ])
})

const averageDailySpend = computed(() => {
  const [yearStr, monthStr] = selectedMonth.value.split('-')
  const year = Number.parseInt(yearStr ?? '', 10)
  const month = Number.parseInt(monthStr ?? '', 10)
  const totalDaysInMonth = new Date(year, month, 0).getDate()

  const now = new Date()
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month
  const daysToDivide = isCurrentMonth ? Math.max(1, now.getDate()) : totalDaysInMonth

  return totalSpent.value > 0 ? totalSpent.value / daysToDivide : 0
})

const categoryBreakdown = computed(() => {
  return budgetSummaries.value
    .map((b) => {
      const shareOfTotalSpent = totalSpent.value > 0
        ? Math.round((b.spent / totalSpent.value) * 100)
        : 0
      return {
        ...b,
        shareOfTotalSpent
      }
    })
    .sort((a, b) => b.spent - a.spent)
})

const paymentMethodBreakdown = computed(() => {
  const methods: PaymentMethod[] = ['Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'E-Wallet', 'QRIS']
  const expenseTransactions = transactions.value.filter(t => t.type === 'expense')

  return methods
    .map((method) => {
      const txsForMethod = expenseTransactions.filter(t => t.payment_method === method)
      const amount = txsForMethod.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      const count = txsForMethod.length
      const share = totalSpent.value > 0 ? Math.round((amount / totalSpent.value) * 100) : 0

      return {
        method,
        amount,
        count,
        share
      }
    })
    .filter(m => m.count > 0 || m.amount > 0)
    .sort((a, b) => b.amount - a.amount)
})

const topCategory = computed(() => {
  const sorted = [...categoryBreakdown.value].filter(c => c.spent > 0)
  return sorted.length > 0 ? sorted[0] : null
})

const topPaymentMethod = computed(() => {
  return paymentMethodBreakdown.value.length > 0 ? paymentMethodBreakdown.value[0] : null
})

const highestTransaction = computed(() => {
  const expenses = transactions.value.filter(t => t.type === 'expense')
  if (expenses.length === 0) return null
  return [...expenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0]
})

function getPaymentMethodIcon(method: string) {
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
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-highlighted">
          Financial Analytics
        </h2>
        <p class="text-sm text-muted">
          Visual spending distribution, budget health analysis, and payment method breakdown for {{ selectedMonth }}.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <MonthPicker />
      </div>
    </div>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Spent
          </p>
          <UIcon
            name="i-lucide-trending-down"
            class="size-4 text-muted"
          />
        </div>
        <p class="mt-2 text-2xl font-bold text-highlighted">
          {{ formatCurrency(totalSpent) }}
        </p>
        <p class="mt-1 text-xs text-muted">
          {{ overallPercentage }}% of allocated budget
        </p>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Budget
          </p>
          <UIcon
            name="i-lucide-wallet"
            class="size-4 text-muted"
          />
        </div>
        <p class="mt-2 text-2xl font-bold text-highlighted">
          {{ formatCurrency(totalBudget) }}
        </p>
        <p class="mt-1 text-xs text-muted">
          Across {{ budgets.length }} {{ budgets.length === 1 ? 'category' : 'categories' }}
        </p>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Remaining Pool
          </p>
          <UIcon
            name="i-lucide-piggy-bank"
            class="size-4 text-muted"
          />
        </div>
        <p
          class="mt-2 text-2xl font-bold"
          :class="totalRemaining < 0 ? 'text-rose-500' : 'text-highlighted'"
        >
          {{ formatCurrency(Math.max(0, totalRemaining)) }}
        </p>
        <p
          class="mt-1 text-xs font-medium"
          :class="totalRemaining < 0 ? 'text-rose-500' : 'text-emerald-500'"
        >
          {{ totalRemaining < 0 ? 'Over budget limit' : 'Under budget' }}
        </p>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Avg Daily Spend
          </p>
          <UIcon
            name="i-lucide-calendar"
            class="size-4 text-muted"
          />
        </div>
        <p class="mt-2 text-2xl font-bold text-highlighted">
          {{ formatCurrency(averageDailySpend) }}
        </p>
        <p class="mt-1 text-xs text-muted">
          Paced per day this month
        </p>
      </UCard>
    </div>

    <!-- Highlights Section (When transactions exist) -->
    <div
      v-if="totalSpent > 0"
      class="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      <UCard v-if="topCategory">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
            :class="{
              'bg-emerald-500/10 text-emerald-500': topCategory.color === 'emerald',
              'bg-amber-500/10 text-amber-500': topCategory.color === 'amber',
              'bg-rose-500/10 text-rose-500': topCategory.color === 'rose',
              'bg-violet-500/10 text-violet-500': topCategory.color === 'violet',
              'bg-cyan-500/10 text-cyan-500': topCategory.color === 'cyan'
            }"
          >
            <UIcon
              :name="topCategory.icon || 'i-lucide-wallet'"
              class="size-5"
            />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-muted">
              Top Expense Category
            </p>
            <p class="text-base font-bold text-highlighted truncate">
              {{ topCategory.name }}
            </p>
            <p class="text-xs text-muted">
              {{ formatCurrency(topCategory.spent) }} ({{ topCategory.shareOfTotalSpent }}% of spend)
            </p>
          </div>
        </div>
      </UCard>

      <UCard v-if="topPaymentMethod">
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UIcon
              :name="getPaymentMethodIcon(topPaymentMethod.method)"
              class="size-5"
            />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-muted">
              Most Used Payment
            </p>
            <p class="text-base font-bold text-highlighted truncate">
              {{ topPaymentMethod.method }}
            </p>
            <p class="text-xs text-muted">
              {{ formatCurrency(topPaymentMethod.amount) }} ({{ topPaymentMethod.count }} transactions)
            </p>
          </div>
        </div>
      </UCard>

      <UCard v-if="highestTransaction">
        <div class="flex items-center gap-3">
          <div class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UIcon
              name="i-lucide-receipt"
              class="size-5"
            />
          </div>
          <div class="min-w-0">
            <p class="text-xs text-muted">
              Largest Single Expense
            </p>
            <p class="text-base font-bold text-highlighted truncate">
              {{ highestTransaction.description }}
            </p>
            <p class="text-xs text-muted">
              {{ formatCurrency(Number(highestTransaction.amount)) }} on {{ highestTransaction.date }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State: Zero Transactions -->
    <div
      v-if="totalSpent === 0"
      class="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center"
    >
      <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <UIcon
          name="i-lucide-chart-pie"
          class="size-8"
        />
      </div>
      <h3 class="text-xl font-bold text-highlighted">
        No spending recorded for {{ selectedMonth }}
      </h3>
      <p class="mx-auto mt-2 max-w-md text-sm text-muted">
        Once you log your transactions for this month, you'll see interactive visual breakdowns of your spending by category and payment method.
      </p>
      <div class="mt-6 flex justify-center gap-3">
        <UButton
          to="/dashboard/transactions"
          color="primary"
          icon="i-lucide-plus"
        >
          Go to Transactions
        </UButton>
      </div>
    </div>

    <!-- Main Analysis Grid -->
    <div
      v-else
      class="grid grid-cols-1 gap-6 lg:grid-cols-2"
    >
      <!-- Panel 1: Category Breakdown -->
      <UCard>
        <template #header>
          <div>
            <h3 class="font-semibold text-highlighted">
              Spending by Budget Category
            </h3>
            <p class="text-xs text-muted">
              Distribution of your {{ formatCurrency(totalSpent) }} total monthly expenses across categories.
            </p>
          </div>
        </template>

        <div class="space-y-5">
          <div
            v-for="cat in categoryBreakdown"
            :key="cat.id"
            class="space-y-1.5"
          >
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="cat.icon || 'i-lucide-wallet'"
                  class="size-4"
                  :class="{
                    'text-emerald-500': cat.color === 'emerald',
                    'text-amber-500': cat.color === 'amber',
                    'text-rose-500': cat.color === 'rose',
                    'text-violet-500': cat.color === 'violet',
                    'text-cyan-500': cat.color === 'cyan',
                    'text-primary': !cat.color || cat.color === 'primary'
                  }"
                />
                <span class="font-medium text-highlighted">{{ cat.name }}</span>
                <span class="text-xs text-muted">({{ cat.shareOfTotalSpent }}% of spend)</span>
              </div>

              <div class="text-right">
                <span class="font-bold text-highlighted">{{ formatCurrency(cat.spent) }}</span>
                <span class="text-xs text-muted"> / {{ formatCurrency(Number(cat.amount)) }}</span>
              </div>
            </div>

            <UProgress
              :model-value="cat.percentage"
              :color="cat.remaining < 0 ? 'error' : cat.status === 'warning' ? 'warning' : 'primary'"
              size="sm"
            />

            <div class="flex justify-between text-xs text-muted">
              <span>
                {{ cat.remaining < 0 ? 'Over budget by ' + formatCurrency(Math.abs(cat.remaining)) : formatCurrency(cat.remaining) + ' remaining' }}
              </span>
              <span>
                {{ cat.percentage }}% limit reached
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Panel 2: Payment Method Breakdown -->
      <UCard>
        <template #header>
          <div>
            <h3 class="font-semibold text-highlighted">
              Payment Method Breakdown
            </h3>
            <p class="text-xs text-muted">
              How you paid for expenses this month.
            </p>
          </div>
        </template>

        <div class="space-y-5">
          <div
            v-for="pm in paymentMethodBreakdown"
            :key="pm.method"
            class="space-y-1.5"
          >
            <div class="flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="getPaymentMethodIcon(pm.method)"
                  class="size-4 text-primary"
                />
                <span class="font-medium text-highlighted">{{ pm.method }}</span>
                <span class="text-xs text-muted">({{ pm.count }} txs)</span>
              </div>

              <div class="text-right">
                <span class="font-bold text-highlighted">{{ formatCurrency(pm.amount) }}</span>
                <span class="text-xs text-muted"> ({{ pm.share }}%)</span>
              </div>
            </div>

            <UProgress
              :model-value="pm.share"
              color="primary"
              size="sm"
            />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
