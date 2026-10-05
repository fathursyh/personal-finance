<script setup lang="ts">
import { reactive, ref } from 'vue'
import z from 'zod'

definePageMeta({
  layout: 'public',
  auth: { unauthenticatedOnly: true, navigateAuthenticatedTo: '/dashboard' }
})

const { signUp } = useAuth()
const toast = useToast()

const RegisterSchema = z.object({
  email: z.email().nonempty('Email is required'),
  name: z.string().nonempty('Name is required'),
  password: z.string().min(8, { error: 'Password must be at least 8 characters' }),
  confirmPassword: z.string().nonempty('Confirm password is required')
})
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password confirmation does not match',
    path: ['confirmPassword'],
  });

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const loading = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    // signUp creates the account, then logs in with the same credentials.
    await signUp(
      { name: form.name, email: form.email, password: form.password },
      { callbackUrl: '/dashboard', external: false }
    )
    toast.add({
      title: 'Account Created',
      description: 'Your new account has been successfully created'
    })
  } catch (error) {
    const err = error as { statusMessage?: string, data?: { statusMessage?: string } }
    toast.add({
      title: 'Registration failed',
      description: err.data?.statusMessage ?? err.statusMessage ?? 'Something went wrong',
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
          <UIcon name="i-lucide-user-plus" class="size-8 mx-auto mb-2 text-primary" />
          <h2 class="text-xl font-bold">
            Create an Account
          </h2>
          <p class="text-sm text-muted mt-1">
            Fill in the details below to create your account
          </p>
        </div>
      </template>

      <UForm :state="form" :schema="RegisterSchema" novalidate class="space-y-4" @submit="handleSubmit">
        <UFormField label="Name" name="name">
          <UInput v-model="form.name" type="text" placeholder="John Doe" icon="i-lucide-user" autocomplete="name"
            class="w-full" />
        </UFormField>

        <UFormField label="Email" name="email">
          <UInput v-model="form.email" type="email" placeholder="you@example.com" icon="i-lucide-mail"
            autocomplete="email" class="w-full" />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput v-model="form.password" :type="showPassword ? 'text' : 'password'" placeholder="Enter your password"
            icon="i-lucide-lock" autocomplete="new-password" class="w-full">
            <template #trailing>
              <UButton color="neutral" variant="link" size="xs"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Confirm Password" name="confirmPassword">
          <UInput v-model="form.confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Confirm your password" icon="i-lucide-lock" autocomplete="new-password" class="w-full">
            <template #trailing>
              <UButton color="neutral" variant="link" size="xs"
                :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                @click="showConfirmPassword = !showConfirmPassword" />
            </template>
          </UInput>
        </UFormField>

        <UButton type="submit" block class="mt-2" :loading="loading">
          Create Account
        </UButton>
      </UForm>

      <template #footer>
        <p class="text-center text-sm text-muted">
          Already have an account?
          <NuxtLink to="/login" class="font-medium text-primary hover:underline">
            Sign in
          </NuxtLink>
        </p>
      </template>
    </UCard>
  </div>
</template>