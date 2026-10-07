<script setup lang="ts">
import { reactive, watch } from 'vue'
import z from 'zod'
import type { PaymentMethod, TransactionType, TransactionWithBudget } from '~/types/database.types'

const props = defineProps<{
  modelValue: boolean
  transactionToEdit?: TransactionWithBudget | null
  defaultBudgetId?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'saved': []
  'openCreateBudget': []
}>()

const { budgets } = useBudgets()
const { createTransaction, updateTransaction, loading } = useTransactions()
const { formatCurrency } = useFinancialSummary()

const paymentMethods: { label: string, value: PaymentMethod }[] = [
  { label: 'Cash', value: 'Cash' },
  { label: 'Debit Card', value: 'Debit Card' },
  { label: 'Credit Card', value: 'Credit Card' },
  { label: 'Bank Transfer', value: 'Bank Transfer' },
  { label: 'E-Wallet', value: 'E-Wallet' },
  { label: 'QRIS', value: 'QRIS' }
]

const today = new Date().toISOString().slice(0, 10)

const TransactionSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  payment_method: z.string().min(1, 'Payment method is required'),
  budget_id: z.string().nullable().optional()
})

const form = reactive({
  description: '',
  amount: 0,
  date: today,
  payment_method: 'Debit Card' as PaymentMethod,
  budget_id: null as string | null,
  type: 'expense' as TransactionType
})

const budgetOptions = computed(() => {
  return [
    {
      label: form.type === 'expense' ? 'No Specific Budget' : 'No Budget (General Income)',
      value: null
    },
    ...budgets.value.map(b => ({
      label: `${b.name} (${formatCurrency(Number(b.amount))})`,
      value: b.id
    }))
  ]
})

watch(() => props.transactionToEdit, (tx) => {
  if (tx) {
    form.description = tx.description
    form.amount = Number(tx.amount) || 0
    form.date = tx.date
    form.payment_method = tx.payment_method
    form.budget_id = tx.budget_id
    form.type = tx.type
  } else {
    form.description = ''
    form.amount = 0
    form.date = today
    form.payment_method = 'Debit Card'
    form.budget_id = props.defaultBudgetId || (budgets.value[0]?.id ?? null)
    form.type = 'expense'
  }
}, { immediate: true })

watch(() => props.defaultBudgetId, (val) => {
  if (val && !props.transactionToEdit) {
    form.budget_id = val
  }
})

async function handleSubmit() {
  try {
    if (props.transactionToEdit) {
      await updateTransaction(props.transactionToEdit.id, {
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
        payment_method: form.payment_method,
        budget_id: form.budget_id,
        type: form.type
      })
    } else {
      await createTransaction({
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
        payment_method: form.payment_method,
        budget_id: form.budget_id,
        type: form.type
      })
    }

    emit('saved')
    emit('update:modelValue', false)
  } catch {
    // Toast handled in composable
  }
}
</script>

<template>
  <UModal
    :open="modelValue"
    :title="transactionToEdit ? 'Edit Transaction' : 'Record Transaction'"
    :description="transactionToEdit ? 'Update details of this transaction' : 'Log your expense or income with payment method and linked budget'"
    @update:open="(val: boolean) => emit('update:modelValue', val)"
  >
    <template #body>
      <UForm
        :state="form"
        :schema="TransactionSchema"
        class="space-y-4"
        novalidate
        @submit="handleSubmit"
      >
        <div class="flex items-center gap-2">
          <UButton
            :variant="form.type === 'expense' ? 'solid' : 'ghost'"
            :color="form.type === 'expense' ? 'primary' : 'neutral'"
            size="sm"
            label="Expense"
            class="flex-1 justify-center"
            @click="form.type = 'expense'"
          />
          <UButton
            :variant="form.type === 'income' ? 'solid' : 'ghost'"
            :color="form.type === 'income' ? 'success' : 'neutral'"
            size="sm"
            label="Income"
            class="flex-1 justify-center"
            @click="form.type = 'income'"
          />
        </div>

        <UFormField
          label="Description"
          name="description"
          required
        >
          <UInput
            v-model="form.description"
            placeholder="e.g. Weekly Grocery Run, Metro Card"
            icon="i-lucide-pencil"
            class="w-full"
            autofocus
          />
        </UFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField
            label="Amount (Rp)"
            name="amount"
            required
          >
            <CurrencyInput
              v-model="form.amount"
              placeholder="50.000"
              icon="i-lucide-banknote"
            />
          </UFormField>

          <UFormField
            label="Date"
            name="date"
            required
          >
            <UInput
              v-model="form.date"
              type="date"
              icon="i-lucide-calendar"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Budget Selector -->
        <UFormField
          :label="form.type === 'expense' ? 'Budget Category' : 'Allocate to Budget (Optional)'"
          name="budget_id"
          :help="form.type === 'expense'
            ? 'Assign this expense to deduct from your monthly budget limit.'
            : 'Select a budget to credit this income to (increases remaining balance, e.g. refund, cashback, top-up).'"
        >
          <div class="space-y-2">
            <USelect
              v-model="form.budget_id"
              :items="budgetOptions"
              class="w-full"
              placeholder="Select a budget"
            />
            <div
              v-if="budgets.length === 0"
              class="flex items-center justify-between rounded-lg border border-dashed border-primary/30 bg-primary/5 p-2 text-xs"
            >
              <span class="text-muted">You haven't set up any budgets yet.</span>
              <UButton
                size="xs"
                variant="link"
                color="primary"
                label="+ Create a Budget"
                @click="emit('openCreateBudget')"
              />
            </div>
          </div>
        </UFormField>

        <!-- Payment Method -->
        <UFormField
          label="Payment Method"
          name="payment_method"
          required
        >
          <USelect
            v-model="form.payment_method"
            :items="paymentMethods"
            class="w-full"
            placeholder="Select payment method"
          />
        </UFormField>

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
            :label="transactionToEdit ? 'Save Changes' : 'Record Transaction'"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
