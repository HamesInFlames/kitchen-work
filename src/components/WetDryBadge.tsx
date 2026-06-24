import type { ComponentType } from 'react'
import type { IngredientKind } from '../types/recipe'
import { DropletIcon, WheatIcon, BowlIcon } from './icons'

// Wet/dry colour-coding that never relies on colour alone (WCAG 1.4.1):
// every group carries a WARM tint (wet) or COOL tint (dry) PLUS an icon PLUS a
// text label. The "two-bowl method" made visual.

interface KindStyle {
  label: string
  Icon: ComponentType<{ size?: number }>
  /** Accent text colour. */
  text: string
  /** Tinted card background. */
  cardBg: string
  /** Card border. */
  border: string
  /** Pill (badge) classes. */
  chip: string
}

export const KIND_STYLE: Record<IngredientKind, KindStyle> = {
  wet: {
    label: 'Wet',
    Icon: DropletIcon,
    text: 'text-wet',
    cardBg: 'bg-wet-bg',
    border: 'border-wet-line',
    chip: 'bg-wet/15 text-wet',
  },
  dry: {
    label: 'Dry',
    Icon: WheatIcon,
    text: 'text-dry',
    cardBg: 'bg-dry-bg',
    border: 'border-dry-line',
    chip: 'bg-dry/15 text-dry',
  },
  other: {
    label: 'Mix',
    Icon: BowlIcon,
    text: 'text-gold',
    cardBg: 'bg-surface-2',
    border: 'border-line',
    chip: 'bg-gold/15 text-gold',
  },
}

export function WetDryBadge({ kind }: { kind: IngredientKind }) {
  const s = KIND_STYLE[kind]
  const Icon = s.Icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${s.chip}`}
    >
      <Icon size={14} />
      {s.label}
    </span>
  )
}
