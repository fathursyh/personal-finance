import type { ChangelogItem, NormalizedRelease, ReleaseAuthor, ReleaseBadge } from '~/types/release.types'

export * from '~/types/release.types'

/**
 * ==============================================================================
 * DEFAULT AUTHOR
 * Used automatically for any release that does not specify custom `authors`.
 * ==============================================================================
 */
export const defaultAuthor: ReleaseAuthor = {
  name: 'Fathur',
  username: 'fathursyh',
  avatar: {
    src: 'https://avatars.githubusercontent.com/u/120416923?v=4',
    alt: 'Fathur'
  }
}

/**
 * ==============================================================================
 * HOW TO ADD A NEW UPDATE:
 * 1. Copy the TEMPLATE below.
 * 2. Paste it at the TOP of the `rawReleases` array (index 0 is the latest release).
 * 3. Fill in `tag` (e.g. 'v1.09'), `title`, `date` (YYYY-MM-DD), and `description`.
 * 4. Add items under `highlights` with types: 'feature' | 'improvement' | 'fix'.
 *
 * The system automatically:
 * - Assigns the 'Latest' badge and green highlight to the top release
 * - Sets the default author (Fathur) if `authors` is omitted
 * - Formats dates, generates commit links, and powers the search/filter controls
 * ==============================================================================
 *
 * TEMPLATE:
 * {
 *   tag: 'v1.09',
 *   title: 'Short headline describing this update',
 *   date: '2026-10-15',
 *   description: 'A summary paragraph explaining what was shipped in this release.',
 *   commitSha: 'abcdef1', // Optional: GitHub commit SHA
 *   highlights: [
 *     {
 *       type: 'feature', // 'feature' | 'improvement' | 'fix'
 *       title: 'Feature Title',
 *       badgeLabel: 'New Feature',
 *       items: [
 *         'First bullet point detail',
 *         'Second bullet point detail'
 *       ]
 *     },
 *     {
 *       type: 'improvement',
 *       title: 'Performance or UX Polish',
 *       badgeLabel: 'Polish',
 *       items: [
 *         'Description of what was improved'
 *       ]
 *     },
 *     {
 *       type: 'fix',
 *       title: 'Bug Fixes',
 *       badgeLabel: 'Bug Fix',
 *       items: [
 *         'Description of what was resolved'
 *       ]
 *     }
 *   ]
 * },
 */

