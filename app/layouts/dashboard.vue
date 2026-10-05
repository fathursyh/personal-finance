<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { RoutePathSchema } from '@typed-router/__paths'


const route = useRoute()
const toast = useToast()
const { data: user, signOut } = useAuth()
const collapsed = ref(false)

const pageTitle = computed(() => {
  if (typeof route.meta.title === 'string') {
    return route.meta.title
  }
  return 'Dashboard'
})

const sidebarItems: Array<Omit<NavigationMenuItem[], 'to'> & { to?: RoutePathSchema }[]> = [
  [
    {
      label: 'Overview',
      icon: 'i-lucide-layout-dashboard',
      to: '/dashboard',
    },
    {
      label: 'Transactions',
      icon: 'i-lucide-arrow-left-right',
      to: '/dashboard/transactions'
    },
    {
      label: 'Budgets',
      icon: 'i-lucide-wallet',
      to: '/dashboard/budgets'
    },
    {
      label: 'Analytics',
      icon: 'i-lucide-chart-pie',
      to: '/dashboard/analytics'
    }
  ],
  [
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      to: '/dashboard/settings'
    },
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      onSelect: () => signOut({ callbackUrl: '/login' }).then(() => toast.add({
        color: 'info',
        title: 'Logged out!',
        description: 'See you later.',
      })),
      ui: {
        link: 'dark:text-red-400 text-red-600',
        linkLeadingIcon: 'dark:text-red-400 text-red-600'
      }
    }
  ]
]
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar v-model:collapsed="collapsed" collapsible resizable>
      <template #header>
        <NuxtLink to="/dashboard"
          class="flex items-center gap-2 overflow-hidden px-1 py-1 focus-visible:outline-3 outline-primary/25 rounded-md">
          <div class="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UIcon name="i-lucide-wallet" class="size-4" />
          </div>
          <span v-if="!collapsed" class="text-sm font-semibold truncate text-highlighted">
            Financial Tracker
          </span>
        </NuxtLink>
      </template>

      <template #default>
        <UNavigationMenu :items="sidebarItems" orientation="vertical" :collapsed="collapsed" />
      </template>

      <template #footer>
        <div class="flex w-full items-center justify-between gap-2">
          <NuxtLink to="/dashboard" class="flex items-center gap-2 truncate min-w-0">
            <UAvatar src="https://avatars.githubusercontent.com/u/739984?v=4" alt="User" size="sm" />
            <div v-if="!collapsed" class="flex flex-col text-left text-xs truncate">
              <span class="font-medium text-highlighted truncate">{{ user?.name }}</span>
              <span class="text-muted truncate">{{ user?.email }}</span>
            </div>
          </NuxtLink>

          <UColorModeButton v-if="!collapsed" />
        </div>
      </template>
    </UDashboardSidebar>

    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar :title="pageTitle">
          <template #right>
            <UColorModeButton />
            <UButton to="/" icon="i-lucide-home" color="neutral" variant="ghost" aria-label="Back to home" />
          </template>
        </UDashboardNavbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>