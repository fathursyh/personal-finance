<script setup lang="ts">
import type { PaymentMethod, TransactionWithBudget } from '~/types/database.types'

definePageMeta({
  layout: 'dashboard',
  title: 'Analytics'
})

useHead({
  title: 'Analytics - Financial Tracker'
})

const { budgets, budgetsLoaded } = useBudgets()
const { transactions, selectedMonth, transactionsLoaded } = useTransactions()
const {
  budgetSummaries,
  totalBudget,
  totalSpent,
  totalIncome,
  totalRemaining,
  overallPercentage,
  formatCurrency
} = useFinancialSummary()

const isLoading = computed(() => {
  return (!budgetsLoaded.value && budgets.value.length === 0)
    || (!transactionsLoaded.value && transactions.value.length === 0)
})

// Active analysis view tab
const activeTab = ref<'expenses' | 'income' | 'comparison'>('expenses')

// Cashflow Net Balance & Savings Rate
const netBalance = computed(() => totalIncome.value - totalSpent.value)
const savingsRate = computed(() => {
  if (totalIncome.value <= 0) return 0
  return Math.round((netBalance.value / totalIncome.value) * 100)
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

// ==============================================================================
// 1. EXPENSES ANALYTICS LOGIC
// ==============================================================================
const chartType = ref<'pie' | 'bar'>('pie')
const chartOptions = [
  { label: 'Pie Chart', value: 'pie' },
  { label: 'Bar Chart', value: 'bar' }
]

const hoveredCategoryId = ref<string | null>(null)

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

const activeCategories = computed(() => {
  return categoryBreakdown.value.filter(c => c.spent > 0)
})

const hoveredCategory = computed(() => {
  if (!hoveredCategoryId.value) return null
  return activeCategories.value.find(c => c.id === hoveredCategoryId.value) || null
})

const defaultPalette = [
  '#3b82f6', // blue / primary
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1' // indigo
]

function getCategoryColor(color?: string, index = 0): string {
  switch (color) {
    case 'emerald':
      return '#10b981'
    case 'amber':
      return '#f59e0b'
    case 'rose':
      return '#f43f5e'
    case 'violet':
      return '#8b5cf6'
    case 'cyan':
      return '#06b6d4'
    case 'primary':
      return '#3b82f6'
    default:
      return defaultPalette[index % defaultPalette.length] || '#3b82f6'
  }
}

const pieSegments = computed(() => {
  if (totalSpent.value <= 0) return []
  const C = 2 * Math.PI * 68
  let accumulated = 0

  return activeCategories.value.map((cat, index) => {
    const fraction = cat.spent / totalSpent.value
    const length = fraction * C
    const offset = -(accumulated * C)
    accumulated += fraction
    return {
      ...cat,
      colorHex: getCategoryColor(cat.color, index),
      dasharray: `${length} ${C}`,
      dashoffset: offset
    }
  })
})

const maxCategorySpent = computed(() => {
  if (activeCategories.value.length === 0) return 1
  return Math.max(...activeCategories.value.map(c => c.spent), 1)
})

const svgBarItems = computed(() => {
  const items = activeCategories.value
  const count = items.length
  if (count === 0) return []

  const totalPlotWidth = 420
  const barWidth = Math.min(46, Math.max(22, Math.floor(totalPlotWidth / count) - 16))
  const spacing = count > 1 ? (totalPlotWidth - count * barWidth) / (count - 1) : 0
  const baselineY = 175
  const maxH = 140

  return items.map((cat, index) => {
    const x = 60 + index * (barWidth + spacing)
    const height = Math.max(6, Math.round((cat.spent / maxCategorySpent.value) * maxH))
    const y = baselineY - height
    const colorHex = getCategoryColor(cat.color, index)

    return {
      ...cat,
      x,
      y,
      width: barWidth,
      height,
      colorHex
    }
  })
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

// ==============================================================================
// 2. INCOME ANALYTICS LOGIC ("Incomenya dapet dari mana aja")
// ==============================================================================
export interface IncomeSourceItem {
  id: string
  name: string
  amount: number
  count: number
  shareOfTotalIncome: number
  colorHex: string
  budgetName?: string
  budgetIcon?: string
  budgetColor?: string
}

const incomeChartType = ref<'pie' | 'bar'>('pie')
const hoveredIncomeSourceId = ref<string | null>(null)

const incomeTransactions = computed<TransactionWithBudget[]>(() => {
  return transactions.value.filter(t => t.type === 'income')
})

const incomeSourceBreakdown = computed<IncomeSourceItem[]>(() => {
  const map = new Map<string, {
    name: string
    amount: number
    count: number
    budgetName?: string
    budgetIcon?: string
    budgetColor?: string
  }>()

  const budgetMap = new Map(budgets.value.map(b => [b.id, b]))

  incomeTransactions.value.forEach((tx) => {
    const rawDesc = tx.description?.trim() || 'General Income'
    const budget = tx.budget_id ? budgetMap.get(tx.budget_id) : undefined

    const key = rawDesc.toLowerCase()
    const txAmount = Number(tx.amount) || 0
    const existing = map.get(key)

    if (existing) {
      existing.amount += txAmount
      existing.count += 1
      if (!existing.budgetName && budget) {
        existing.budgetName = budget.name
        existing.budgetIcon = budget.icon
        existing.budgetColor = budget.color
      }
    } else {
      map.set(key, {
        name: rawDesc,
        amount: txAmount,
        count: 1,
        budgetName: budget?.name,
        budgetIcon: budget?.icon,
        budgetColor: budget?.color
      })
    }
  })

  // Distinct vibrant palette for income sources (fresh emeralds, cyans, blues, purples)
  const incomePalette = [
    '#10b981', // emerald
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#14b8a6', // teal
    '#6366f1', // indigo
    '#f59e0b', // amber
    '#ec4899', // pink
    '#84cc16', // lime
    '#f97316' // orange
  ]

  const items: IncomeSourceItem[] = Array.from(map.entries()).map(([id, item], index) => {
    const shareOfTotalIncome = totalIncome.value > 0
      ? Math.round((item.amount / totalIncome.value) * 100)
      : 0
    return {
      id,
      name: item.name,
      amount: item.amount,
      count: item.count,
      shareOfTotalIncome,
      colorHex: incomePalette[index % incomePalette.length] || '#10b981',
      budgetName: item.budgetName,
      budgetIcon: item.budgetIcon,
      budgetColor: item.budgetColor
    }
  })

  return items.sort((a, b) => b.amount - a.amount)
})

const hoveredIncomeSource = computed(() => {
  if (!hoveredIncomeSourceId.value) return null
  return incomeSourceBreakdown.value.find(s => s.id === hoveredIncomeSourceId.value) || null
})

const incomePieSegments = computed(() => {
  if (totalIncome.value <= 0) return []
  const C = 2 * Math.PI * 68
  let accumulated = 0

  return incomeSourceBreakdown.value.map((src) => {
    const fraction = src.amount / totalIncome.value
    const length = fraction * C
    const offset = -(accumulated * C)
    accumulated += fraction
    return {
      ...src,
      dasharray: `${length} ${C}`,
      dashoffset: offset
    }
  })
})

const maxIncomeSourceAmount = computed(() => {
  if (incomeSourceBreakdown.value.length === 0) return 1
  return Math.max(...incomeSourceBreakdown.value.map(s => s.amount), 1)
})

const incomeSvgBarItems = computed(() => {
  const items = incomeSourceBreakdown.value
  const count = items.length
  if (count === 0) return []

  const totalPlotWidth = 420
  const barWidth = Math.min(46, Math.max(22, Math.floor(totalPlotWidth / count) - 16))
  const spacing = count > 1 ? (totalPlotWidth - count * barWidth) / (count - 1) : 0
  const baselineY = 175
  const maxH = 140

  return items.map((src, index) => {
    const x = 60 + index * (barWidth + spacing)
    const height = Math.max(6, Math.round((src.amount / maxIncomeSourceAmount.value) * maxH))
    const y = baselineY - height

    return {
      ...src,
      x,
      y,
      width: barWidth,
      height
    }
  })
})

const incomePaymentMethodBreakdown = computed(() => {
  const methods: PaymentMethod[] = ['Cash', 'Debit Card', 'Credit Card', 'Bank Transfer', 'E-Wallet', 'QRIS']

  return methods
    .map((method) => {
      const txsForMethod = incomeTransactions.value.filter(t => t.payment_method === method)
      const amount = txsForMethod.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
      const count = txsForMethod.length
      const share = totalIncome.value > 0 ? Math.round((amount / totalIncome.value) * 100) : 0

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

const topIncomeSource = computed(() => {
  return incomeSourceBreakdown.value.length > 0 ? incomeSourceBreakdown.value[0] : null
})

const topIncomePaymentMethod = computed(() => {
  return incomePaymentMethodBreakdown.value.length > 0 ? incomePaymentMethodBreakdown.value[0] : null
})

const highestIncomeTransaction = computed(() => {
  if (incomeTransactions.value.length === 0) return null
  return [...incomeTransactions.value].sort((a, b) => Number(b.amount) - Number(a.amount))[0]
})

const sortedIncomeTransactions = computed(() => {
  return [...incomeTransactions.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
  <div class="space-y-3.5 sm:space-y-5 pb-16 sm:pb-0">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2">
      <div>
        <h2 class="text-lg sm:text-2xl font-bold tracking-tight text-highlighted">
          Financial Analytics
        </h2>
        <p class="hidden sm:block text-xs sm:text-sm text-muted">
          Visual spending distribution, income source origins, and cashflow health for {{ selectedMonth }}.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <MonthPicker />
      </div>
    </div>

    <!-- Skeleton Loading State -->
    <div
      v-if="isLoading"
      class="space-y-4"
    >
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3">
        <UCard
          v-for="i in 4"
          :key="i"
          :ui="{ body: 'p-2.5 sm:p-4' }"
        >
          <div class="flex items-center justify-between">
            <USkeleton class="h-3 w-16 sm:w-24" />
            <USkeleton class="size-3.5 sm:size-4 rounded-full" />
          </div>
          <USkeleton class="mt-2 h-5 sm:h-7 w-20 sm:w-32" />
        </UCard>
      </div>

      <div class="grid grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-2">
        <UCard
          v-for="i in 2"
          :key="i"
          class="h-64 flex flex-col justify-between"
        >
          <USkeleton class="h-5 w-40" />
          <USkeleton class="h-44 w-full" />
        </UCard>
      </div>
    </div>

    <template v-else>
      <!-- Key Cashflow KPI Cards (Income, Expense, Net Flow, Savings Rate) -->
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3">
        <!-- 1. Total Income -->
        <UCard :ui="{ body: 'p-2.5 sm:p-4' }">
          <div class="flex items-center justify-between">
            <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted truncate">
              Total Income
            </p>
            <UIcon
              name="i-lucide-trending-up"
              class="size-3.5 sm:size-4 text-emerald-500 shrink-0"
            />
          </div>
          <p class="mt-1 sm:mt-2 text-xs sm:text-2xl font-bold text-emerald-500 truncate">
            +{{ formatCurrency(totalIncome) }}
          </p>
          <p class="hidden sm:block mt-1 text-xs text-muted truncate">
            {{ incomeTransactions.length }} {{ incomeTransactions.length === 1 ? 'deposit' : 'deposits' }} recorded
          </p>
        </UCard>

        <!-- 2. Total Spent -->
        <UCard :ui="{ body: 'p-2.5 sm:p-4' }">
          <div class="flex items-center justify-between">
            <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted truncate">
              Total Expenses
            </p>
            <UIcon
              name="i-lucide-trending-down"
              class="size-3.5 sm:size-4 text-rose-500 shrink-0"
            />
          </div>
          <p class="mt-1 sm:mt-2 text-xs sm:text-2xl font-bold text-highlighted truncate">
            {{ formatCurrency(totalSpent) }}
          </p>
          <p class="hidden sm:block mt-1 text-xs text-muted truncate">
            {{ overallPercentage }}% of allocated budget
          </p>
        </UCard>

        <!-- 3. Net Cashflow -->
        <UCard :ui="{ body: 'p-2.5 sm:p-4' }">
          <div class="flex items-center justify-between">
            <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted truncate">
              Net Cashflow
            </p>
            <UIcon
              name="i-lucide-piggy-bank"
              class="size-3.5 sm:size-4 text-muted shrink-0"
            />
          </div>
          <p
            class="mt-1 sm:mt-2 text-xs sm:text-2xl font-bold truncate"
            :class="netBalance < 0 ? 'text-rose-500' : 'text-emerald-500'"
          >
            {{ netBalance >= 0 ? '+' : '' }}{{ formatCurrency(netBalance) }}
          </p>
          <p
            class="hidden sm:block mt-1 text-xs font-medium truncate"
            :class="netBalance < 0 ? 'text-rose-500' : 'text-emerald-500'"
          >
            {{ netBalance >= 0 ? 'Monthly Net Surplus' : 'Monthly Deficit' }}
          </p>
        </UCard>

        <!-- 4. Savings Rate / Pacing -->
        <UCard :ui="{ body: 'p-2.5 sm:p-4' }">
          <div class="flex items-center justify-between">
            <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted truncate">
              Savings Rate
            </p>
            <UIcon
              name="i-lucide-shield-check"
              class="size-3.5 sm:size-4 text-muted shrink-0"
            />
          </div>
          <p
            class="mt-1 sm:mt-2 text-xs sm:text-2xl font-bold truncate"
            :class="savingsRate < 0 ? 'text-rose-500' : savingsRate >= 20 ? 'text-emerald-500' : 'text-highlighted'"
          >
            {{ totalIncome > 0 ? `${savingsRate}%` : '0%' }}
          </p>
          <p class="hidden sm:block mt-1 text-xs text-muted truncate">
            {{ totalIncome > 0 ? (savingsRate >= 0 ? 'Retained from earnings' : 'Overspent revenue') : 'No income logged' }}
          </p>
        </UCard>
      </div>

      <!-- Analytics Mode Switcher -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-default pb-3.5">
        <div class="inline-flex items-center p-1 rounded-xl bg-elevated/70 border border-default shadow-xs gap-1">
          <UButton
            size="sm"
            :variant="activeTab === 'expenses' ? 'solid' : 'ghost'"
            :color="activeTab === 'expenses' ? 'primary' : 'neutral'"
            icon="i-lucide-trending-down"
            class="rounded-lg text-xs sm:text-sm font-medium flex-1 sm:flex-none justify-center"
            @click="activeTab = 'expenses'"
          >
            Expenses
          </UButton>
          <UButton
            size="sm"
            :variant="activeTab === 'income' ? 'solid' : 'ghost'"
            :color="activeTab === 'income' ? 'primary' : 'neutral'"
            icon="i-lucide-trending-up"
            class="rounded-lg text-xs sm:text-sm font-medium flex-1 sm:flex-none justify-center"
            @click="activeTab = 'income'"
          >
            Income
          </UButton>
          <UButton
            size="sm"
            :variant="activeTab === 'comparison' ? 'solid' : 'ghost'"
            :color="activeTab === 'comparison' ? 'primary' : 'neutral'"
            icon="i-lucide-scale"
            class="rounded-lg text-xs sm:text-sm font-medium flex-1 sm:flex-none justify-center"
            @click="activeTab = 'comparison'"
          >
            Cashflow
          </UButton>
        </div>

        <div class="flex items-center gap-2 text-xs text-muted self-end sm:self-center">
          <span class="hidden sm:inline">Active View:</span>
          <UBadge
            :color="activeTab === 'income' ? 'success' : activeTab === 'expenses' ? 'primary' : 'neutral'"
            variant="subtle"
            size="sm"
          >
            {{ activeTab === 'income' ? 'Income Stream Analysis' : activeTab === 'expenses' ? 'Expense Category Breakdown' : 'Cashflow Comparison' }}
          </UBadge>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- TAB 1: EXPENSES ANALYSIS                                             -->
      <!-- ==================================================================== -->
      <div
        v-if="activeTab === 'expenses'"
        class="space-y-4 sm:space-y-6"
      >
        <!-- Highlights Section (When expenses exist) -->
        <div
          v-if="totalSpent > 0"
          class="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4"
        >
          <UCard
            v-if="topCategory"
            :ui="{ body: 'p-2.5 sm:p-4' }"
          >
            <div class="flex items-center gap-2.5 sm:gap-3">
              <div
                class="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 text-primary"
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
                  class="size-4 sm:size-5"
                />
              </div>
              <div class="min-w-0">
                <p class="text-[10px] sm:text-xs text-muted">
                  Top Expense Category
                </p>
                <p class="text-xs sm:text-base font-bold text-highlighted truncate">
                  {{ topCategory.name }}
                </p>
                <p class="text-[10px] sm:text-xs text-muted truncate">
                  {{ formatCurrency(topCategory.spent) }} ({{ topCategory.shareOfTotalSpent }}%)
                </p>
              </div>
            </div>
          </UCard>

          <UCard
            v-if="topPaymentMethod"
            :ui="{ body: 'p-2.5 sm:p-4' }"
          >
            <div class="flex items-center gap-2.5 sm:gap-3">
              <div class="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 text-primary">
                <UIcon
                  :name="getPaymentMethodIcon(topPaymentMethod.method)"
                  class="size-4 sm:size-5"
                />
              </div>
              <div class="min-w-0">
                <p class="text-[10px] sm:text-xs text-muted">
                  Most Used Payment
                </p>
                <p class="text-xs sm:text-base font-bold text-highlighted truncate">
                  {{ topPaymentMethod.method }}
                </p>
                <p class="text-[10px] sm:text-xs text-muted truncate">
                  {{ formatCurrency(topPaymentMethod.amount) }} ({{ topPaymentMethod.count }} txs)
                </p>
              </div>
            </div>
          </UCard>

          <UCard
            v-if="highestTransaction"
            :ui="{ body: 'p-2.5 sm:p-4' }"
          >
            <div class="flex items-center gap-2.5 sm:gap-3">
              <div class="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 text-primary">
                <UIcon
                  name="i-lucide-receipt"
                  class="size-4 sm:size-5"
                />
              </div>
              <div class="min-w-0">
                <p class="text-[10px] sm:text-xs text-muted">
                  Largest Single Expense
                </p>
                <p class="text-xs sm:text-base font-bold text-highlighted truncate">
                  {{ highestTransaction.description }}
                </p>
                <p class="text-[10px] sm:text-xs text-muted truncate">
                  {{ formatCurrency(Number(highestTransaction.amount)) }} • {{ highestTransaction.date }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Empty State: Zero Expenses -->
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
            No expenses recorded for {{ selectedMonth }}
          </h3>
          <p class="mx-auto mt-2 max-w-md text-sm text-muted">
            Once you log expense transactions for this month, you'll see interactive visual breakdowns of your spending by category and payment method.
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

        <!-- Main Expense Analysis Grid -->
        <div
          v-else
          class="grid grid-cols-1 gap-3.5 sm:gap-6 lg:grid-cols-2"
        >
          <!-- Panel 1: Category Breakdown & Interactive Charts -->
          <UCard :ui="{ body: 'p-3 sm:p-5' }">
            <template #header>
              <div class="flex items-center justify-between gap-2">
                <div>
                  <h3 class="font-semibold text-highlighted text-sm sm:text-base">
                    Spending by Category
                  </h3>
                  <p class="hidden sm:block text-xs text-muted">
                    Compare how much each budget has spent this month.
                  </p>
                </div>

                <div class="w-32 sm:w-36 shrink-0">
                  <USelect
                    v-model="chartType"
                    :items="chartOptions"
                    size="xs"
                  />
                </div>
              </div>
            </template>

            <!-- Chart View: Pie Chart -->
            <div
              v-if="chartType === 'pie'"
              class="space-y-4 sm:space-y-6"
            >
              <!-- Donut Chart & Center Metric -->
              <div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-1">
                <div class="relative size-44 sm:size-52 shrink-0 flex items-center justify-center">
                  <svg
                    class="size-full -rotate-90"
                    viewBox="0 0 200 200"
                  >
                    <!-- Background Circle -->
                    <circle
                      cx="100"
                      cy="100"
                      r="68"
                      class="stroke-neutral-100 dark:stroke-neutral-800"
                      stroke-width="26"
                      fill="none"
                    />
                    <!-- Slices -->
                    <circle
                      v-for="slice in pieSegments"
                      :key="slice.id"
                      cx="100"
                      cy="100"
                      r="68"
                      fill="none"
                      :stroke="slice.colorHex"
                      stroke-width="26"
                      :stroke-dasharray="slice.dasharray"
                      :stroke-dashoffset="slice.dashoffset"
                      class="transition-all duration-300 cursor-pointer"
                      :class="{ 'opacity-100 stroke-[30px]': hoveredCategoryId === slice.id, 'opacity-90 hover:opacity-100': hoveredCategoryId !== slice.id }"
                      @mouseenter="hoveredCategoryId = slice.id"
                      @mouseleave="hoveredCategoryId = null"
                    />
                  </svg>

                  <!-- Center Text -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                    <template v-if="hoveredCategory">
                      <span class="text-xs font-semibold text-muted truncate max-w-30">
                        {{ hoveredCategory.name }}
                      </span>
                      <span class="text-sm font-bold text-highlighted leading-tight mt-0.5">
                        {{ formatCurrency(hoveredCategory.spent) }}
                      </span>
                      <span class="text-[11px] font-medium text-primary mt-0.5">
                        {{ hoveredCategory.shareOfTotalSpent }}% of total
                      </span>
                    </template>
                    <template v-else>
                      <span class="text-[11px] uppercase tracking-wider text-muted font-medium">
                        Total Spent
                      </span>
                      <span class="text-sm font-bold text-highlighted leading-tight mt-0.5">
                        {{ formatCurrency(totalSpent) }}
                      </span>
                      <span class="text-[11px] text-muted mt-0.5">
                        {{ activeCategories.length }} categories
                      </span>
                    </template>
                  </div>
                </div>

                <!-- Interactive Legend -->
                <div class="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
                  <div
                    v-for="cat in pieSegments"
                    :key="cat.id"
                    class="flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    :class="hoveredCategoryId === cat.id ? 'bg-elevated' : 'hover:bg-elevated/50'"
                    @mouseenter="hoveredCategoryId = cat.id"
                    @mouseleave="hoveredCategoryId = null"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <span
                        class="size-2.5 rounded-full shrink-0"
                        :style="{ backgroundColor: cat.colorHex }"
                      />
                      <span class="font-medium text-highlighted truncate max-w-32.5">
                        {{ cat.name }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="font-semibold text-highlighted">
                        {{ formatCurrency(cat.spent) }}
                      </span>
                      <span class="text-muted w-9 text-right font-medium">
                        {{ cat.shareOfTotalSpent }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Detailed Budget Limits Progress List -->
              <div class="border-t border-default pt-4 space-y-3">
                <h4 class="text-xs font-semibold uppercase tracking-wider text-muted">
                  Category Limits & Progress
                </h4>
                <div
                  v-for="cat in categoryBreakdown"
                  :key="cat.id"
                  class="space-y-1"
                >
                  <div class="flex items-center justify-between text-xs">
                    <span class="font-medium text-highlighted truncate">{{ cat.name }}</span>
                    <span class="text-muted">
                      <span class="font-semibold text-highlighted">{{ formatCurrency(cat.spent) }}</span> / {{ formatCurrency(Number(cat.amount)) }}
                    </span>
                  </div>
                  <UProgress
                    :model-value="cat.percentage"
                    :color="cat.remaining < 0 ? 'error' : cat.status === 'warning' ? 'warning' : 'primary'"
                    size="xs"
                  />
                </div>
              </div>
            </div>

            <!-- Chart View: Bar Chart -->
            <div
              v-else
              class="space-y-6"
            >
              <!-- SVG Column Bar Graph -->
              <div class="w-full overflow-x-auto pb-1">
                <div class="min-w-105">
                  <svg
                    viewBox="0 0 500 220"
                    class="w-full h-48 select-none"
                  >
                    <!-- Horizontal Grid Lines -->
                    <line
                      x1="60"
                      y1="35"
                      x2="480"
                      y2="35"
                      class="stroke-neutral-200 dark:stroke-neutral-800"
                      stroke-dasharray="3 3"
                    />
                    <text
                      x="52"
                      y="39"
                      text-anchor="end"
                      class="text-[10px] fill-neutral-400 font-mono"
                    >
                      {{ formatCurrency(maxCategorySpent) }}
                    </text>

                    <line
                      x1="60"
                      y1="105"
                      x2="480"
                      y2="105"
                      class="stroke-neutral-200 dark:stroke-neutral-800"
                      stroke-dasharray="3 3"
                    />
                    <text
                      x="52"
                      y="109"
                      text-anchor="end"
                      class="text-[10px] fill-neutral-400 font-mono"
                    >
                      {{ formatCurrency(Math.round(maxCategorySpent / 2)) }}
                    </text>

                    <line
                      x1="60"
                      y1="175"
                      x2="480"
                      y2="175"
                      class="stroke-neutral-300 dark:stroke-neutral-700"
                    />
                    <text
                      x="52"
                      y="179"
                      text-anchor="end"
                      class="text-[10px] fill-neutral-400 font-mono"
                    >
                      Rp 0
                    </text>

                    <!-- Vertical Bars -->
                    <g
                      v-for="bar in svgBarItems"
                      :key="bar.id"
                      class="cursor-pointer group"
                      @mouseenter="hoveredCategoryId = bar.id"
                      @mouseleave="hoveredCategoryId = null"
                    >
                      <rect
                        :x="bar.x"
                        :y="bar.y"
                        :width="bar.width"
                        :height="bar.height"
                        rx="4"
                        :fill="bar.colorHex"
                        class="transition-all duration-300"
                        :class="hoveredCategoryId === bar.id ? 'opacity-100 filter brightness-110' : 'opacity-85 hover:opacity-100'"
                      />

                      <!-- Value above bar when hovered -->
                      <text
                        v-if="hoveredCategoryId === bar.id"
                        :x="bar.x + bar.width / 2"
                        :y="bar.y - 6"
                        text-anchor="middle"
                        class="text-[10px] font-bold fill-neutral-900 dark:fill-white font-mono"
                      >
                        {{ formatCurrency(bar.spent) }}
                      </text>

                      <!-- Category Name below bar -->
                      <text
                        :x="bar.x + bar.width / 2"
                        y="193"
                        text-anchor="middle"
                        class="text-[10px] fill-neutral-600 dark:fill-neutral-400 font-medium"
                        :class="{ 'font-bold fill-primary': hoveredCategoryId === bar.id }"
                      >
                        {{ bar.name.length > 8 ? bar.name.slice(0, 7) + '…' : bar.name }}
                      </text>
                    </g>
                  </svg>
                </div>
              </div>

              <!-- Ranked Comparative Breakdown -->
              <div class="border-t border-default pt-4 space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-semibold uppercase tracking-wider text-muted">
                    Spending Ranking (Highest to Lowest)
                  </h4>
                  <span class="text-xs text-muted">
                    Top spender: <strong class="text-highlighted">{{ activeCategories[0]?.name }}</strong>
                  </span>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="(cat, index) in activeCategories"
                    :key="cat.id"
                    class="p-2 rounded-lg transition-colors"
                    :class="hoveredCategoryId === cat.id ? 'bg-elevated' : 'hover:bg-elevated/40'"
                    @mouseenter="hoveredCategoryId = cat.id"
                    @mouseleave="hoveredCategoryId = null"
                  >
                    <div class="flex items-center justify-between text-xs mb-1">
                      <div class="flex items-center gap-2 min-w-0">
                        <span
                          class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          :class="index === 0 ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-neutral-100 dark:bg-neutral-800 text-muted'"
                        >
                          #{{ index + 1 }}
                        </span>
                        <span class="font-medium text-highlighted truncate">{{ cat.name }}</span>
                      </div>

                      <div class="flex items-center gap-2">
                        <span class="font-bold text-highlighted">{{ formatCurrency(cat.spent) }}</span>
                        <span class="text-muted font-medium">({{ cat.shareOfTotalSpent }}%)</span>
                      </div>
                    </div>

                    <!-- Relative Comparison Bar -->
                    <div class="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :style="{
                          width: `${Math.round((cat.spent / maxCategorySpent) * 100)}%`,
                          backgroundColor: getCategoryColor(cat.color, index)
                        }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Panel 2: Expense Payment Method Breakdown -->
          <UCard :ui="{ body: 'p-3 sm:p-5' }">
            <template #header>
              <div>
                <h3 class="font-semibold text-highlighted text-sm sm:text-base">
                  Payment Method Breakdown
                </h3>
                <p class="hidden sm:block text-xs text-muted">
                  How you paid for expenses this month.
                </p>
              </div>
            </template>

            <div class="space-y-3 sm:space-y-4">
              <div
                v-for="pm in paymentMethodBreakdown"
                :key="pm.method"
                class="space-y-1"
              >
                <div class="flex items-center justify-between text-xs sm:text-sm">
                  <div class="flex items-center gap-1.5 sm:gap-2">
                    <UIcon
                      :name="getPaymentMethodIcon(pm.method)"
                      class="size-3.5 sm:size-4 text-primary"
                    />
                    <span class="font-medium text-highlighted">{{ pm.method }}</span>
                    <span class="text-[10px] sm:text-xs text-muted">({{ pm.count }} txs)</span>
                  </div>

                  <div class="text-right">
                    <span class="font-bold text-highlighted">{{ formatCurrency(pm.amount) }}</span>
                    <span class="text-[10px] sm:text-xs text-muted"> ({{ pm.share }}%)</span>
                  </div>
                </div>

                <UProgress
                  :model-value="pm.share"
                  color="primary"
                  size="xs"
                />
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- ==================================================================== -->
      <!-- TAB 2: INCOME ANALYSIS ("Incomenya dapet dari mana aja")              -->
      <!-- ==================================================================== -->
      <div
        v-else-if="activeTab === 'income'"
        class="space-y-4 sm:space-y-6"
      >
        <!-- Highlights Section (When income exists) -->
        <div
          v-if="totalIncome > 0"
          class="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4"
        >
          <!-- 1. Top Income Stream -->
          <UCard
            v-if="topIncomeSource"
            :ui="{ body: 'p-2.5 sm:p-4' }"
          >
            <div class="flex items-center gap-2.5 sm:gap-3">
              <div class="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-500">
                <UIcon
                  :name="topIncomeSource.budgetIcon || 'i-lucide-sparkles'"
                  class="size-4 sm:size-5"
                />
              </div>
              <div class="min-w-0">
                <p class="text-[10px] sm:text-xs text-muted">
                  Top Income Stream
                </p>
                <p class="text-xs sm:text-base font-bold text-highlighted truncate">
                  {{ topIncomeSource.name }}
                </p>
                <p class="text-[10px] sm:text-xs text-muted truncate">
                  {{ formatCurrency(topIncomeSource.amount) }} ({{ topIncomeSource.shareOfTotalIncome }}%)
                </p>
              </div>
            </div>
          </UCard>

          <!-- 2. Most Used Inflow Channel -->
          <UCard
            v-if="topIncomePaymentMethod"
            :ui="{ body: 'p-2.5 sm:p-4' }"
          >
            <div class="flex items-center gap-2.5 sm:gap-3">
              <div class="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-cyan-500/10 text-cyan-500">
                <UIcon
                  :name="getPaymentMethodIcon(topIncomePaymentMethod.method)"
                  class="size-4 sm:size-5"
                />
              </div>
              <div class="min-w-0">
                <p class="text-[10px] sm:text-xs text-muted">
                  Main Inflow Channel
                </p>
                <p class="text-xs sm:text-base font-bold text-highlighted truncate">
                  {{ topIncomePaymentMethod.method }}
                </p>
                <p class="text-[10px] sm:text-xs text-muted truncate">
                  {{ formatCurrency(topIncomePaymentMethod.amount) }} ({{ topIncomePaymentMethod.count }} deposits)
                </p>
              </div>
            </div>
          </UCard>

          <!-- 3. Largest Single Deposit -->
          <UCard
            v-if="highestIncomeTransaction"
            :ui="{ body: 'p-2.5 sm:p-4' }"
          >
            <div class="flex items-center gap-2.5 sm:gap-3">
              <div class="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10 text-primary">
                <UIcon
                  name="i-lucide-arrow-down-left"
                  class="size-4 sm:size-5"
                />
              </div>
              <div class="min-w-0">
                <p class="text-[10px] sm:text-xs text-muted">
                  Largest Single Deposit
                </p>
                <p class="text-xs sm:text-base font-bold text-highlighted truncate">
                  {{ highestIncomeTransaction.description }}
                </p>
                <p class="text-[10px] sm:text-xs text-muted truncate">
                  {{ formatCurrency(Number(highestIncomeTransaction.amount)) }} • {{ highestIncomeTransaction.date }}
                </p>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Empty State: Zero Income -->
        <div
          v-if="totalIncome === 0"
          class="rounded-2xl border-2 border-dashed border-emerald-500/30 bg-emerald-500/5 p-12 text-center"
        >
          <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
            <UIcon
              name="i-lucide-badge-dollar-sign"
              class="size-8"
            />
          </div>
          <h3 class="text-xl font-bold text-highlighted">
            No income recorded for {{ selectedMonth }}
          </h3>
          <p class="mx-auto mt-2 max-w-md text-sm text-muted">
            When you log salary, freelance payments, dividends, or other revenue, you'll see interactive charts and a breakdown of where your income came from.
          </p>
          <div class="mt-6 flex justify-center gap-3">
            <UButton
              to="/dashboard/transactions"
              color="primary"
              icon="i-lucide-plus"
            >
              Log Income Transaction
            </UButton>
          </div>
        </div>

        <!-- Main Income Analysis Grid -->
        <div
          v-else
          class="grid grid-cols-1 gap-3.5 sm:gap-6 lg:grid-cols-2"
        >
          <!-- Panel 1: Income by Source Chart & Ranked Breakdown -->
          <UCard :ui="{ body: 'p-3 sm:p-5' }">
            <template #header>
              <div class="flex items-center justify-between gap-2">
                <div>
                  <h3 class="font-semibold text-highlighted text-sm sm:text-base">
                    Income Sources Breakdown
                  </h3>
                  <p class="hidden sm:block text-xs text-muted">
                    Origins of your income and revenue streams this month.
                  </p>
                </div>

                <div class="w-32 sm:w-36 shrink-0">
                  <USelect
                    v-model="incomeChartType"
                    :items="chartOptions"
                    size="xs"
                  />
                </div>
              </div>
            </template>

            <!-- Chart View: Pie Chart -->
            <div
              v-if="incomeChartType === 'pie'"
              class="space-y-4 sm:space-y-6"
            >
              <!-- Donut Chart & Center Metric -->
              <div class="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 py-1">
                <div class="relative size-44 sm:size-52 shrink-0 flex items-center justify-center">
                  <svg
                    class="size-full -rotate-90"
                    viewBox="0 0 200 200"
                  >
                    <!-- Background Circle -->
                    <circle
                      cx="100"
                      cy="100"
                      r="68"
                      class="stroke-neutral-100 dark:stroke-neutral-800"
                      stroke-width="26"
                      fill="none"
                    />
                    <!-- Slices -->
                    <circle
                      v-for="slice in incomePieSegments"
                      :key="slice.id"
                      cx="100"
                      cy="100"
                      r="68"
                      fill="none"
                      :stroke="slice.colorHex"
                      stroke-width="26"
                      :stroke-dasharray="slice.dasharray"
                      :stroke-dashoffset="slice.dashoffset"
                      class="transition-all duration-300 cursor-pointer"
                      :class="{ 'opacity-100 stroke-[30px]': hoveredIncomeSourceId === slice.id, 'opacity-90 hover:opacity-100': hoveredIncomeSourceId !== slice.id }"
                      @mouseenter="hoveredIncomeSourceId = slice.id"
                      @mouseleave="hoveredIncomeSourceId = null"
                    />
                  </svg>

                  <!-- Center Text -->
                  <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                    <template v-if="hoveredIncomeSource">
                      <span class="text-xs font-semibold text-muted truncate max-w-30">
                        {{ hoveredIncomeSource.name }}
                      </span>
                      <span class="text-sm font-bold text-emerald-500 leading-tight mt-0.5">
                        {{ formatCurrency(hoveredIncomeSource.amount) }}
                      </span>
                      <span class="text-[11px] font-medium text-primary mt-0.5">
                        {{ hoveredIncomeSource.shareOfTotalIncome }}% of income
                      </span>
                    </template>
                    <template v-else>
                      <span class="text-[11px] uppercase tracking-wider text-muted font-medium">
                        Total Income
                      </span>
                      <span class="text-sm font-bold text-emerald-500 leading-tight mt-0.5">
                        {{ formatCurrency(totalIncome) }}
                      </span>
                      <span class="text-[11px] text-muted mt-0.5">
                        {{ incomeSourceBreakdown.length }} {{ incomeSourceBreakdown.length === 1 ? 'stream' : 'streams' }}
                      </span>
                    </template>
                  </div>
                </div>

                <!-- Interactive Legend -->
                <div class="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
                  <div
                    v-for="src in incomePieSegments"
                    :key="src.id"
                    class="flex items-center justify-between p-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    :class="hoveredIncomeSourceId === src.id ? 'bg-elevated' : 'hover:bg-elevated/50'"
                    @mouseenter="hoveredIncomeSourceId = src.id"
                    @mouseleave="hoveredIncomeSourceId = null"
                  >
                    <div class="flex items-center gap-2 min-w-0">
                      <span
                        class="size-2.5 rounded-full shrink-0"
                        :style="{ backgroundColor: src.colorHex }"
                      />
                      <span class="font-medium text-highlighted truncate max-w-32.5">
                        {{ src.name }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <span class="font-semibold text-emerald-500">
                        {{ formatCurrency(src.amount) }}
                      </span>
                      <span class="text-muted w-9 text-right font-medium">
                        {{ src.shareOfTotalIncome }}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Ranked Income Sources (Relative comparison) -->
              <div class="border-t border-default pt-4 space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-semibold uppercase tracking-wider text-muted">
                    Income Streams Ranked
                  </h4>
                  <span class="text-xs text-muted">
                    Top source: <strong class="text-emerald-500">{{ incomeSourceBreakdown[0]?.name }}</strong>
                  </span>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="(src, index) in incomeSourceBreakdown"
                    :key="src.id"
                    class="p-2 rounded-lg transition-colors"
                    :class="hoveredIncomeSourceId === src.id ? 'bg-elevated' : 'hover:bg-elevated/40'"
                    @mouseenter="hoveredIncomeSourceId = src.id"
                    @mouseleave="hoveredIncomeSourceId = null"
                  >
                    <div class="flex items-center justify-between text-xs mb-1">
                      <div class="flex items-center gap-2 min-w-0">
                        <span
                          class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          :class="index === 0 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-neutral-800 text-muted'"
                        >
                          #{{ index + 1 }}
                        </span>
                        <span class="font-medium text-highlighted truncate">{{ src.name }}</span>
                        <UBadge
                          v-if="src.budgetName"
                          color="neutral"
                          variant="subtle"
                          size="xs"
                          class="text-[10px] py-0 px-1 hidden sm:inline-flex"
                        >
                          {{ src.budgetName }}
                        </UBadge>
                      </div>

                      <div class="flex items-center gap-2">
                        <span class="font-bold text-emerald-500">{{ formatCurrency(src.amount) }}</span>
                        <span class="text-muted font-medium">({{ src.shareOfTotalIncome }}%)</span>
                      </div>
                    </div>

                    <!-- Relative Progress Bar -->
                    <div class="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :style="{
                          width: `${Math.round((src.amount / maxIncomeSourceAmount) * 100)}%`,
                          backgroundColor: src.colorHex
                        }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Chart View: Bar Chart -->
            <div
              v-else
              class="space-y-6"
            >
              <!-- SVG Column Bar Graph -->
              <div class="w-full overflow-x-auto pb-1">
                <div class="min-w-105">
                  <svg
                    viewBox="0 0 500 220"
                    class="w-full h-48 select-none"
                  >
                    <!-- Horizontal Grid Lines -->
                    <line
                      x1="60"
                      y1="35"
                      x2="480"
                      y2="35"
                      class="stroke-neutral-200 dark:stroke-neutral-800"
                      stroke-dasharray="3 3"
                    />
                    <text
                      x="52"
                      y="39"
                      text-anchor="end"
                      class="text-[10px] fill-neutral-400 font-mono"
                    >
                      {{ formatCurrency(maxIncomeSourceAmount) }}
                    </text>

                    <line
                      x1="60"
                      y1="105"
                      x2="480"
                      y2="105"
                      class="stroke-neutral-200 dark:stroke-neutral-800"
                      stroke-dasharray="3 3"
                    />
                    <text
                      x="52"
                      y="109"
                      text-anchor="end"
                      class="text-[10px] fill-neutral-400 font-mono"
                    >
                      {{ formatCurrency(Math.round(maxIncomeSourceAmount / 2)) }}
                    </text>

                    <line
                      x1="60"
                      y1="175"
                      x2="480"
                      y2="175"
                      class="stroke-neutral-300 dark:stroke-neutral-700"
                    />
                    <text
                      x="52"
                      y="179"
                      text-anchor="end"
                      class="text-[10px] fill-neutral-400 font-mono"
                    >
                      Rp 0
                    </text>

                    <!-- Vertical Bars -->
                    <g
                      v-for="bar in incomeSvgBarItems"
                      :key="bar.id"
                      class="cursor-pointer group"
                      @mouseenter="hoveredIncomeSourceId = bar.id"
                      @mouseleave="hoveredIncomeSourceId = null"
                    >
                      <rect
                        :x="bar.x"
                        :y="bar.y"
                        :width="bar.width"
                        :height="bar.height"
                        rx="4"
                        :fill="bar.colorHex"
                        class="transition-all duration-300"
                        :class="hoveredIncomeSourceId === bar.id ? 'opacity-100 filter brightness-110' : 'opacity-85 hover:opacity-100'"
                      />

                      <!-- Value above bar when hovered -->
                      <text
                        v-if="hoveredIncomeSourceId === bar.id"
                        :x="bar.x + bar.width / 2"
                        :y="bar.y - 6"
                        text-anchor="middle"
                        class="text-[10px] font-bold fill-neutral-900 dark:fill-white font-mono"
                      >
                        {{ formatCurrency(bar.amount) }}
                      </text>

                      <!-- Source Name below bar -->
                      <text
                        :x="bar.x + bar.width / 2"
                        y="193"
                        text-anchor="middle"
                        class="text-[10px] fill-neutral-600 dark:fill-neutral-400 font-medium"
                        :class="{ 'font-bold fill-emerald-500': hoveredIncomeSourceId === bar.id }"
                      >
                        {{ bar.name.length > 8 ? bar.name.slice(0, 7) + '…' : bar.name }}
                      </text>
                    </g>
                  </svg>
                </div>
              </div>

              <!-- Ranked Comparative Breakdown -->
              <div class="border-t border-default pt-4 space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-semibold uppercase tracking-wider text-muted">
                    Income Streams Ranked
                  </h4>
                  <span class="text-xs text-muted">
                    Top source: <strong class="text-emerald-500">{{ incomeSourceBreakdown[0]?.name }}</strong>
                  </span>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="(src, index) in incomeSourceBreakdown"
                    :key="src.id"
                    class="p-2 rounded-lg transition-colors"
                    :class="hoveredIncomeSourceId === src.id ? 'bg-elevated' : 'hover:bg-elevated/40'"
                    @mouseenter="hoveredIncomeSourceId = src.id"
                    @mouseleave="hoveredIncomeSourceId = null"
                  >
                    <div class="flex items-center justify-between text-xs mb-1">
                      <div class="flex items-center gap-2 min-w-0">
                        <span
                          class="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          :class="index === 0 ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-neutral-800 text-muted'"
                        >
                          #{{ index + 1 }}
                        </span>
                        <span class="font-medium text-highlighted truncate">{{ src.name }}</span>
                      </div>

                      <div class="flex items-center gap-2">
                        <span class="font-bold text-emerald-500">{{ formatCurrency(src.amount) }}</span>
                        <span class="text-muted font-medium">({{ src.shareOfTotalIncome }}%)</span>
                      </div>
                    </div>

                    <!-- Relative Comparison Bar -->
                    <div class="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all duration-500"
                        :style="{
                          width: `${Math.round((src.amount / maxIncomeSourceAmount) * 100)}%`,
                          backgroundColor: src.colorHex
                        }"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Panel 2: Inflow Receiving Channels (Payment Methods) -->
          <UCard :ui="{ body: 'p-3 sm:p-5' }">
            <template #header>
              <div>
                <h3 class="font-semibold text-highlighted text-sm sm:text-base">
                  Deposit / Receiving Channels
                </h3>
                <p class="hidden sm:block text-xs text-muted">
                  How your income was received into your accounts.
                </p>
              </div>
            </template>

            <div class="space-y-3 sm:space-y-4">
              <div
                v-for="pm in incomePaymentMethodBreakdown"
                :key="pm.method"
                class="space-y-1"
              >
                <div class="flex items-center justify-between text-xs sm:text-sm">
                  <div class="flex items-center gap-1.5 sm:gap-2">
                    <UIcon
                      :name="getPaymentMethodIcon(pm.method)"
                      class="size-3.5 sm:size-4 text-emerald-500"
                    />
                    <span class="font-medium text-highlighted">{{ pm.method }}</span>
                    <span class="text-[10px] sm:text-xs text-muted">({{ pm.count }} deposits)</span>
                  </div>

                  <div class="text-right">
                    <span class="font-bold text-emerald-500">+{{ formatCurrency(pm.amount) }}</span>
                    <span class="text-[10px] sm:text-xs text-muted"> ({{ pm.share }}%)</span>
                  </div>
                </div>

                <UProgress
                  :model-value="pm.share"
                  color="success"
                  size="xs"
                />
              </div>
            </div>
          </UCard>
        </div>

        <!-- Panel 3: Itemized Income Transactions Ledger -->
        <UCard
          v-if="totalIncome > 0"
          :ui="{ body: 'p-3 sm:p-5' }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-highlighted text-sm sm:text-base">
                  Itemized Income Log
                </h3>
                <p class="text-xs text-muted">
                  Every deposit and revenue recorded for {{ selectedMonth }}.
                </p>
              </div>
              <UBadge
                color="success"
                variant="subtle"
                size="sm"
              >
                {{ incomeTransactions.length }} transactions
              </UBadge>
            </div>
          </template>

          <div class="divide-y divide-default">
            <div
              v-for="tx in sortedIncomeTransactions"
              :key="tx.id"
              class="py-2.5 sm:py-3 flex items-center justify-between gap-3 text-xs sm:text-sm first:pt-0 last:pb-0"
            >
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <UIcon
                    :name="getPaymentMethodIcon(tx.payment_method)"
                    class="size-4"
                  />
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-highlighted truncate">
                    {{ tx.description }}
                  </p>
                  <div class="flex items-center gap-2 text-[10px] sm:text-xs text-muted mt-0.5">
                    <span>{{ tx.date }}</span>
                    <span>•</span>
                    <span>{{ tx.payment_method }}</span>
                    <template v-if="tx.budget">
                      <span>•</span>
                      <span class="text-primary font-medium">{{ tx.budget.name }}</span>
                    </template>
                  </div>
                </div>
              </div>

              <div class="text-right shrink-0">
                <span class="font-bold text-emerald-500 text-xs sm:text-base">
                  +{{ formatCurrency(Number(tx.amount)) }}
                </span>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- ==================================================================== -->
      <!-- TAB 3: CASHFLOW & COMPARISON                                         -->
      <!-- ==================================================================== -->
      <div
        v-else-if="activeTab === 'comparison'"
        class="space-y-4 sm:space-y-6"
      >
        <!-- Cashflow Ratio Comparison Card -->
        <UCard :ui="{ body: 'p-4 sm:p-6' }">
          <div class="space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 class="font-bold text-highlighted text-base sm:text-lg">
                  Monthly Cashflow Balance
                </h3>
                <p class="text-xs sm:text-sm text-muted">
                  Comparison between total money in (Income) and total money out (Expenses).
                </p>
              </div>
              <UBadge
                :color="netBalance >= 0 ? 'success' : 'error'"
                variant="subtle"
                size="md"
                class="self-start sm:self-auto font-bold"
              >
                {{ netBalance >= 0 ? 'Cashflow Positive' : 'Deficit Alert' }}
              </UBadge>
            </div>

            <!-- Two-Sided Visual Ratio Bar -->
            <div class="space-y-2 pt-2">
              <div class="flex items-center justify-between text-xs sm:text-sm font-semibold">
                <span class="text-emerald-500 flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-trending-up"
                    class="size-4"
                  />
                  Income: {{ formatCurrency(totalIncome) }}
                </span>
                <span class="text-rose-500 flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-trending-down"
                    class="size-4"
                  />
                  Expenses: {{ formatCurrency(totalSpent) }}
                </span>
              </div>

              <!-- Dual progress representation -->
              <div class="w-full bg-neutral-100 dark:bg-neutral-800 h-4 rounded-full overflow-hidden flex">
                <div
                  class="bg-emerald-500 h-full transition-all duration-700"
                  :style="{ width: `${totalIncome + totalSpent > 0 ? (totalIncome / (totalIncome + totalSpent)) * 100 : 50}%` }"
                  :title="`Income share: ${totalIncome + totalSpent > 0 ? Math.round((totalIncome / (totalIncome + totalSpent)) * 100) : 50}%`"
                />
                <div
                  class="bg-rose-500 h-full transition-all duration-700"
                  :style="{ width: `${totalIncome + totalSpent > 0 ? (totalSpent / (totalIncome + totalSpent)) * 100 : 50}%` }"
                  :title="`Expense share: ${totalIncome + totalSpent > 0 ? Math.round((totalSpent / (totalIncome + totalSpent)) * 100) : 50}%`"
                />
              </div>

              <div class="flex items-center justify-between text-[10px] sm:text-xs text-muted">
                <span>{{ totalIncome + totalSpent > 0 ? Math.round((totalIncome / (totalIncome + totalSpent)) * 100) : 50 }}% of total flow</span>
                <span>{{ totalIncome + totalSpent > 0 ? Math.round((totalSpent / (totalIncome + totalSpent)) * 100) : 50 }}% of total flow</span>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Detailed Financial Health Assessment -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <UCard :ui="{ body: 'p-3 sm:p-4' }">
            <p class="text-xs text-muted font-medium">
              Net Savings Retained
            </p>
            <p
              class="text-lg sm:text-2xl font-bold mt-1"
              :class="netBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'"
            >
              {{ netBalance >= 0 ? '+' : '' }}{{ formatCurrency(netBalance) }}
            </p>
            <p class="text-xs text-muted mt-1">
              {{ netBalance >= 0 ? 'Available for emergency fund & investment' : 'Covered by savings or credit' }}
            </p>
          </UCard>

          <UCard :ui="{ body: 'p-3 sm:p-4' }">
            <p class="text-xs text-muted font-medium">
              Daily Expense Pacing
            </p>
            <p class="text-lg sm:text-2xl font-bold text-highlighted mt-1">
              {{ formatCurrency(averageDailySpend) }}
            </p>
            <p class="text-xs text-muted mt-1">
              Average spent per day this month
            </p>
          </UCard>

          <UCard :ui="{ body: 'p-3 sm:p-4' }">
            <p class="text-xs text-muted font-medium">
              Budget Allocated
            </p>
            <p class="text-lg sm:text-2xl font-bold text-primary mt-1">
              {{ formatCurrency(totalBudget) }}
            </p>
            <p class="text-xs text-muted mt-1">
              Across {{ budgets.length }} categories ({{ totalRemaining >= 0 ? formatCurrency(totalRemaining) + ' left' : 'Over budget' }})
            </p>
          </UCard>
        </div>
      </div>
    </template>
  </div>
</template>
