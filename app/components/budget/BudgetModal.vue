<script setup lang="ts">
import { reactive, watch } from 'vue'
import z from 'zod'
import type { Budget } from '~/types/database.types'

const props = defineProps<{
  modelValue: boolean
  budgetToEdit?: Budget | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
}>()

const { createBudget, updateBudget, loading } = useBudgets()

const availableIcons = [
  { label: 'Wallet', value: 'i-lucide-wallet' },
  { label: 'Groceries', value: 'i-lucide-shopping-cart' },
  { label: 'Food & Dining', value: 'i-lucide-utensils' },
  { label: 'Coffee & Drinks', value: 'i-lucide-coffee' },
  { label: 'Housing & Rent', value: 'i-lucide-home' },
  { label: 'Transport', value: 'i-lucide-car' },
  { label: 'Entertainment', value: 'i-lucide-clapperboard' },
  { label: 'Health & Care', value: 'i-lucide-heart-pulse' },
  { label: 'Travel', value: 'i-lucide-plane' },
  { label: 'Bills & Utilities', value: 'i-lucide-receipt' },
  { label: 'Savings', value: 'i-lucide-piggy-bank' }
]

const availableColors = [
  { label: 'Green', value: 'emerald' },
  { label: 'Blue', value: 'primary' },
  { label: 'Amber', value: 'amber' },
  { label: 'Rose', value: 'rose' },
  { label: 'Violet', value: 'violet' },
  { label: 'Cyan', value: 'cyan' }
]

const BudgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  amount: z.number().positive('Budget amount must be greater than 0')
})

const form = reactive({
  name: '',
  amount: 0,
  icon: 'i-lucide-wallet',
  color: 'primary'
})

function resetForm() {
  if (props.budgetToEdit) {
    form.name = props.budgetToEdit.name
    form.amount = Number(props.budgetToEdit.amount) || 0
    form.icon = props.budgetToEdit.icon || 'i-lucide-wallet'
    form.color = props.budgetToEdit.color || 'primary'
  } else {
    form.name = ''
    form.amount = 0
    form.icon = 'i-lucide-wallet'
    form.color = 'primary'
  }
}

watch(() => props.budgetToEdit, () => {
  resetForm()
}, { immediate: true })

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

async function handleSubmit() {
  try {
    if (props.budgetToEdit) {
      await updateBudget(props.budgetToEdit.id, {
        name: form.name,
        amount: Number(form.amount),
        icon: form.icon,
        color: form.color
      })
    } else {
      await createBudget({
        name: form.name,
        amount: Number(form.amount),
        icon: form.icon,
        color: form.color
      })
    }

    emit('saved')
    emit('update:modelValue', false)
    resetForm()
  } catch {
    // Toast already handled inside useBudgets
  }
}
</script>

<template>
  <UModal
    :open="modelValue"
    :title="budgetToEdit ? 'Edit Budget' : 'Create New Budget'"
    :description="budgetToEdit ? 'Update your budget limits and appearance' : 'Set a spending limit for a specific category this month'"
    @update:open="(val: boolean) => emit('update:modelValue', val)"
  >
    <template #body>
      <UForm
        :state="form"
        :schema="BudgetSchema"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField
          label="Budget Name"
          name="name"
          required
        >
          <UInput
            v-model="form.name"
            placeholder="e.g. Groceries, Entertainment, Dining"
            icon="i-lucide-tag"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField
          label="Monthly Budget Amount (Rp)"
          name="amount"
          required
        >
          <CurrencyInput
            v-model="form.amount"
            placeholder="1.000.000"
            icon="i-lucide-banknote"
          />
        </UFormField>

        <div class="space-y-1">
          <label class="text-sm font-medium text-highlighted">Category Icon</label>
          <div class="flex flex-wrap gap-2 pt-1">
            <button
              v-for="item in availableIcons"
              :key="item.value"
              type="button"
              class="flex size-9 items-center justify-center rounded-lg border transition-colors"
              :class="form.icon === item.value ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/25' : 'border-default text-muted hover:bg-elevated'"
              :title="item.label"
              @click="form.icon = item.value"
            >
              <UIcon
                :name="item.value"
                class="size-5"
              />
            </button>
          </div>
        </div>

        <div class="space-y-1">
          <label class="text-sm font-medium text-highlighted">Badge Color</label>
          <div class="flex flex-wrap gap-2 pt-1">
            <button
              v-for="c in availableColors"
              :key="c.value"
              type="button"
              class="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
              :class="form.color === c.value ? 'border-primary bg-primary/15 text-highlighted ring-2 ring-primary/25' : 'border-default text-muted hover:bg-elevated'"
              @click="form.color = c.value"
            >
              <span
                class="size-2.5 rounded-full"
                :class="{
                  'bg-emerald-500': c.value === 'emerald',
                  'bg-blue-500': c.value === 'primary',
                  'bg-amber-500': c.value === 'amber',
                  'bg-rose-500': c.value === 'rose',
                  'bg-violet-500': c.value === 'violet',
                  'bg-cyan-500': c.value === 'cyan'
                }"
              />
              {{ c.label }}
            </button>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-4">
          <UButton
            color="neutral"
            variant="ghost"
            label="Cancel"
            @click="emit('update:modelValue', false)"
          />
          <UButton
            type="submit"
            color="primary"
            :loading="loading"
            :label="budgetToEdit ? 'Save Changes' : 'Create Budget'"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
