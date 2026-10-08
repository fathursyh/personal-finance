export type HighlightType = 'feature' | 'improvement' | 'fix'

export interface ReleaseHighlight {
  type: HighlightType
  title: string
  description?: string
  badgeLabel?: string
  badgeColor?: 'primary' | 'success' | 'warning' | 'info' | 'error' | 'neutral'
  items: string[]
}

export interface ReleaseAuthor {
  name: string
  username: string
  avatar: {
    src: string
    alt?: string
  }
}

export interface ReleaseBadge {
  label: string
  color?: 'primary' | 'success' | 'warning' | 'info' | 'error' | 'neutral'
  variant?: 'solid' | 'outline' | 'subtle' | 'soft'
}

export interface ChangelogItem {
  tag: string
  title: string
  date: string
  badge?: string | ReleaseBadge
  isLatest?: boolean
  description: string
  highlights: ReleaseHighlight[]
  authors?: ReleaseAuthor[]
  commitSha?: string
}

export interface NormalizedRelease extends ChangelogItem {
  badge: ReleaseBadge
  authors: ReleaseAuthor[]
  isLatest: boolean
}
