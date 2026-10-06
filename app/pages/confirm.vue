<script setup lang="ts">
definePageMeta({
  layout: 'public'
})

const supabase = useSupabaseClient()
const route = useRoute()
const user = useSupabaseUser()
const toast = useToast()

const errorMsg = ref<string | null>(null)
const isProcessing = ref(true)

watch(user, () => {
  if (user.value) {
    navigateTo('/dashboard')
  }
}, { immediate: true })

onMounted(async () => {
  try {
    // 1. Check for errors in URL fragment (#error_description=...)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const errorDescription = hashParams.get('error_description')
      if (errorDescription) {
        errorMsg.value = decodeURIComponent(errorDescription.replace(/\+/g, ' '))
        toast.add({
          title: 'Konfirmasi Gagal',
          description: errorMsg.value,
          color: 'error'
        })
        isProcessing.value = false
        setTimeout(() => navigateTo('/login'), 3500)
        return
      }
    }

    // 2. Handle PKCE authorization code exchange (?code=...)
    const code = route.query.code as string | undefined
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        errorMsg.value = error.message
        toast.add({
          title: 'Gagal Memverifikasi',
          description: error.message,
          color: 'error'
        })
        isProcessing.value = false
        setTimeout(() => navigateTo('/login'), 3500)
        return
      }
      navigateTo('/dashboard')
      return
    }

    // 3. Handle OTP / Token Hash (?token_hash=... or ?token=...)
    const tokenHash = (route.query.token_hash || route.query.token) as string | undefined
    const type = (route.query.type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email') || 'signup'
    if (tokenHash) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type
      })
      if (error) {
        errorMsg.value = error.message
        toast.add({
          title: 'Gagal Memverifikasi',
          description: error.message,
          color: 'error'
        })
        isProcessing.value = false
        setTimeout(() => navigateTo('/login'), 3500)
        return
      }
      navigateTo('/dashboard')
      return
    }

    // 4. Check if session already exists
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session) {
      navigateTo('/dashboard')
      return
    }

    // 5. Fallback timer if waiting for onAuthStateChange to resolve session
    setTimeout(() => {
      if (!user.value) {
        isProcessing.value = false
        navigateTo('/login')
      }
    }, 3000)
  } catch (err: unknown) {
    const e = err as Error
    errorMsg.value = e.message || 'Terjadi kesalahan saat memverifikasi autentikasi.'
    isProcessing.value = false
    setTimeout(() => navigateTo('/login'), 3500)
  }
})
</script>

<template>
  <div class="flex min-h-[calc(100vh-14rem)] items-center justify-center p-4">
    <div class="text-center max-w-sm">
      <template v-if="errorMsg">
        <UIcon
          name="i-lucide-circle-alert"
          class="size-10 mx-auto mb-2 text-red-500"
        />
        <h2 class="text-lg font-semibold text-highlighted">
          Konfirmasi Gagal
        </h2>
        <p class="text-sm text-muted mt-1">
          {{ errorMsg }}
        </p>
        <p class="text-xs text-muted mt-2">
          Mengalihkan ke halaman login...
        </p>
      </template>

      <template v-else>
        <UIcon
          name="i-lucide-loader-circle"
          class="size-8 mx-auto mb-2 text-primary animate-spin"
        />
        <h2 class="text-lg font-semibold text-highlighted">
          Memverifikasi Akun...
        </h2>
        <p class="text-sm text-muted mt-1">
          Mohon tunggu sebentar, kami sedang menyiapkan sesi Anda.
        </p>
      </template>
    </div>
  </div>
</template>
