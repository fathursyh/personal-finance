<script setup lang="ts">
import type { BudgetSummaryItem } from '~/composables/useFinancialSummary'
import type { TransactionWithBudget } from '~/types/database.types'

definePageMeta({
  layout: 'dashboard',
  title: 'Overview'
})

useHead({
  title: 'Overview'
})

const { budgets, fetchBudgets, deleteBudget, budgetsLoaded } = useBudgets()
const { transactions, fetchTransactions, deleteTransaction, selectedMonth, transactionsLoaded } = useTransactions()
const {
  budgetSummaries,
  totalBudget,
  totalSpent,
  totalIncome,
  overallPercentage,
  formatCurrency
} = useFinancialSummary()

const netBalance = computed(() => totalIncome.value - totalSpent.value)

const isBudgetModalOpen = ref(false)
const isTransactionModalOpen = ref(false)
const budgetToEdit = ref<BudgetSummaryItem | null>(null)
const transactionToEdit = ref<TransactionWithBudget | null>(null)
const defaultBudgetId = ref<string | null>(null)

const selectedBudgetId = ref<string | null>(null)

const selectedBudget = computed(() => {
  if (!selectedBudgetId.value) return null
  return budgetSummaries.value.find(b => b.id === selectedBudgetId.value) || null
})

const selectedBudgetTransactions = computed(() => {
  if (!selectedBudgetId.value) return []
  return transactions.value.filter(t => t.budget_id === selectedBudgetId.value)
})

const isLoading = computed(() => {
  return (!budgetsLoaded.value && budgets.value.length === 0)
    || (!transactionsLoaded.value && transactions.value.length === 0)
})

watch(budgets, (newBudgets) => {
  if (selectedBudgetId.value && !newBudgets.some(b => b.id === selectedBudgetId.value)) {
    selectedBudgetId.value = null
  }
})

function toggleSelectBudget(budget: BudgetSummaryItem) {
  if (selectedBudgetId.value === budget.id) {
    selectedBudgetId.value = null
  } else {
    selectedBudgetId.value = budget.id
  }
}

function openNewBudgetModal() {
  budgetToEdit.value = null
  isBudgetModalOpen.value = true
}

function handleEditBudget(budget: BudgetSummaryItem) {
  budgetToEdit.value = budget
  isBudgetModalOpen.value = true
}

async function handleDeleteBudget(budget: BudgetSummaryItem) {
  if (confirm(`Are you sure you want to delete the budget "${budget.name}"? Transactions linked to it will remain but become unassigned.`)) {
    if (selectedBudgetId.value === budget.id) {
      selectedBudgetId.value = null
    }
    await deleteBudget(budget.id)
  }
}

function openNewTransactionModal(budgetId?: string) {
  transactionToEdit.value = null
  defaultBudgetId.value = budgetId || null
  isTransactionModalOpen.value = true
}

function handleEditTransaction(tx: TransactionWithBudget) {
  transactionToEdit.value = tx
  isTransactionModalOpen.value = true
}

async function handleDeleteTransaction(tx: TransactionWithBudget) {
  if (confirm(`Are you sure you want to delete "${tx.description}"?`)) {
    await deleteTransaction(tx.id)
  }
}

async function refreshAllData() {
  await Promise.all([
    fetchBudgets(),
    fetchTransactions()
  ])
}

function handleOpenCreateBudgetFromTx() {
  isTransactionModalOpen.value = false
  openNewBudgetModal()
}

