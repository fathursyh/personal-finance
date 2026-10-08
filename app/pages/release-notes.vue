<script setup lang="ts">
import { releases } from '~/data/releases'

definePageMeta({
  layout: 'public'
})

const config = useRuntimeConfig()
const toast = useToast()

useSeoMeta({
  title: 'Release Notes & Changelog - Financial Tracker',
  description: 'Explore the latest updates, features, improvements, and bug fixes in Financial Tracker.',
  ogTitle: 'Release Notes & Changelog - Financial Tracker',
  ogDescription: 'Explore the latest updates, features, improvements, and bug fixes in Financial Tracker.',
  twitterCard: 'summary_large_image'
})

const searchQuery = ref('')
const selectedType = ref<'all' | 'feature' | 'improvement' | 'fix'>('all')

const filteredReleases = computed(() => {
  return releases.filter((release) => {
    // Type filter
    if (selectedType.value !== 'all') {
      const hasMatchingHighlight = release.highlights.some(h => h.type === selectedType.value)
      if (!hasMatchingHighlight) return false
    }

    // Search query filter
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const inTitle = release.title.toLowerCase().includes(q)
      const inTag = release.tag.toLowerCase().includes(q)
      const inDescription = release.description.toLowerCase().includes(q)
      const inHighlights = release.highlights.some(h =>
        h.title.toLowerCase().includes(q)
        || h.items.some(item => item.toLowerCase().includes(q))
      )
      return inTitle || inTag || inDescription || inHighlights
    }

    return true
  })
})

function copyReleaseLink(tag: string) {
  const url = `${window.location.origin}/release-notes#${tag}`
  navigator.clipboard.writeText(url)
  toast.add({
    title: 'Link copied!',
    description: `Direct link to ${tag} copied to clipboard.`,
    color: 'success',
    icon: 'i-lucide-check'
  })
}

function getHighlightBadgeColor(type: 'feature' | 'improvement' | 'fix') {
  switch (type) {
    case 'feature':
      return 'primary'
    case 'improvement':
      return 'success'
    case 'fix':
      return 'warning'
  }
}

function getHighlightIcon(type: 'feature' | 'improvement' | 'fix') {
  switch (type) {
    case 'feature':
      return 'i-lucide-sparkles'
    case 'improvement':
      return 'i-lucide-zap'
    case 'fix':
      return 'i-lucide-wrench'
  }
}
</script>

