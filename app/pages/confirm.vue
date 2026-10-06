<script setup lang="ts">
definePageMeta({
  layout: 'public'
})

const user = useSupabaseUser()

watch(user, () => {
  if (user.value) {
    return navigateTo('/dashboard')
  }
}, { immediate: true })

onMounted(() => {
  setTimeout(() => {
    if (!user.value) {
      navigateTo('/login')
    }
  }, 4000)
})
</script>

<template>
  <div class="flex min-h-[calc(100vh-14rem)] items-center justify-center p-4">
    <div class="text-center">
      <UIcon
        name="i-lucide-loader-circle"
        class="size-8 mx-auto mb-2 text-primary animate-spin"
      />
      <h2 class="text-lg font-semibold text-highlighted">
        Confirming authentication...
      </h2>
      <p class="text-sm text-muted mt-1">
        Please wait while we log you in.
      </p>
    </div>
  </div>
</template>
