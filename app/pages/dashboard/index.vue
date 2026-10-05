<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Overview'
})

useHead({
  title: 'Overview'
})

const stats = [
  {
    title: 'Total Balance',
    value: '$12,450.80',
    change: '+14.2%',
    trend: 'up',
    icon: 'i-lucide-wallet'
  },
  {
    title: 'Monthly Income',
    value: '$5,200.00',
    change: '+8.1%',
    trend: 'up',
    icon: 'i-lucide-trending-up'
  },
  {
    title: 'Monthly Expenses',
    value: '$2,340.50',
    change: '-3.4%',
    trend: 'down',
    icon: 'i-lucide-trending-down'
  },
  {
    title: 'Savings Goal',
    value: '78%',
    change: '+$450 this month',
    trend: 'up',
    icon: 'i-lucide-piggy-bank'
  }
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-2xl font-bold tracking-tight text-highlighted">
          Financial Overview
        </h2>
        <p class="text-sm text-muted">
          Here is a summary of your personal finances and recent activity.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton icon="i-lucide-plus" color="primary">
          Add Transaction
        </UButton>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard v-for="stat in stats" :key="stat.title">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-muted">
            {{ stat.title }}
          </p>
          <UIcon :name="stat.icon" class="size-5 text-muted" />
        </div>

        <div class="mt-2 flex items-baseline justify-between">
          <p class="text-2xl font-semibold text-highlighted">
            {{ stat.value }}
          </p>
          <span class="text-xs font-medium" :class="stat.trend === 'up' ? 'text-primary' : 'text-rose-500'">
            {{ stat.change }}
          </span>
        </div>
      </UCard>
    </div>

    <!-- Recent Transactions Preview -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-highlighted">
            Recent Transactions
          </h3>
          <UButton variant="ghost" color="neutral" size="xs" trailing-icon="i-lucide-arrow-right">
            View all
          </UButton>
        </div>
      </template>

      <div class="divide-y divide-default">
        <div class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <div class="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UIcon name="i-lucide-briefcase" class="size-5" />
            </div>
            <div>
              <p class="text-sm font-medium text-highlighted">
                Monthly Salary
              </p>
              <p class="text-xs text-muted">
                Oct 01, 2026 • Direct Deposit
              </p>
            </div>
          </div>
          <span class="text-sm font-semibold text-primary">+$4,200.00</span>
        </div>

        <div class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <div class="flex size-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
              <UIcon name="i-lucide-shopping-cart" class="size-5" />
            </div>
            <div>
              <p class="text-sm font-medium text-highlighted">
                Grocery Market
              </p>
              <p class="text-xs text-muted">
                Oct 03, 2026 • Card
              </p>
            </div>
          </div>
          <span class="text-sm font-semibold text-highlighted">-$124.50</span>
        </div>

        <div class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <div class="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <UIcon name="i-lucide-coffee" class="size-5" />
            </div>
            <div>
              <p class="text-sm font-medium text-highlighted">
                Coffee & Bakery
              </p>
              <p class="text-xs text-muted">
                Oct 04, 2026 • Card
              </p>
            </div>
          </div>
          <span class="text-sm font-semibold text-highlighted">-$18.20</span>
        </div>
      </div>
    </UCard>
  </div>
</template>