<script setup lang="ts">
import type { RoutePathSchema } from '@typed-router/__paths'

definePageMeta({
  layout: 'public'
})

const config = useRuntimeConfig()
const APP_VERSION = config.public.appVersion || '1.00'
</script>

<template>
  <div>
    <UPageHero
      :headline="`Ver. ${APP_VERSION}`"
      title="Financial clarity without the spreadsheet headache"
      description="Stop spending hours auditing bank statements at the end of every month. Track expenses instantly, monitor cash flow, and know exactly where your money goes in seconds."
      :links="[{
        label: 'Start tracking free',
        to: '/register' satisfies RoutePathSchema,
        trailingIcon: 'i-lucide-arrow-right',
        size: 'xl'
      }, {
        label: 'View live demo',
        to: '/dashboard' satisfies RoutePathSchema,
        icon: 'i-lucide-layout-dashboard',
        size: 'xl',
        color: 'neutral',
        variant: 'subtle'
      }]"
    />

    <UPageSection
      id="features"
      title="Take full control of your daily cash flow"
      description="Designed for people who want complete visibility into their finances without tedious manual accounting."
      :features="[{
        icon: 'i-lucide-receipt',
        title: '3-Second Expense Logging',
        description: 'Record daily purchases on the fly with smart auto-categorization. No complicated forms or receipt backlogs at month-end.'
      }, {
        icon: 'i-lucide-chart-pie',
        title: 'Visual Spending Insights',
        description: 'See breakdown charts by category, merchant, or timeframe at a glance. Spot lifestyle inflation and unnecessary leaks instantly.'
      }, {
        icon: 'i-lucide-calendar-clock',
        title: 'Subscription & Bill Tracker',
        description: 'Never miss a due date or pay for a forgotten service again. Track recurring charges and forecast upcoming monthly commitments.'
      }, {
        icon: 'i-lucide-file-spreadsheet',
        title: 'One-Click Month-End Audits',
        description: 'Generate polished monthly performance summaries automatically. Export tax-ready reports to CSV or PDF in a single tap.'
      }, {
        icon: 'i-lucide-piggy-bank',
        title: 'Targeted Savings Goals',
        description: 'Create envelopes for emergency funds, vacations, or debt payoffs. Track realistic target dates with automated progress meters.'
      }, {
        icon: 'i-lucide-shield-check',
        title: 'Private & Secure by Default',
        description: 'Your financial habits stay strictly yours. Enjoy client-side encryption, no aggressive ad tracking, and complete data export portability.'
      }]"
    />

    <UPageSection>
      <UPageCTA
        title="Ready to end month-end financial stress?"
        description="Join users who spend less than 2 minutes a week keeping their personal finances in check."
        variant="subtle"
        :links="[{
          label: 'Create your free account',
          to: '/register' satisfies RoutePathSchema,
          trailingIcon: 'i-lucide-arrow-right',
          color: 'primary'
        }, {
          label: 'Explore dashboard',
          to: '/dashboard' satisfies RoutePathSchema,
          icon: 'i-lucide-arrow-up-right',
          color: 'neutral',
          variant: 'outline'
        }]"
      />
    </UPageSection>
  </div>
</template>
