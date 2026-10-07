<script setup lang="ts">
import type { BudgetSummaryItem } from '~/composables/useFinancialSummary'

definePageMeta({
  layout: 'dashboard',
  title: 'Budgets'
})

useHead({
  title: 'Budgets - Financial Tracker'
})

const { budgets, loading, deleteBudget, budgetsLoaded, fetchBudgets } = useBudgets()
const {
  budgetSummaries,
  totalBudget,
  totalSpent,
  totalRemaining,
  formatCurrency
} = useFinancialSummary()

const isBudgetModalOpen = ref(false)
const budgetToEdit = ref<BudgetSummaryItem | null>(null)
const searchQuery = ref('')

const isLoading = computed(() => (!budgetsLoaded.value && budgets.value.length === 0) || loading.value)

const filteredBudgets = computed(() => {
  if (!searchQuery.value.trim()) return budgetSummaries.value
  const query = searchQuery.value.toLowerCase().trim()
  return budgetSummaries.value.filter(b => b.name.toLowerCase().includes(query))
})

function openNewBudgetModal() {
  budgetToEdit.value = null
  isBudgetModalOpen.value = true
}

function handleEditBudget(budget: BudgetSummaryItem) {
  budgetToEdit.value = budget
  isBudgetModalOpen.value = true
}

async function handleDeleteBudget(budget: BudgetSummaryItem) {
  if (confirm(`Are you sure you want to delete the budget "${budget.name}"? Transactions assigned to this budget will remain but become unassigned.`)) {
    await deleteBudget(budget.id)
  }
}
</script>

<template>
  <div class="space-y-3.5 sm:space-y-5 pb-16 sm:pb-0">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2">
      <div>
        <h2 class="text-lg sm:text-2xl font-bold tracking-tight text-highlighted">
          Budget Management
        </h2>
        <p class="hidden sm:block text-xs sm:text-sm text-muted">
          Set monthly spending limits, monitor remaining funds, and track when limits were last updated.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <MonthPicker />

        <UButton
          icon="i-lucide-plus"
          color="primary"
          size="xs"
          @click="openNewBudgetModal"
        >
          <span class="hidden sm:inline">New Budget</span>
          <span class="sm:hidden">New</span>
        </UButton>
      </div>
    </div>

    <!-- Quick Stats -->
    <div
      v-if="budgets.length > 0"
      class="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-4"
    >
      <UCard :ui="{ body: 'p-2.5 sm:p-4' }">
        <div class="flex items-center justify-between">
          <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted truncate">
            Allocated
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
            Spent
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
          {{ totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0 }}% used
        </p>
      </UCard>

      <UCard :ui="{ body: 'p-2.5 sm:p-4' }">
        <div class="flex items-center justify-between">
          <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted truncate">
            Remaining
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
          {{ totalRemaining < 0 ? 'Over allocated' : 'Safe to spend' }}
        </p>
      </UCard>
    </div>

    <!-- Search / Filter Bar (if multiple budgets) -->
    <div
      v-if="budgets.length > 2"
      class="flex items-center justify-between gap-2"
    >
      <div class="w-full max-w-xs">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Filter budgets..."
          size="xs"
        />
      </div>

      <p class="text-[10px] sm:text-xs text-muted shrink-0">
        {{ filteredBudgets.length }} of {{ budgets.length }} budgets
      </p>
    </div>

    <!-- Skeleton loading when loading -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4"
    >
      <UCard
        v-for="i in 3"
        :key="i"
        class="h-44 flex flex-col justify-between"
      >
        <div class="flex items-center justify-between">
          <USkeleton class="h-5 w-28" />
          <USkeleton class="size-6 rounded-md" />
        </div>
        <div class="space-y-2 my-4">
          <USkeleton class="h-4 w-full" />
          <USkeleton class="h-2 w-full rounded-full" />
        </div>
        <div class="flex justify-between">
          <USkeleton class="h-4 w-16" />
          <USkeleton class="h-4 w-20" />
        </div>
      </UCard>
    </div>

    <!-- Empty State: Zero Budgets -->
    <div
      v-else-if="budgets.length === 0"
      class="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-12 text-center"
    >
      <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
        <UIcon
          name="i-lucide-piggy-bank"
          class="size-8"
        />
      </div>
      <h3 class="text-xl font-bold text-highlighted">
        No budgets created yet
      </h3>
      <p class="mx-auto mt-2 max-w-md text-sm text-muted">
        Create your first budget to set monthly spending limits for categories like Food & Dining, Rent, or Shopping.
        Once created, you can log transactions against them and see how much you have left.
      </p>
      <div class="mt-6">
        <UButton
          size="lg"
          color="primary"
          icon="i-lucide-plus"
          @click="openNewBudgetModal"
        >
          Create Your First Budget
        </UButton>
      </div>
    </div>

    <!-- Empty State: Filter yielded no results -->
    <div
      v-else-if="filteredBudgets.length === 0"
      class="rounded-xl border border-default p-8 text-center"
    >
      <UIcon
        name="i-lucide-search-x"
        class="mx-auto size-8 text-muted mb-2"
      />
      <p class="text-sm font-medium text-highlighted">
        No budgets matching "{{ searchQuery }}"
      </p>
      <p class="text-xs text-muted mt-1">
        Try adjusting your search query to find your budget.
      </p>
      <UButton
        size="xs"
        variant="ghost"
        color="neutral"
        class="mt-3"
        @click="searchQuery = ''"
      >
        Clear filter
      </UButton>
    </div>

    <!-- Budgets Grid -->
    <div
      v-else
      class="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4"
    >
      <BudgetCard
        v-for="b in filteredBudgets"
        :key="b.id"
        :budget="b"
        @edit="handleEditBudget"
        @delete="handleDeleteBudget"
      />
    </div>

    <!-- Modal -->
    <BudgetModal
      v-model="isBudgetModalOpen"
      :budget-to-edit="budgetToEdit"
      @saved="fetchBudgets"
    />
  </div>
</template>