function getPaymentIcon(method: string) {
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
  <div class="space-y-3.5 sm:space-y-5 pb-20 sm:pb-16">
    <!-- Top Action Bar -->
    <div class="flex items-center justify-between gap-2">
      <div>
        <h2 class="text-lg sm:text-2xl font-bold tracking-tight text-highlighted">
          Financial Overview
        </h2>
        <p class="hidden sm:block text-xs sm:text-sm text-muted">
          Track budgets, record daily expenses, and keep spending in control.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <MonthPicker />

        <UButton
          v-if="budgets.length > 0"
          icon="i-lucide-plus"
          color="primary"
          size="xs"
          class="hidden sm:inline-flex"
          @click="openNewTransactionModal(selectedBudgetId || undefined)"
        >
          Add Transaction
        </UButton>
      </div>
    </div>

    <!-- Loading State Skeleton -->
    <div
      v-if="isLoading"
      class="space-y-4"
    >
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3">
        <UCard
          v-for="i in 4"
          :key="i"
          class="p-2.5 sm:p-4"
        >
          <div class="flex items-center justify-between">
            <USkeleton class="h-3 w-16 sm:w-24" />
            <USkeleton class="size-4 rounded-full" />
          </div>
          <div class="mt-2 flex items-baseline justify-between">
            <USkeleton class="h-5 sm:h-7 w-20 sm:w-28" />
            <USkeleton class="h-3 w-10 sm:w-14" />
          </div>
        </UCard>
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <USkeleton class="h-5 w-24 sm:w-32" />
          <USkeleton class="h-6 w-20" />
        </div>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
          <UCard
            v-for="i in 3"
            :key="i"
            class="h-32 flex flex-col justify-between"
          >
            <div class="flex items-center justify-between">
              <USkeleton class="h-4 w-24" />
              <USkeleton class="size-5 rounded-md" />
            </div>
            <div class="space-y-1.5 my-2">
              <USkeleton class="h-3 w-full" />
              <USkeleton class="h-1.5 w-full rounded-full" />
            </div>
            <div class="flex justify-between">
              <USkeleton class="h-3 w-14" />
              <USkeleton class="h-3 w-16" />
            </div>
          </UCard>
        </div>
      </div>
    </div>

    <!-- Onboarding Empty State: When user has no budgets yet -->
    <div
      v-else-if="budgets.length === 0"
      class="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 sm:p-8 text-center"
    >
      <div class="mx-auto flex size-12 sm:size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3 sm:mb-4">
        <UIcon
          name="i-lucide-piggy-bank"
          class="size-6 sm:size-8"
        />
      </div>
      <h3 class="text-lg sm:text-xl font-bold text-highlighted">
        Step 1: Create your budgets first
      </h3>
      <p class="mx-auto mt-1.5 sm:mt-2 max-w-md text-xs sm:text-sm text-muted">
        Start by setting monthly spending limits for categories like Food & Dining, Rent, Groceries, or Entertainment.
        Once created, you can log transactions against them and see exactly how much you have left.
      </p>
      <div class="mt-4 sm:mt-6 flex justify-center gap-3">
        <UButton
          size="sm"
          color="primary"
          icon="i-lucide-plus"
          @click="openNewBudgetModal"
        >
          Create Your First Budget
        </UButton>
      </div>
    </div>

    <!-- Stats Grid & Main Content (When budgets exist) -->
    <template v-else>
      <!-- Stats Grid: 1. Expense This Month | 2. Income This Month | 3. Remaining to Spend | 4. Total Budget -->
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3">
        <!-- 1. Income This Month -->
        <UCard class="p-2.5 sm:p-4">
          <div class="flex items-center justify-between">
            <p class="text-[11px] sm:text-xs font-medium text-muted truncate">
              Income
            </p>
            <UIcon
              name="i-lucide-trending-up"
              class="size-3.5 sm:size-4 text-emerald-500"
            />
          </div>
          <div class="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
            <p class="text-sm sm:text-xl font-bold text-emerald-500 truncate">
              {{ formatCurrency(totalIncome) }}
            </p>
          </div>
        </UCard>

        <!-- 2. Expense This Month -->
        <UCard class="p-2.5 sm:p-4">
          <div class="flex items-center justify-between">
            <p class="text-[11px] sm:text-xs font-medium text-muted truncate">
              Expense
            </p>
            <UIcon
              name="i-lucide-trending-down"
              class="size-3.5 sm:size-4 text-rose-500"
            />
          </div>
          <div class="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
            <p class="text-sm sm:text-xl font-bold text-highlighted truncate">
              {{ formatCurrency(totalSpent) }}
            </p>
            <span
              class="text-[9px] sm:text-xs font-medium truncate"
              :class="overallPercentage >= 100 ? 'text-rose-500' : 'text-primary'"
            >
              {{ overallPercentage }}% used
            </span>
          </div>
        </UCard>

        <!-- 3. Remaining to Spend (Income - Expense) -->
        <UCard class="p-2.5 sm:p-4">
          <div class="flex items-center justify-between">
            <p class="text-[11px] sm:text-xs font-medium text-muted truncate">
              Net Balance
            </p>
            <UIcon
              name="i-lucide-piggy-bank"
              class="size-3.5 sm:size-4 text-muted"
            />
          </div>
          <div class="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
            <p
              class="text-sm sm:text-xl font-bold truncate"
              :class="netBalance < 0 ? 'text-rose-500' : 'text-highlighted'"
            >
              {{ formatCurrency(netBalance) }}
            </p>
            <span
              class="text-[9px] sm:text-xs font-medium truncate"
              :class="netBalance < 0 ? 'text-rose-500' : 'text-emerald-500'"
            >
              {{ netBalance < 0 ? 'Deficit' : 'Positive' }}
            </span>
          </div>
        </UCard>

        <!-- 4. Total Budget -->
        <UCard class="p-2.5 sm:p-4">
          <div class="flex items-center justify-between">
            <p class="text-[11px] sm:text-xs font-medium text-muted truncate">
              Total Budget
            </p>
            <UIcon
              name="i-lucide-wallet"
              class="size-3.5 sm:size-4 text-muted"
            />
          </div>
          <div class="mt-1 sm:mt-2 flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
            <p class="text-sm sm:text-xl font-bold text-highlighted truncate">
              {{ formatCurrency(totalBudget) }}
            </p>
            <span class="text-[9px] sm:text-xs font-medium text-muted truncate">
              {{ budgets.length }} {{ budgets.length === 1 ? 'cat.' : 'cats.' }}
            </span>
          </div>
        </UCard>
      </div>

      <!-- Budgets Section -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-highlighted">
              Budgets
            </h3>
            <p class="text-xs text-muted">
              Click a budget card below to inspect its transactions and details.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <UButton
              variant="ghost"
              color="neutral"
              size="xs"
              to="/dashboard/budgets"
              trailing-icon="i-lucide-arrow-right"
            >
              Manage budgets
            </UButton>
            <UButton
              size="xs"
              color="primary"
              icon="i-lucide-plus"
              @click="openNewBudgetModal"
            >
              New Budget
            </UButton>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <BudgetCard
            v-for="b in budgetSummaries"
            :key="b.id"
            :budget="b"
            :selected="selectedBudgetId === b.id"
            @select="toggleSelectBudget"
            @edit="handleEditBudget"
            @delete="handleDeleteBudget"
          />
        </div>
      </div>

      <!-- Budget Transactions Section -->
      <!-- Case A: No budget clicked yet -->
      <UCard
        v-if="!selectedBudgetId || !selectedBudget"
        class="border-dashed bg-elevated/20"
      >
        <div class="py-8 text-center">
          <UIcon
            name="i-lucide-mouse-pointer-click"
            class="mx-auto size-8 text-muted mb-2"
          />
          <p class="text-sm font-medium text-highlighted">
            Select a budget to view transactions
          </p>
          <p class="text-xs text-muted mt-1">
            Click on any budget card above to see all transactions logged under that category.
          </p>
        </div>
      </UCard>

      <!-- Case B: A budget is selected -->
      <UCard
        v-else
        class="overflow-hidden"
      >
        <template #header>
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                :class="{
                  'bg-emerald-500/10 text-emerald-500': selectedBudget.color === 'emerald',
                  'bg-amber-500/10 text-amber-500': selectedBudget.color === 'amber',
                  'bg-rose-500/10 text-rose-500': selectedBudget.color === 'rose',
                  'bg-violet-500/10 text-violet-500': selectedBudget.color === 'violet',
                  'bg-cyan-500/10 text-cyan-500': selectedBudget.color === 'cyan'
                }"
              >
                <UIcon
                  :name="selectedBudget.icon || 'i-lucide-wallet'"
                  class="size-4"
                />
              </div>

              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-highlighted truncate text-base">
                    {{ selectedBudget.name }} Transactions
                  </h3>
                  <UBadge
                    size="xs"
                    color="primary"
                    variant="subtle"
                  >
                    {{ selectedBudgetTransactions.length }}
                  </UBadge>
                </div>
                <p class="text-xs text-muted truncate">
                  Expenses & income logged for {{ selectedBudget.name }} in {{ selectedMonth }}.
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UButton
                :to="`/dashboard/transactions?budget=${selectedBudget.id}`"
                variant="ghost"
                color="neutral"
                size="xs"
                trailing-icon="i-lucide-arrow-right"
              >
                View all in Transactions
              </UButton>

              <UButton
                size="xs"
                color="primary"
                icon="i-lucide-plus"
                @click="openNewTransactionModal(selectedBudget.id)"
              >
                Add Transaction
              </UButton>

              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-lucide-x"
                title="Deselect budget"
                aria-label="Deselect budget"
                @click="selectedBudgetId = null"
              />
            </div>
          </div>
        </template>

        <!-- Empty state when selected budget has zero transactions this month -->
        <div
          v-if="selectedBudgetTransactions.length === 0"
          class="py-8 text-center"
        >
          <UIcon
            name="i-lucide-receipt"
            class="mx-auto size-8 text-muted mb-2"
          />
          <p class="text-sm font-medium text-highlighted">
            No transactions for {{ selectedBudget.name }} this month
          </p>
          <p class="text-xs text-muted mt-1">
            You haven't logged any expenses or income under this budget for {{ selectedMonth }} yet.
          </p>
          <UButton
            size="sm"
            color="primary"
            icon="i-lucide-plus"
            class="mt-4"
            @click="openNewTransactionModal(selectedBudget.id)"
          >
            Record First Transaction
          </UButton>
        </div>

        <!-- Transaction List for Selected Budget -->
        <div
          v-else
          class="divide-y divide-default"
        >
          <div
            v-for="tx in selectedBudgetTransactions"
            :key="tx.id"
            class="flex items-center justify-between py-1.5 sm:py-2 hover:bg-elevated/50 px-2 rounded-lg transition-colors"
          >
            <div class="flex items-center gap-2 sm:gap-3 min-w-0">
              <div
                class="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                :class="{
                  'bg-emerald-500/10 text-emerald-500': selectedBudget.color === 'emerald',
                  'bg-amber-500/10 text-amber-500': selectedBudget.color === 'amber',
                  'bg-rose-500/10 text-rose-500': selectedBudget.color === 'rose',
                  'bg-violet-500/10 text-violet-500': selectedBudget.color === 'violet',
                  'bg-cyan-500/10 text-cyan-500': selectedBudget.color === 'cyan'
                }"
              >
                <UIcon
                  :name="selectedBudget.icon || 'i-lucide-receipt'"
                  class="size-3.5 sm:size-4"
                />
              </div>

              <div class="min-w-0 truncate">
                <p class="text-xs sm:text-sm font-medium text-highlighted truncate">
                  {{ tx.description }}
                </p>
                <p class="text-[10px] sm:text-xs text-muted flex items-center gap-1.5">
                  <span>{{ tx.date }}</span>
                  <span>•</span>
                  <span class="inline-flex items-center gap-1">
                    <UIcon
                      :name="getPaymentIcon(tx.payment_method)"
                      class="size-2.5 sm:size-3"
                    />
                    {{ tx.payment_method }}
                  </span>
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 sm:gap-3">
              <span
                class="text-xs sm:text-sm font-semibold whitespace-nowrap"
                :class="tx.type === 'income' ? 'text-emerald-500' : 'text-highlighted'"
              >
                {{ tx.type === 'income' ? '+' : '-' }}{{ formatCurrency(Number(tx.amount)) }}
              </span>

              <UDropdownMenu
                :items="[
                  [
                    { label: 'Edit', icon: 'i-lucide-pencil', onSelect: () => handleEditTransaction(tx) },
                    { label: 'Delete', icon: 'i-lucide-trash-2', color: 'error', onSelect: () => handleDeleteTransaction(tx) }
                  ]
                ]"
              >
                <UButton
                  icon="i-lucide-more-vertical"
                  color="neutral"
                  variant="ghost"
                  size="xs"
                  aria-label="Actions"
                />
              </UDropdownMenu>
            </div>
          </div>
        </div>
      </UCard>
    </template>

    <!-- Mobile Floating Action Button -->
    <TransactionFab
      v-if="budgets.length > 0"
      @click="openNewTransactionModal(selectedBudgetId || undefined)"
    />

    <!-- Modals -->
    <BudgetModal
      v-model="isBudgetModalOpen"
      :budget-to-edit="budgetToEdit"
      @saved="refreshAllData"
    />

    <TransactionModal
      v-model="isTransactionModalOpen"
      :transaction-to-edit="transactionToEdit"
      :default-budget-id="defaultBudgetId"
      @saved="refreshAllData"
      @open-create-budget="handleOpenCreateBudgetFromTx"
    />
  </div>
</template>
