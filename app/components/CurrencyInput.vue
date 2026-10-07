<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: number | string
  placeholder?: string
  icon?: string
  disabled?: boolean
}>(), {
  modelValue: 0,
  placeholder: '0',
  icon: 'i-lucide-banknote',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

function formatNumber(num: number): string {
  if (!num || isNaN(num)) return ''
  return new Intl.NumberFormat('id-ID').format(num)
}

const displayValue = computed(() => {
  const num = typeof props.modelValue === 'string' ? Number(props.modelValue) : props.modelValue
  return num && !isNaN(num) ? formatNumber(num) : ''
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const rawValue = target.value

  // Keep only numeric digits
  const cleanDigits = rawValue.replace(/\D/g, '')
  const numericValue = cleanDigits ? parseInt(cleanDigits, 10) : 0

  emit('update:modelValue', numericValue)

  // Re-format the display value directly on the input element
  target.value = numericValue ? formatNumber(numericValue) : ''
}
</script>

<template>
  <UInput
    :model-value="displayValue"
    type="text"
    inputmode="numeric"
    :placeholder="placeholder"
    :icon="icon"
    :disabled="disabled"
    class="w-full"
    @input="handleInput"
  />
</template>
