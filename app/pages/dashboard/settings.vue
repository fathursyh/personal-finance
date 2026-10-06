<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'Settings'
})

useHead({
  title: 'Settings - Financial Tracker'
})

const user = useSupabaseUser()
const toast = useToast()

const userName = computed(() => {
  return (user.value?.user_metadata?.name as string | undefined) || user.value?.email?.split('@')[0] || 'User'
})

const userEmail = computed(() => {
  return user.value?.email || ''
})

const sendingTestEmail = ref(false)

async function handleSendTestEmail() {
  sendingTestEmail.value = true
  try {
    const res = await $fetch<{ success: boolean, message: string }>('/api/email/monthly-summary', {
      method: 'POST'
    })

    if (res.success) {
      toast.add({
        title: 'Email Sent!',
        description: res.message,
        color: 'success'
      })
    } else {
      toast.add({
        title: 'Notice',
        description: res.message,
        color: 'warning'
      })
    }
  } catch (err: unknown) {
    const error = err as { data?: { statusMessage?: string }, message?: string }
    toast.add({
      title: 'Failed to send email',
      description: error.data?.statusMessage || error.message || 'An error occurred while dispatching the email.',
      color: 'error'
    })
  } finally {
    sendingTestEmail.value = false
  }
}

function handleOpenPreview() {
  window.open('/api/email/preview-monthly-summary', '_blank')
}
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-highlighted">
        Settings & Preferences
      </h2>
      <p class="text-sm text-muted">
        Manage your profile, email notifications, and automated monthly summaries.
      </p>
    </div>

    <!-- Account Profile Card -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-user"
            class="size-5 text-primary"
          />
          <h3 class="font-semibold text-highlighted">
            Account Profile
          </h3>
        </div>
      </template>

      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <div class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xl">
            {{ userName.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h4 class="font-bold text-highlighted text-base">
              {{ userName }}
            </h4>
            <p class="text-sm text-muted">
              {{ userEmail }}
            </p>
            <span class="inline-flex items-center gap-1 mt-1 text-xs text-muted">
              <span class="size-1.5 rounded-full bg-emerald-500" />
              Authenticated via Supabase
            </span>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Monthly Email Summary Feature Card -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-mail"
              class="size-5 text-primary"
            />
            <h3 class="font-semibold text-highlighted">
              End-of-Month Summary Email
            </h3>
          </div>
          <UBadge
            color="success"
            variant="subtle"
            size="sm"
          >
            Active Feature
          </UBadge>
        </div>
      </template>

      <div class="space-y-5">
        <div>
          <p class="text-sm text-highlighted font-medium">
            Automated Monthly Financial Digest
          </p>
          <p class="mt-1 text-xs text-muted leading-relaxed">
            On the last day of each month, the app compiles your spending, compares your expenses against allocated budget limits, and emails you a beautiful visual summary of what you spent and what you have left.
          </p>
        </div>

        <div class="rounded-xl border border-default bg-elevated/40 p-4 space-y-3">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span class="text-muted font-medium">Target Recipient</span>
            <span class="font-semibold text-highlighted">{{ userEmail }}</span>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span class="text-muted font-medium">Scheduled Delivery</span>
            <span class="font-semibold text-highlighted">Last day of every month</span>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span class="text-muted font-medium">Email Provider</span>
            <span class="inline-flex items-center gap-1 font-semibold text-highlighted">
              <UIcon
                name="i-lucide-zap"
                class="size-3.5 text-amber-500"
              />
              Resend API (or Simulated in Dev)
            </span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-wrap items-center gap-3 pt-2">
          <UButton
            color="primary"
            icon="i-lucide-send"
            :loading="sendingTestEmail"
            @click="handleSendTestEmail"
          >
            Send Test Email to My Inbox
          </UButton>

          <UButton
            variant="outline"
            color="neutral"
            icon="i-lucide-external-link"
            @click="handleOpenPreview"
          >
            Preview Email HTML
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Setup Guide for Resend & Cron Automation -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-settings-2"
            class="size-5 text-muted"
          />
          <h3 class="font-semibold text-highlighted">
            Email Delivery & Cron Automation Setup
          </h3>
        </div>
      </template>

      <div class="space-y-4 text-xs text-muted leading-relaxed">
        <div>
          <h4 class="font-semibold text-highlighted text-sm mb-1">
            1. Configure Resend API Key
          </h4>
          <p>
            Get a free API key at <a
              href="https://resend.com"
              target="_blank"
              class="text-primary font-medium hover:underline"
            >resend.com</a> (includes 3,000 free emails/month). Add it to your project's <code class="rounded bg-elevated px-1 py-0.5 text-highlighted">.env</code> file:
          </p>
          <pre class="mt-2 overflow-x-auto rounded-lg bg-elevated p-3 font-mono text-xs text-highlighted">RESEND_API_KEY=re_123456789...
RESEND_FROM_EMAIL=Financial Tracker &lt;onboarding@resend.dev&gt;</pre>
        </div>

        <div class="pt-2 border-t border-default">
          <h4 class="font-semibold text-highlighted text-sm mb-1">
            2. End-of-Month Automated Trigger (Cron Job)
          </h4>
          <p>
            To trigger automated emails on the last day of each month for all active users, call the API endpoint:
          </p>
          <pre class="mt-2 overflow-x-auto rounded-lg bg-elevated p-3 font-mono text-xs text-highlighted">POST /api/email/monthly-summary
Header: x-cron-secret: finance-cron-secret-key</pre>
          <p class="mt-2">
            You can schedule this via Supabase <code class="rounded bg-elevated px-1 py-0.5 text-highlighted">pg_cron</code>, cron-job.org, or GitHub Actions to run on the last day of every month at 23:00.
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
