<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import type { RoutePathSchema } from '@typed-router/__paths';

const navItems: Omit<NavigationMenuItem[], 'to'> & {to?: RoutePathSchema}[] = [
  {
    label: 'Home',
    to: '/',
    icon: 'i-lucide-home'
  },
  {
    label: 'Blogs',
    to: '/dashboard',
    icon: 'i-lucide-rss'
  },
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: 'i-lucide-layout-dashboard'
  }
]
</script>

<template>
  <div class="flex flex-col min-h-screen">
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="focus-visible:outline-3 outline-primary/25 rounded-md p-1 -ms-1 flex items-center gap-2"
        >
          <AppLogo class="w-auto h-6 shrink-0" />
        </NuxtLink>
      </template>

      <UNavigationMenu :items="navItems" />

      <template #right>
        <UColorModeButton />

        <UButton
          to="/login"
          variant="ghost"
          color="neutral"
          size="sm"
        >
          Sign In
        </UButton>

        <UButton
          to="/register"
          color="primary"
          size="sm"
        >
          Get Started
        </UButton>

        <UButton
          to="https://github.com/fathursyh"
          target="_blank"
          icon="i-lucide-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>

      <template #body>
        <div class="flex flex-col gap-4 p-4">
          <UNavigationMenu
            :items="navItems"
            orientation="vertical"
          />

          <USeparator />

          <div class="flex flex-col gap-2">
            <UButton
              to="/login"
              variant="outline"
              color="neutral"
              block
            >
              Sign In
            </UButton>
            <UButton
              to="/register"
              color="primary"
              block
            >
              Get Started
            </UButton>
          </div>
        </div>
      </template>
    </UHeader>

    <UMain class="flex-1">
      <slot />
    </UMain>

    <USeparator icon="i-lucide-wallet" />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted">
          Built with Nuxt • © {{ new Date().getFullYear() }}
        </p>
      </template>

      <template #right>
        <UButton
          to="https://github.com/fathursyh"
          target="_blank"
          icon="i-lucide-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </div>
</template>