<template>
  <div class="relative overflow-hidden">
    <!-- Starry Backdrop effect -->
    <SkyBg
      :star-count="50"
      speed="normal"
    />

    <!-- Ambient glowing radial gradient -->
    <div
      class="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 size-96 sm:size-137.5 rounded-full bg-primary/10 blur-[140px] pointer-events-none"
    />

    <UContainer class="py-10 sm:py-16 lg:py-20">
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-10 xl:gap-14 items-start">
        <!-- Sticky Sidebar Hero Column (Desktop) -->
        <aside class="xl:col-span-5 xl:sticky xl:top-24 space-y-6">
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <UBadge
                color="primary"
                variant="subtle"
                size="sm"
                class="font-mono font-semibold"
              >
                v{{ config.public.appVersion || '1.08' }}
              </UBadge>
              <UBadge
                color="neutral"
                variant="outline"
                size="sm"
              >
                Changelog
              </UBadge>
            </div>

            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-highlighted">
              Release Notes
            </h1>

            <p class="text-base sm:text-lg text-muted max-w-lg leading-relaxed">
              Stay up to date with new features, visual polish, architectural improvements, and bug fixes shipped to Financial Tracker.
            </p>
          </div>

          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap items-center gap-2.5 pt-1">
            <UButton
              to="/dashboard"
              color="primary"
              size="sm"
              icon="i-lucide-layout-dashboard"
            >
              Open Dashboard
            </UButton>

            <UButton
              to="https://github.com/fathursyh/personal-finance"
              target="_blank"
              color="neutral"
              variant="outline"
              size="sm"
              icon="i-lucide-github"
            >
              GitHub Repository
            </UButton>
          </div>

          <!-- Search & Filter Controls -->
          <UCard
            class="p-3.5 space-y-3 bg-elevated/70 backdrop-blur-md border-default shadow-xs"
          >
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                Filter by Type
              </p>
              <div class="grid grid-cols-4 gap-1.5">
                <UButton
                  size="xs"
                  :variant="selectedType === 'all' ? 'solid' : 'ghost'"
                  :color="selectedType === 'all' ? 'primary' : 'neutral'"
                  class="justify-center"
                  @click="selectedType = 'all'"
                >
                  All
                </UButton>
                <UButton
                  size="xs"
                  :variant="selectedType === 'feature' ? 'solid' : 'ghost'"
                  :color="selectedType === 'feature' ? 'primary' : 'neutral'"
                  class="justify-center"
                  @click="selectedType = 'feature'"
                >
                  Features
                </UButton>
                <UButton
                  size="xs"
                  :variant="selectedType === 'improvement' ? 'solid' : 'ghost'"
                  :color="selectedType === 'improvement' ? 'success' : 'neutral'"
                  class="justify-center"
                  @click="selectedType = 'improvement'"
                >
                  Polish
                </UButton>
                <UButton
                  size="xs"
                  :variant="selectedType === 'fix' ? 'solid' : 'ghost'"
                  :color="selectedType === 'fix' ? 'warning' : 'neutral'"
                  class="justify-center"
                  @click="selectedType = 'fix'"
                >
                  Fixes
                </UButton>
              </div>
            </div>

            <div class="pt-1">
              <UInput
                v-model="searchQuery"
                icon="i-lucide-search"
                placeholder="Search release notes..."
                size="sm"
                class="w-full"
              >
                <template
                  v-if="searchQuery"
                  #trailing
                >
                  <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    @click="searchQuery = ''"
                  />
                </template>
              </UInput>
            </div>
          </UCard>

          <!-- Release Summary Stats -->
          <div class="grid grid-cols-3 gap-2.5 pt-1">
            <div class="p-3 rounded-lg border border-default bg-elevated/50 text-center">
              <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted">
                Releases
              </p>
              <p class="text-lg font-bold text-highlighted mt-0.5">
                {{ releases.length }}
              </p>
            </div>

            <div class="p-3 rounded-lg border border-default bg-elevated/50 text-center">
              <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted">
                Latest
              </p>
              <p class="text-lg font-bold text-primary mt-0.5 font-mono">
                {{ releases[0]?.tag }}
              </p>
            </div>

            <div class="p-3 rounded-lg border border-default bg-elevated/50 text-center">
              <p class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted">
                Cadence
              </p>
              <p class="text-sm sm:text-base font-bold text-emerald-500 mt-1">
                Active
              </p>
            </div>
          </div>
        </aside>

        <!-- Right Timeline Column -->
        <main class="xl:col-span-7 space-y-6">
          <!-- Empty Search State -->
          <div
            v-if="filteredReleases.length === 0"
            class="rounded-2xl border-2 border-dashed border-default p-12 text-center bg-elevated/30"
          >
            <UIcon
              name="i-lucide-search-x"
              class="mx-auto size-10 text-muted mb-3"
            />
            <h3 class="text-lg font-semibold text-highlighted">
              No releases match your query
            </h3>
            <p class="text-sm text-muted mt-1 max-w-sm mx-auto">
              Try adjusting your search keywords or resetting the release type filter.
            </p>
            <UButton
              color="neutral"
              variant="subtle"
              size="sm"
              class="mt-4"
              @click="searchQuery = ''; selectedType = 'all'"
            >
              Reset Filters
            </UButton>
          </div>

          <!-- Changelog Versions Timeline List -->
          <UChangelogVersions
            v-else
            :indicator-motion="false"
            :ui="{
              root: 'relative',
              container: 'space-y-12 sm:space-y-16',
              indicator: 'absolute hidden lg:block overflow-hidden inset-y-3 start-32 h-full w-px bg-default/80 -ms-[8.5px]'
            }"
          >
            <UChangelogVersion
              v-for="release in filteredReleases"
              :id="release.tag"
              :key="release.tag"
              :title="release.title"
              :date="release.date"
              :badge="release.badge"
              :authors="release.authors"
              :ui="{
                root: 'relative group/version scroll-mt-28',
                container: 'flex flex-col mx-0 max-w-none lg:ps-36',
                title: 'text-xl sm:text-2xl font-bold tracking-tight text-highlighted group-hover/version:text-primary transition-colors',
                description: 'text-sm sm:text-base text-muted mt-2 leading-relaxed',
                indicator: 'absolute start-0 top-0 w-32 hidden lg:flex items-center justify-end gap-3 min-w-0',
                dot: 'size-4 rounded-full bg-default ring-4 ring-default flex items-center justify-center my-1 border border-primary/40',
                dotInner: 'size-2 rounded-full bg-primary'
              }"
            >
              <!-- Custom Header Actions (Anchor & Copy Link) -->
              <template #actions>
                <div class="flex items-center gap-2">
                  <UButton
                    icon="i-lucide-link"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    title="Copy direct link"
                    aria-label="Copy direct link"
                    @click="copyReleaseLink(release.tag)"
                  />

                  <UButton
                    v-if="release.commitSha"
                    :to="`https://github.com/fathursyh/personal-finance/commit/${release.commitSha}`"
                    target="_blank"
                    icon="i-lucide-git-commit"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    class="font-mono text-[11px]"
                    title="View commit on GitHub"
                  >
                    {{ release.commitSha?.slice(0, 7) }}
                  </UButton>
                </div>
              </template>

              <!-- Body with structured release highlights -->
              <template #body>
                <div class="mt-5 space-y-4">
                  <p class="text-sm sm:text-base text-muted leading-relaxed">
                    {{ release.description }}
                  </p>

                  <!-- Highlight categories -->
                  <div class="space-y-3 pt-1">
                    <div
                      v-for="(highlight, hIndex) in release.highlights"
                      :key="hIndex"
                      class="rounded-xl border border-default bg-elevated/40 p-3.5 sm:p-4 space-y-2 transition-colors hover:bg-elevated/70"
                    >
                      <div class="flex items-center gap-2">
                        <UIcon
                          :name="getHighlightIcon(highlight.type)"
                          class="size-4 shrink-0"
                          :class="{
                            'text-primary': highlight.type === 'feature',
                            'text-emerald-500': highlight.type === 'improvement',
                            'text-amber-500': highlight.type === 'fix'
                          }"
                        />
                        <h4 class="text-sm font-semibold text-highlighted">
                          {{ highlight.title }}
                        </h4>
                        <UBadge
                          v-if="highlight.badgeLabel"
                          :color="getHighlightBadgeColor(highlight.type)"
                          variant="subtle"
                          size="xs"
                          class="text-[10px] py-0 px-1.5 ml-auto"
                        >
                          {{ highlight.badgeLabel }}
                        </UBadge>
                      </div>

                      <ul class="space-y-1.5 text-xs sm:text-sm text-muted pl-6 list-disc marker:text-muted/60">
                        <li
                          v-for="(item, iIndex) in highlight.items"
                          :key="iIndex"
                          class="leading-relaxed"
                        >
                          {{ item }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </template>
            </UChangelogVersion>
          </UChangelogVersions>
        </main>
      </div>
    </UContainer>
  </div>
</template>
