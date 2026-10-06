<script setup lang="ts">
import { reactive, ref } from 'vue'
import z from 'zod'

definePageMeta({
  layout: 'public',
  middleware: [
    () => {
      const user = useSupabaseUser()
      if (user.value) {
        return navigateTo('/dashboard')
      }
    }
  ]
})

const supabase = useSupabaseClient()
const toast = useToast()

const LoginSchema = z.object({
  email: z.string().email('Invalid email address').nonempty('Email is required'),
  password: z.string().nonempty('Password is required')
})

const form = reactive<z.infer<typeof LoginSchema>>({
  email: '',
  password: ''
})

const showPassword = ref(false)
const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    })

    if (error) throw error

    toast.add({
      title: 'Login success!',
      description: 'Welcome back to your dashboard.',
      color: 'success'
    })

    await navigateTo('/dashboard')
  } catch (error) {
    const err = error as { message?: string }
    toast.add({
      title: 'Login failed!',
      description: err.message ?? 'Invalid email or password.',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-12">
    <UCard class="w-full max-w-md">
      <template #header>
        <div class="text-center">
          <UIcon
            name="i-lucide-lock"
            class="size-8 mx-auto mb-2 text-primary"
          />
          <h2 class="text-xl font-bold">
            Welcome Back
          </h2>
          <p class="text-sm text-muted mt-1">
            Enter your credentials to access your account
          </p>
        </div>
      </template>

      <UForm
        :state="form"
        class="space-y-4"
        :schema="LoginSchema"
        novalidate
        @submit="handleSubmit"
      >
        <UFormField
          label="Email"
          name="email"
        >
          <UInput
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
            icon="i-lucide-mail"
            autocomplete="email"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Password"
          name="password"
        >
          <UInput
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Enter your password"
            icon="i-lucide-lock"
            autocomplete="current-password"
            class="w-full"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="xs"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <UButton
          type="submit"
          block
          class="mt-2"
          :loading="loading"
        >
          Sign In
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-muted">
          Don't have an account?
          <NuxtLink
            to="/register"
            class="font-medium text-primary hover:underline"
          >
            Register
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>
