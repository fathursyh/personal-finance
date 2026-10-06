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
  </div>
</template>