const rawReleases: ChangelogItem[] = [
  {
    tag: 'v1.08',
    title: 'Category-Grouped Daily Timeline, Mobile Compact View & Performance Caching',
    date: '2026-10-08',
    commitSha: '712d761',
    description: 'A major visual and architectural upgrade: introduced a daily financial ledger with sticky date headers, optimized mobile readability with dense compact modes, and eliminated redundant Supabase network requests using native global state caching.',
    highlights: [
      {
        type: 'feature',
        title: 'Daily Financial Timeline Ledger',
        badgeLabel: 'New Feature',
        badgeColor: 'primary',
        items: [
          'Grouped chronological timeline by date with sticky day headers and weekday badges',
          'Real-time daily aggregations for total Income, Expenses, and Net Balance per day',
          'Category-budget tags aligned with transaction notes and payment methods',
          'Direct tap-to-edit transaction modal support with 3-dot action menus'
        ]
      },
      {
        type: 'improvement',
        title: 'Mobile Density & Readability Overhaul',
        badgeLabel: 'UX Polish',
        badgeColor: 'success',
        items: [
          'Compacted overview metrics into 2-column mobile cards, halving vertical scroll height',
          'Side-by-side 3-stat budget bar (Allocated, Spent, Remaining) on mobile devices',
          'Responsive Donut and Bar charts with clean text wrapping and compact legends',
          'Multi-line support (line-clamp-2) for long transaction descriptions so notes never truncate'
        ]
      },
      {
        type: 'improvement',
        title: 'Zero-Fetch Navigation & Client-Only Dashboard',
        badgeLabel: 'Architecture',
        badgeColor: 'info',
        items: [
          'Centralized data initialization in the dashboard layout with native Nuxt useState memoization',
          'Zero redundant Supabase network queries when switching between Overview, Transactions, Budgets, and Analytics',
          'Automatic cache invalidation on mutations (create, edit, delete) keeping all views synced',
          'Configured client-only rendering (ssr: false) for /dashboard/** to speed up route transitions'
        ]
      },
      {
        type: 'fix',
        title: 'Mobile Sticky Header & Subtitle Alignment',
        badgeLabel: 'Bug Fix',
        badgeColor: 'warning',
        items: [
          'Fixed sticky date header offset overlapping with transaction rows on mobile screens',
          'Removed duplicate Income labels in transaction sub-lines, letting prominent green currency values speak clearly'
        ]
      }
    ]
  },
  {
    tag: 'v1.07',
    title: 'Formatted Currency Input & Interactive Overview Ledger',
    date: '2026-10-07',
    commitSha: '1b941cb',
    description: 'Enhanced input UX with automatic Indonesian Rupiah formatting and integrated single-click budget filtering right on the main overview dashboard.',
    highlights: [
      {
        type: 'feature',
        title: 'CurrencyInput UX Component',
        badgeLabel: 'Component',
        badgeColor: 'primary',
        items: [
          'Instant automatic thousands separator formatting (e.g. 1000000 -> 1.000.000) preventing decimal mistakes',
          'Preserves user cursor position seamlessly during mid-string edits and backspaces',
          'Fully integrated into both Budget creation modal and Transaction logging modal'
        ]
      },
      {
        type: 'feature',
        title: 'Interactive Budget Selection in Overview',
        badgeLabel: 'Overview',
        badgeColor: 'primary',
        items: [
          'Click any budget card on the overview page to instantly inspect all transactions linked to that category',
          'Empty-state feedback with quick-action button to record the first transaction under selected budgets',
          'Direct navigation link to inspect the budget inside the full transactions ledger'
        ]
      }
    ]
  },
  {
    tag: 'v1.06',
    title: 'Financial Analytics, SVG Donut Charts & Payment Methods',
    date: '2026-10-06',
    commitSha: 'c3c047b',
    description: 'Introduced an in-depth financial analytics suite with interactive SVG charts, ranked spending tables, and payment method distribution.',
    highlights: [
      {
        type: 'feature',
        title: 'Interactive Spending Distribution Charts',
        badgeLabel: 'Analytics',
        badgeColor: 'primary',
        items: [
          'Interactive Donut Chart with hover inspection showing category spending percentages and amounts',
          'Custom SVG Bar Chart comparing budget allocations against actual spending',
          'Ranked spending leaderboard highlighting your top expense categories'
        ]
      },
      {
        type: 'feature',
        title: 'Payment Method Breakdown',
        badgeLabel: 'Insights',
        badgeColor: 'info',
        items: [
          'Track spending by payment channels: Cash, QRIS, Debit Card, Credit Card, Bank Transfer, and E-Wallets',
          'Transaction count and total share percentage per payment method'
        ]
      }
    ]
  },
  {
    tag: 'v1.05',
    title: 'Automated Monthly Financial Summaries & Email Scheduler',
    date: '2026-10-05',
    commitSha: 'e8792ee',
    description: 'Never lose track of your monthly performance. Added scheduled background jobs and automated email reports powered by Resend.',
    highlights: [
      {
        type: 'feature',
        title: 'Monthly Summary Email System',
        badgeLabel: 'Automation',
        badgeColor: 'primary',
        items: [
          'Automated monthly executive financial digest delivered straight to user email inbox',
          'Detailed breakdowns of total income, total spending, net savings, and budget health',
          'Configured secure serverless cron endpoint with secret bearer authorization'
        ]
      },
      {
        type: 'improvement',
        title: 'Transactional Email Templates',
        badgeLabel: 'Email',
        badgeColor: 'info',
        items: [
          'Responsive HTML email templates matching the application design language',
          'Integrated with Resend API for reliable, fast delivery'
        ]
      }
    ]
  },
  {
    tag: 'v1.04',
    title: 'Budget Envelopes, Visual Progress & Over-Budget Alerts',
    date: '2026-10-04',
    commitSha: '8195bc7',
    description: 'Empowered users to establish spending limits per category, track progress with dynamic meters, and receive warning cues before exceeding budgets.',
    highlights: [
      {
        type: 'feature',
        title: 'Envelope Budgeting System',
        badgeLabel: 'Budgets',
        badgeColor: 'primary',
        items: [
          'Create custom monthly budgets with name, spending limit, category icon, and theme colors',
          'Real-time remaining balance calculations against logged expenses',
          'Dynamic multi-state progress bars: safe (primary), warning (>80%), and over-budget (error rose)'
        ]
      },
      {
        type: 'improvement',
        title: 'Budget Management Dashboard',
        badgeLabel: 'Management',
        badgeColor: 'success',
        items: [
          'Dedicated Budgets dashboard page with search filters and quick edit/delete actions',
          'Total allocated capital vs total spent this month summary bar'
        ]
      }
    ]
  },
  {
    tag: 'v1.03',
    title: 'Supabase Authentication, Multi-Month Picker & RLS Security',
    date: '2026-10-03',
    commitSha: '977353b',
    description: 'Secured user finances with email authentication, Row Level Security, and added flexible month-to-month calendar navigation.',
    highlights: [
      {
        type: 'feature',
        title: 'User Authentication & Data Isolation',
        badgeLabel: 'Security',
        badgeColor: 'primary',
        items: [
          'Email signup, login, email verification, and session persistence via Supabase Auth',
          'Strict PostgreSQL Row Level Security (RLS) ensuring users only access their own financial records'
        ]
      },
      {
        type: 'feature',
        title: 'MonthPicker Calendar Filter',
        badgeLabel: 'Navigation',
        badgeColor: 'info',
        items: [
          'Global month-selector with previous/next quick arrows and current month indicator',
          'Synchronized across all dashboard pages for seamless historical auditing'
        ]
      }
    ]
  },
  {
    tag: 'v1.00',
    title: 'Initial Launch: Financial Tracker MVP',
    date: '2026-10-01',
    commitSha: 'e8309fb',
    description: 'The foundation of Financial Tracker: a modern personal finance application built with Nuxt 4, Nuxt UI, Tailwind CSS v4, and Supabase.',
    highlights: [
      {
        type: 'feature',
        title: 'Core App Infrastructure',
        badgeLabel: 'Core',
        badgeColor: 'primary',
        items: [
          'Public landing page with value proposition, feature showcase, and responsive header/footer',
          'Dashboard navigation shell with collapsible sidebar and dark/light color mode support',
          'Full TypeScript typing and strictly enforced ESLint standards'
        ]
      }
    ]
  }
]

/**
 * Normalized releases array with sensible defaults for badge, author, and isLatest status.
 */
export const releases: NormalizedRelease[] = rawReleases.map((release, index) => {
  const isLatest = release.isLatest ?? index === 0

  let badge: ReleaseBadge
  if (typeof release.badge === 'string') {
    badge = {
      label: release.badge,
      color: isLatest ? 'primary' : 'neutral',
      variant: 'subtle'
    }
  } else if (release.badge) {
    badge = release.badge
  } else {
    badge = {
      label: isLatest ? `${release.tag} • Latest` : release.tag,
      color: isLatest ? 'primary' : 'neutral',
      variant: 'subtle'
    }
  }

  return {
    ...release,
    isLatest,
    badge,
    authors: release.authors && release.authors.length > 0 ? release.authors : [defaultAuthor]
  }
})
