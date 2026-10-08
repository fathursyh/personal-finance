<script setup lang="ts">
defineProps<{
  disabled?: boolean
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <div class="fixed bottom-5 end-5 z-40 sm:hidden">
    <UButton
      icon="i-lucide-plus"
      color="primary"
      size="xl"
      aria-label="Add Transaction"
      class="rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all size-12 justify-center"
      :disabled="disabled"
      @click="emit('click', $event)"
    />
  </div>
</template>

