<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { PaymentMethod, TransactionType } from '~/types/database.types'

export interface ParsedTransactionRow {
  id: string
  date: string
  description: string
  amount: number
  type: TransactionType
  payment_method: PaymentMethod
  budget_id: string | null
  is_potential_duplicate: boolean
  duplicate_reason?: string
  selected: boolean
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'imported': []
}>()

const { budgets } = useBudgets()
const { createBatchTransactions, loading: batchSaving } = useTransactions()
const { formatCurrency } = useFinancialSummary()
const toast = useToast()

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const isDragging = ref(false)
const isParsing = ref(false)
const parseError = ref<string | null>(null)
const parsedRows = ref<ParsedTransactionRow[]>([])

const paymentMethods: { label: string, value: PaymentMethod }[] = [
  { label: 'Bank Transfer', value: 'Bank Transfer' },
  { label: 'Debit Card', value: 'Debit Card' },
  { label: 'Credit Card', value: 'Credit Card' },
  { label: 'QRIS', value: 'QRIS' },
  { label: 'E-Wallet', value: 'E-Wallet' },
  { label: 'Cash', value: 'Cash' }
]

const budgetOptions = computed(() => {
  return [
    { label: 'Unbudgeted / General', value: null },
    ...budgets.value.map(b => ({
      label: b.name,
      value: b.id
    }))
  ]
})

const selectedRows = computed(() => parsedRows.value.filter(r => r.selected))
const isAllSelected = computed({
  get: () => parsedRows.value.length > 0 && parsedRows.value.every(r => r.selected),
  set: (val: boolean) => {
    parsedRows.value.forEach((r) => {
      r.selected = val
    })
  }
})

const totalSelectedIncome = computed(() => {
  return selectedRows.value
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0)
})

const totalSelectedExpense = computed(() => {
  return selectedRows.value
    .filter(r => r.type === 'expense')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0)
})

const duplicateCount = computed(() => {
  return parsedRows.value.filter(r => r.is_potential_duplicate).length
})

watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    resetState()
  }
})

function resetState() {
  selectedFile.value = null
  isDragging.value = false
  isParsing.value = false
  parseError.value = null
  parsedRows.value = []
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (file) validateAndSetFile(file)
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0]
    if (file) validateAndSetFile(file)
  }
}

function validateAndSetFile(file: File) {
  parseError.value = null
  const validExtensions = ['.pdf', '.csv', '.txt']
  const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!validExtensions.includes(fileExt)) {
    parseError.value = 'Please upload a PDF (.pdf) or CSV (.csv, .txt) bank statement file.'
    return
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    parseError.value = 'File size exceeds 10MB limit.'
    return
  }

  selectedFile.value = file
}

async function startParsing() {
  if (!selectedFile.value) return
  isParsing.value = true
  parseError.value = null

  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    const response = await $fetch<{
      success: boolean
      filename: string
      total_parsed: number
      items: ParsedTransactionRow[]
    }>('/api/statement/parse', {
      method: 'POST',
      body: formData
    })

    if (response.success && response.items) {
      if (response.items.length === 0) {
        parseError.value = 'No transactions found in this document. Please ensure it is a valid bank statement.'
      } else {
        parsedRows.value = response.items
      }
    } else {
      parseError.value = 'Could not parse transactions from this statement.'
    }
  } catch (err: unknown) {
    const error = err as { data?: { statusMessage?: string }, message?: string }
    parseError.value = error?.data?.statusMessage || error?.message || 'Failed to parse bank statement.'
  } finally {
    isParsing.value = false
  }
}

function removeRow(index: number) {
  parsedRows.value.splice(index, 1)
}

async function handleImport() {
  if (selectedRows.value.length === 0) {
    toast.add({
      title: 'No transactions selected',
      description: 'Please select at least one transaction to import.',
      color: 'warning'
    })
    return
  }

  const validUserBudgetIds = new Set(budgets.value.map(b => b.id))

  const payload = selectedRows.value.map(row => ({
    description: row.description.trim() || 'Bank Transaction',
    amount: Math.abs(Number(row.amount)) || 0,
    date: row.date,
    type: row.type,
    payment_method: row.payment_method,
    budget_id: (row.type === 'expense' && row.budget_id && validUserBudgetIds.has(row.budget_id))
      ? row.budget_id
      : null
  }))

  try {
    await createBatchTransactions(payload)
    emit('imported')
    emit('update:modelValue', false)
    resetState()
  } catch {
    // Error notification handled in useTransactions
  }
}
</script>

