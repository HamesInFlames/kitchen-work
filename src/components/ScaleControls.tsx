import { useEffect, useState } from 'react'
import type { ScaleMode } from '../types/recipe'
import { SCALE_PRESETS, roundGrams } from '../lib/recipeMath'
import { formatGrams, formatPercent } from '../lib/format'

interface Props {
  baseFlourGrams: number
  mode: ScaleMode
  factor: number
  targetFlourGrams?: number
  hydration: number | null
  onSetFactor: (factor: number) => void
  onSetFlour: (grams: number) => void
}

/**
 * Scale a recipe two ways bakers actually think: by a multiplier, or by typing
 * the total flour weight you want (baker's-percentage scaling). Baker % and
 * hydration are invariant, so they're shown once here.
 */
export function ScaleControls({
  baseFlourGrams,
  mode,
  factor,
  targetFlourGrams,
  hydration,
  onSetFactor,
  onSetFlour,
}: Props) {
  const effectiveFlour =
    mode === 'flour' && targetFlourGrams ? targetFlourGrams : roundGrams(baseFlourGrams * factor)

  // Local text state so the field can be edited freely without fighting re-renders.
  const [flourText, setFlourText] = useState(String(Math.round(effectiveFlour)))
  useEffect(() => {
    setFlourText(String(Math.round(effectiveFlour)))
  }, [effectiveFlour])

  const hasFlour = baseFlourGrams > 0

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold uppercase tracking-wider text-ink-soft">Scale</span>
        {hasFlour && (
          <span className="text-sm text-ink-faint">
            Hydration <span className="tabular-nums text-dry">{formatPercent(hydration)}</span>
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SCALE_PRESETS.map((p) => {
          const active = mode === 'factor' && Math.abs(factor - p.factor) < 1e-6
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onSetFactor(p.factor)}
              aria-pressed={active}
              className={`min-h-11 flex-1 rounded-xl border px-3 text-base font-semibold tabular-nums transition-colors ${
                active
                  ? 'border-gold bg-gold text-black'
                  : 'border-line bg-surface-2 text-ink hover:border-gold/50'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {hasFlour && (
        <label className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2">
          <span className="text-sm text-ink-soft">Total flour</span>
          <span className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={flourText}
              onChange={(e) => setFlourText(e.target.value)}
              onBlur={() => {
                const grams = Number(flourText)
                if (grams > 0) onSetFlour(grams)
                else setFlourText(String(Math.round(effectiveFlour)))
              }}
              className="w-24 rounded-lg border border-line bg-bg px-2 py-1.5 text-right text-lg font-semibold tabular-nums text-ink focus:border-gold focus:outline-none"
              aria-label="Target total flour weight in grams"
            />
            <span className="text-ink-soft">g</span>
          </span>
        </label>
      )}

      <p className="mt-2 text-center text-sm text-ink-faint">
        {hasFlour ? (
          <>
            Flour <span className="tabular-nums text-ink-soft">{formatGrams(effectiveFlour)}</span>{' '}
            · {mode === 'flour' ? 'baker’s-percentage scaling' : `${factor}× batch`}
          </>
        ) : (
          <>Scaling at {factor}× (no flour to anchor baker’s %)</>
        )}
      </p>
    </div>
  )
}
