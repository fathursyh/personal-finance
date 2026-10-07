<script setup lang="ts">
import type { PaymentMethod } from '~/types/database.types'

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
  totalRemaining,
  overallPercentage,
  formatCurrency
} = useFinancialSummary()

const isLoading = computed(() => {
  return (!budgetsLoaded.value && budgets.value.length === 0)
    || (!transactionsLoaded.value && transactions.value.length === 0)
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
          Visual spending distribution, budget health analysis, and payment method breakdown for {{ selectedMonth }}.
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
      <!-- Key Metrics Cards -->
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3">
        <UCard :ui="{ body: 'p-2.5 sm:p-4' }">
          <div class="flex items-center justify-between">
            <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted truncate">
              Total Spent
            </p>
            <UIcon
              name="i-lucide-trending-down"
              class="size-3.5 sm:size-4 text-muted shrink-0"
            />
          </div>
          <p class="mt-1 sm:mt-2 text-xs sm:text-2xl font-bold text-highlighted truncate">
            {{ formatCurrency(totalSpent) }}
          </p>
          <p class="hidden sm:block mt-1 text-xs text-muted truncate">
            {{ overallPercentage }}% of allocated budget
          </p>
        </UCard>

        <UCard :ui="{ body: 'p-2.5 sm:p-4' }">
          <div class="flex items-center justify-between">
            <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted truncate">
              Total Budget
            </p>
            <UIcon
              name="i-lucide-wallet"
              class="size-3.5 sm:size-4 text-muted shrink-0"
            />
          </div>
          <p class="mt-1 sm:mt-2 text-xs sm:text-2xl font-bold text-highlighted truncate">
            {{ formatCurrency(totalBudget) }}
          </p>
          <p class="hidden sm:block mt-1 text-xs text-muted truncate">
            Across {{ budgets.length }} {{ budgets.length === 1 ? 'category' : 'categories' }}
          </p>
        </UCard>

        <UCard :ui="{ body: 'p-2.5 sm:p-4' }">
          <div class="flex items-center justify-between">
            <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted truncate">
              Remaining Pool
            </p>
            <UIcon
              name="i-lucide-piggy-bank"
              class="size-3.5 sm:size-4 text-muted shrink-0"
            />
          </div>
          <p
            class="mt-1 sm:mt-2 text-xs sm:text-2xl font-bold truncate"
            :class="totalRemaining < 0 ? 'text-rose-500' : 'text-highlighted'"
          >
            {{ formatCurrency(Math.max(0, totalRemaining)) }}
          </p>
          <p
            class="hidden sm:block mt-1 text-xs font-medium truncate"
            :class="totalRemaining < 0 ? 'text-rose-500' : 'text-emerald-500'"
          >
            {{ totalRemaining < 0 ? 'Over budget limit' : 'Under budget' }}
          </p>
        </UCard>

        <UCard :ui="{ body: 'p-2.5 sm:p-4' }">
          <div class="flex items-center justify-between">
            <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted truncate">
              Avg Daily Spend
            </p>
            <UIcon
              name="i-lucide-calendar"
              class="size-3.5 sm:size-4 text-muted shrink-0"
            />
          </div>
          <p class="mt-1 sm:mt-2 text-xs sm:text-2xl font-bold text-highlighted truncate">
            {{ formatCurrency(averageDailySpend) }}
          </p>
          <p class="hidden sm:block mt-1 text-xs text-muted truncate">
            Paced per day this month
          </p>
        </UCard>
      </div>

      <!-- Highlights Section (When transactions exist) -->
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

          <!-- If no active expenses -->
          <div
            v-if="activeCategories.length === 0"
            class="py-8 sm:py-12 text-center"
          >
            <UIcon
              name="i-lucide-receipt"
              class="mx-auto size-7 sm:size-8 text-muted mb-2"
            />
            <p class="text-xs sm:text-sm font-medium text-highlighted">
              No expenses recorded for {{ selectedMonth }}
            </p>
            <p class="text-[10px] sm:text-xs text-muted mt-1">
              Add transactions under your budgets to visualize spending charts.
            </p>
          </div>

          <!-- Chart View: Pie Chart -->
          <div
            v-else-if="chartType === 'pie'"
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

            <!-- Ranked Comparative Breakdown (Which budget spent most than others) -->
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
    </template>
  </div>
</template>
