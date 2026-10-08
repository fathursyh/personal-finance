<script setup lang="ts">
interface Star {
  x: number
  y: number
  size: number
  twinkleDelay: number
  id: string
}

const props = withDefaults(defineProps<{
  starCount?: number
  color?: string
  size?: { min: number, max: number }
  speed?: 'slow' | 'normal' | 'fast'
}>(), {
  starCount: 45,
  color: 'var(--ui-primary)',
  size: () => ({
    min: 1,
    max: 2.5
  }),
  speed: 'normal'
})

const route = useRoute()

const generateStars = (count: number): Star[] => {
  return Array.from({ length: count }, () => {
    const x = Math.floor(Math.random() * 100)
    const y = Math.floor(Math.random() * 100)
    const size = Math.random() * (props.size.max - props.size.min) + props.size.min
    const twinkleDelay = Math.random() * 4

    return { x, y, size, twinkleDelay, id: Math.random().toString(36).substring(2, 9) }
  })
}

const starsKey = computed(() => `${route.path.replace(/[^a-zA-Z0-9]/g, '-')}-sky`)
const stars = useState<Star[]>(starsKey.value, () => generateStars(props.starCount))

const twinkleDuration = computed(() => {
  const speedMap: Record<string, string> = {
    slow: '4s',
    normal: '2.5s',
    fast: '1.2s'
  }
  return speedMap[props.speed] || '2.5s'
})
</script>

<template>
  <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
    <div
      v-for="star in stars"
      :key="star.id"
      class="absolute rounded-full"
      :style="{
        left: `${star.x}%`,
        top: `${star.y}%`,
        transform: 'translate(-50%, -50%)',
        width: `${star.size}px`,
        height: `${star.size}px`,
        backgroundColor: color,
        animation: `twinkle ${twinkleDuration} ease-in-out infinite`,
        animationDelay: `${star.twinkleDelay}s`,
        willChange: 'opacity'
      }"
    />
  </div>
</template>

<style scoped>
@keyframes twinkle {
  0%, 100% {
    opacity: 0.15;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.15);
  }
}
</style>
