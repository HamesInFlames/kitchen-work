import type { ScaledGroup, ScaledIngredient } from '../lib/recipeMath'
import { formatGrams, formatPercent } from '../lib/format'
import { KIND_STYLE, WetDryBadge } from './WetDryBadge'
import { BowlIcon } from './icons'

interface Props {
  group: ScaledGroup
  /** The active scale factor — display hints like "3 large eggs" only make sense at 1×. */
  factor: number
  showPercent?: boolean
}

/** Read-only, scaled view of one ingredient group (wet/dry colour-coded card). */
export function IngredientGroupCard({ group, factor, showPercent = true }: Props) {
  const s = KIND_STYLE[group.kind]
  return (
    <section className={`rounded-2xl border ${s.border} ${s.cardBg} p-4`}>
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <WetDryBadge kind={group.kind} />
        <h3 className="font-recipe text-xl leading-tight text-ink">{group.title}</h3>
      </header>

      {group.combine && (
        <p
          className={`mb-3 inline-flex items-center gap-1.5 rounded-lg border ${s.border} bg-black/15 px-2.5 py-1 text-sm font-medium ${s.text}`}
        >
          <BowlIcon size={15} />
          {group.combine}
        </p>
      )}

      <ul className="divide-y divide-line/50">
        {group.ingredients.map((ing) => (
          <IngredientRow key={ing.id} ing={ing} factor={factor} showPercent={showPercent} />
        ))}
      </ul>
    </section>
  )
}

function IngredientRow({
  ing,
  factor,
  showPercent,
}: {
  ing: ScaledIngredient
  factor: number
  showPercent: boolean
}) {
  const hasWeight = (ing.grams || 0) > 0
  const amount = hasWeight ? formatGrams(ing.scaledGrams) : ing.display || '—'
  // A free-text count ("3 large") is only meaningful at the base scale.
  const hint = hasWeight && ing.display && factor === 1 ? ing.display : ing.note

  return (
    <li className="flex items-baseline justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <span className="text-ink">{ing.name || '—'}</span>
        {hint && <span className="mt-0.5 block text-sm text-ink-faint">{hint}</span>}
      </div>
      <div className="shrink-0 text-right">
        <span className="font-semibold tabular-nums text-ink">{amount}</span>
        {showPercent && hasWeight && ing.percent !== null && (
          <span className="ml-2 text-sm tabular-nums text-ink-faint">
            {formatPercent(ing.percent)}
          </span>
        )}
      </div>
    </li>
  )
}
