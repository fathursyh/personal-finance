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
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-highlighted">
          Budget Management
        </h2>
        <p class="text-sm text-muted">
          Set monthly spending limits, monitor remaining funds, and track when limits were last updated.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <MonthPicker />

        <UButton
          icon="i-lucide-plus"
          color="primary"
          @click="openNewBudgetModal"
        >
          New Budget
        </UButton>
      </div>
    </div>

    <!-- Quick Stats -->
    <div
      v-if="budgets.length > 0"
      class="grid grid-cols-1 gap-4 sm:grid-cols-3"
    >
      <UCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Allocated
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
            Spent This Month
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
          {{ totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0 }}% of total budget used
        </p>
      </UCard>

      <UCard>
        <div class="flex items-center justify-between">
          <p class="text-xs font-semibold uppercase tracking-wider text-muted">
            Total Remaining
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
          {{ totalRemaining < 0 ? 'Over allocated budget' : 'Safe to spend' }}
        </p>
      </UCard>
    </div>

    <!-- Search / Filter Bar (if multiple budgets) -->
    <div
      v-if="budgets.length > 2"
      class="flex items-center justify-between gap-4"
    >
      <div class="w-full max-w-xs">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          placeholder="Filter budgets..."
          size="sm"
        />
      </div>

      <p class="text-xs text-muted">
        Showing {{ filteredBudgets.length }} of {{ budgets.length }} budgets
      </p>
    </div>

    <!-- Skeleton loading when loading -->
    <div
      v-if="isLoading"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
      class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
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