<template>
  <UModal
    :open="modelValue"
    title="Import Bank Statement"
    description="Upload a bank statement (PDF, CSV) to extract and categorize transactions automatically using AI."
    :ui="{ content: 'sm:max-w-4xl' }"
    @update:open="(val: boolean) => emit('update:modelValue', val)"
  >
    <template #body>
      <!-- STATE 1: File Upload / Dropzone -->
      <div
        v-if="parsedRows.length === 0"
        class="space-y-4"
      >
        <div
          class="relative border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer"
          :class="isDragging ? 'border-primary bg-primary/10' : 'border-default hover:border-primary/50 hover:bg-elevated/40'"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="fileInputRef?.click()"
        >
          <input
            ref="fileInputRef"
            type="file"
            accept=".pdf,.csv,.txt"
            class="hidden"
            @change="handleFileSelect"
          >

          <div class="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <UIcon
              :name="isParsing ? 'i-lucide-loader-2' : (selectedFile ? 'i-lucide-file-check' : 'i-lucide-file-up')"
              class="size-7"
              :class="{ 'animate-spin': isParsing }"
            />
          </div>

          <div v-if="selectedFile">
            <p class="font-semibold text-highlighted text-base">
              {{ selectedFile.name }}
            </p>
            <p class="text-xs text-muted mt-1">
              {{ (selectedFile.size / 1024).toFixed(1) }} KB • Click or drop another file to replace
            </p>
          </div>

          <div v-else>
            <p class="font-semibold text-highlighted text-sm sm:text-base">
              Click to browse or drop your bank statement here
            </p>
            <p class="text-xs text-muted mt-1.5">
              Supports PDF e-statements (BCA, Mandiri, BRI, BNI, Jenius, Jago) and CSV / TXT exports (Max 10MB)
            </p>
          </div>
        </div>

        <!-- Parse Error Banner -->
        <UAlert
          v-if="parseError"
          color="error"
          variant="subtle"
          icon="i-lucide-alert-circle"
          :title="parseError"
        />

        <!-- Action Buttons -->
        <div class="flex items-center justify-between pt-2">
          <p class="text-xs text-muted flex items-center gap-1.5">
            <UIcon
              name="i-lucide-shield-check"
              class="size-4 text-emerald-500"
            />
            Parsed securely with Google Gemini AI. Your document is processed in-memory and not stored.
          </p>

          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="emit('update:modelValue', false)"
            >
              Cancel
            </UButton>

            <UButton
              color="primary"
              :disabled="!selectedFile || isParsing"
              :loading="isParsing"
              @click="startParsing"
            >
              {{ isParsing ? 'Analyzing Statement...' : 'Extract Transactions' }}
            </UButton>
          </div>
        </div>
      </div>

      <!-- STATE 2: Review & Confirmation Table -->
      <div
        v-else
        class="space-y-4"
      >
        <!-- Top Status Banner -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-elevated/80 border border-default p-3 rounded-xl">
          <div class="flex items-center gap-3">
            <UBadge
              color="primary"
              variant="subtle"
              size="md"
              class="font-mono font-bold"
            >
              {{ parsedRows.length }} Found
            </UBadge>
            <p class="text-xs sm:text-sm text-muted">
              Review and customize extracted transactions before importing.
            </p>
          </div>

          <div
            v-if="duplicateCount > 0"
            class="flex items-center gap-2 text-xs text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20"
          >
            <UIcon
              name="i-lucide-alert-triangle"
              class="size-4 shrink-0"
            />
            <span><strong>{{ duplicateCount }}</strong> potential duplicates automatically unchecked</span>
          </div>
        </div>

        <!-- Editable Review Table -->
        <div class="overflow-x-auto max-h-[50vh] rounded-xl border border-default">
          <table class="w-full text-left text-xs border-collapse">
            <thead class="bg-elevated/90 sticky top-0 z-10 border-b border-default text-muted font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th class="p-2.5 text-center w-10">
                  <input
                    v-model="isAllSelected"
                    type="checkbox"
                    class="rounded border-default text-primary size-4 cursor-pointer"
                    title="Select all / Deselect all"
                  >
                </th>
                <th class="p-2.5 w-28">
                  Date
                </th>
                <th class="p-2.5 min-w-44">
                  Description
                </th>
                <th class="p-2.5 w-24">
                  Type
                </th>
                <th class="p-2.5 w-36">
                  Category
                </th>
                <th class="p-2.5 w-32">
                  Payment
                </th>
                <th class="p-2.5 text-right w-32">
                  Amount
                </th>
                <th class="p-2.5 text-center w-10" />
              </tr>
            </thead>
            <tbody class="divide-y divide-default bg-elevated/20">
              <tr
                v-for="(row, idx) in parsedRows"
                :key="row.id"
                class="transition-colors hover:bg-elevated/40"
                :class="{
                  'bg-amber-500/5': row.is_potential_duplicate && !row.selected,
                  'opacity-60': !row.selected
                }"
              >
                <!-- Checkbox -->
                <td class="p-2.5 text-center">
                  <input
                    v-model="row.selected"
                    type="checkbox"
                    class="rounded border-default text-primary size-4 cursor-pointer"
                  >
                </td>

                <!-- Date -->
                <td class="p-2.5">
                  <UInput
                    v-model="row.date"
                    type="date"
                    size="xs"
                    class="w-full"
                  />
                </td>

                <!-- Description -->
                <td class="p-2.5">
                  <div class="space-y-1">
                    <UInput
                      v-model="row.description"
                      size="xs"
                      class="w-full"
                    />
                    <p
                      v-if="row.is_potential_duplicate"
                      class="text-[10px] text-amber-500 flex items-center gap-1"
                      :title="row.duplicate_reason"
                    >
                      <UIcon
                        name="i-lucide-info"
                        class="size-3"
                      />
                      <span>{{ row.duplicate_reason || 'Likely duplicate' }}</span>
                    </p>
                  </div>
                </td>

                <!-- Type -->
                <td class="p-2.5">
                  <USelect
                    v-model="row.type"
                    :items="[
                      { label: 'Expense', value: 'expense' },
                      { label: 'Income', value: 'income' }
                    ]"
                    size="xs"
                    class="w-full"
                  />
                </td>

                <!-- Category / Budget -->
                <td class="p-2.5">
                  <USelect
                    v-if="row.type === 'expense'"
                    v-model="row.budget_id"
                    :items="budgetOptions"
                    size="xs"
                    class="w-full"
                  />
                  <span
                    v-else
                    class="text-muted text-[11px] italic"
                  >
                    Income (None)
                  </span>
                </td>

                <!-- Payment Method -->
                <td class="p-2.5">
                  <USelect
                    v-model="row.payment_method"
                    :items="paymentMethods"
                    size="xs"
                    class="w-full"
                  />
                </td>

                <!-- Amount -->
                <td class="p-2.5 text-right font-mono font-bold">
                  <span :class="row.type === 'income' ? 'text-emerald-500' : 'text-rose-500'">
                    {{ row.type === 'income' ? '+' : '-' }}{{ formatCurrency(row.amount) }}
                  </span>
                </td>

                <!-- Remove Row Button -->
                <td class="p-2.5 text-center">
                  <UButton
                    icon="i-lucide-trash-2"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="size-6 p-0 text-muted hover:text-rose-500"
                    title="Remove item"
                    aria-label="Remove item"
                    @click="removeRow(idx)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary & Batch Import Toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <!-- Selection Totals -->
          <div class="flex items-center gap-4 text-xs sm:text-sm">
            <span class="text-muted">
              Selected: <strong class="text-highlighted">{{ selectedRows.length }}</strong> of {{ parsedRows.length }}
            </span>
            <span
              v-if="totalSelectedExpense > 0"
              class="font-mono text-rose-500 font-semibold"
            >
              Exp: -{{ formatCurrency(totalSelectedExpense) }}
            </span>
            <span
              v-if="totalSelectedIncome > 0"
              class="font-mono text-emerald-500 font-semibold"
            >
              Inc: +{{ formatCurrency(totalSelectedIncome) }}
            </span>
          </div>

          <!-- Bottom Actions -->
          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-arrow-left"
              :disabled="batchSaving"
              @click="resetState"
            >
              Re-upload File
            </UButton>

            <UButton
              color="primary"
              size="sm"
              :loading="batchSaving"
              :disabled="selectedRows.length === 0"
              icon="i-lucide-check-circle-2"
              @click="handleImport"
            >
              Confirm & Import ({{ selectedRows.length }})
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
