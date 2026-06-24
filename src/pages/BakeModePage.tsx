import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useRecipes } from '../context/RecipesContext'
import { useBakeProgress } from '../hooks/useBakeProgress'
import { useWakeLock } from '../hooks/useWakeLock'
import { useSwipe } from '../hooks/useSwipe'
import { resolveScaleFactor, scaleRecipe, type ScaledIngredient } from '../lib/recipeMath'
import { formatGrams, formatDuration } from '../lib/format'
import { parseTimers, actionLabel } from '../lib/parseTimers'
import type { IngredientKind } from '../types/recipe'
import { KIND_STYLE } from '../components/WetDryBadge'
import { TimerChip } from '../components/TimerChip'
import { PhotoThumb } from '../components/PhotoThumb'
import {
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  FlameIcon,
  PhoneIcon,
} from '../components/icons'

interface StepIngredient {
  ing: ScaledIngredient
  kind: IngredientKind
}

export function BakeModePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { recipes } = useRecipes()
  const recipe = recipes.find((r) => r.id === id)
  const { progress, update, toggleIngredient, ready } = useBakeProgress(id)
  const { active: wakeActive, acquire, release } = useWakeLock()
  const [revealAll, setRevealAll] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)

  // Acquire the wake lock for the whole bake-mode session.
  useEffect(() => {
    void acquire()
    return () => {
      void release()
    }
  }, [acquire, release])

  const factor = recipe && progress ? resolveScaleFactor(recipe, progress) : 1
  const scaled = useMemo(
    () => (recipe ? scaleRecipe(recipe, factor) : null),
    [recipe, factor],
  )

  // id -> scaled ingredient + its group kind, for inline step ingredients.
  const ingredientIndex = useMemo(() => {
    const map = new Map<string, StepIngredient>()
    if (scaled) {
      for (const g of scaled.groups) {
        for (const ing of g.ingredients) map.set(ing.id, { ing, kind: g.kind })
      }
    }
    return map
  }, [scaled])

  const steps = recipe?.steps ?? []
  const stepIndex = Math.min(progress?.stepIndex ?? 0, Math.max(0, steps.length - 1))

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(steps.length - 1, next))
      update({ stepIndex: clamped })
    },
    [steps.length, update],
  )

  const next = useCallback(() => goTo(stepIndex + 1), [goTo, stepIndex])
  const prev = useCallback(() => goTo(stepIndex - 1), [goTo, stepIndex])

  const swipe = useSwipe({ onSwipeLeft: next, onSwipeRight: prev })

  // Keyboard navigation (kitchen tablets often pair a Bluetooth keyboard).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') navigate(`/recipe/${id}`)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [next, prev, navigate, id])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  if (!recipe || !scaled || !ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-ink-faint">
        Loading…
      </div>
    )
  }

  if (steps.length === 0) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-bg px-8 text-center">
        <p className="font-recipe text-2xl text-ink">This recipe has no steps yet.</p>
        <div className="flex gap-3">
          <Link
            to={`/recipe/${id}/edit`}
            className="min-h-12 rounded-2xl bg-gold px-5 font-semibold leading-[3rem] text-black"
          >
            Add steps
          </Link>
          <Link
            to={`/recipe/${id}`}
            className="min-h-12 rounded-2xl border border-line px-5 font-semibold leading-[3rem] text-ink"
          >
            Back
          </Link>
        </div>
      </div>
    )
  }

  const step = steps[stepIndex]
  const stepIngredients = step.ingredientIds
    .map((iid) => ingredientIndex.get(iid))
    .filter((x): x is StepIngredient => !!x)

  const parsed = parseTimers(step.text)
  const explicit =
    step.timerSeconds && step.timerSeconds > 0
      ? { seconds: step.timerSeconds, label: actionLabel(step.text) }
      : null
  const primaryDuration = explicit?.seconds ?? parsed[0]?.seconds
  const isLast = stepIndex === steps.length - 1
  const checked = new Set(progress?.checkedIngredientIds ?? [])

  const copyForPhone = async () => {
    if (!primaryDuration) return
    const text = formatDuration(primaryDuration)
    try {
      await navigator.clipboard.writeText(text)
      showToast(`Copied ${text} — set your phone’s timer`)
    } catch {
      showToast(`Set your phone’s timer for ${text}`)
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-bg">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Link
          to={`/recipe/${id}`}
          className="min-tap flex items-center justify-center rounded-xl text-ink-soft"
          aria-label="Exit bake mode"
        >
          <CloseIcon size={26} />
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate font-recipe text-lg leading-tight text-ink">{recipe.name}</p>
          <p className="text-xs text-ink-faint">
            Step {stepIndex + 1} of {steps.length} · {formatGrams(scaled.scaledFlourGrams)} flour
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRevealAll((v) => !v)}
          aria-pressed={revealAll}
          className={`min-tap flex items-center justify-center rounded-xl text-sm font-semibold ${
            revealAll ? 'text-gold' : 'text-ink-faint'
          }`}
          aria-label={revealAll ? 'Hide all ingredient amounts' : 'Show all ingredient amounts'}
          title="Show all amounts"
        >
          {revealAll ? 'Hide g' : 'Show g'}
        </button>
      </div>

      {/* Progress + wake indicator */}
      <div className="px-3 pt-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gold transition-[width] duration-300"
            style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="mt-1 text-center text-[0.7rem] text-ink-faint">
          {wakeActive ? '● Screen stays awake' : '○ Screen may sleep — keep it plugged in'}
        </p>
      </div>

      {/* Step body */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
        <p className="font-recipe text-3xl font-medium leading-snug text-ink sm:text-4xl">
          {step.text}
        </p>

        {(explicit || parsed.length > 0) && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {explicit && <TimerChip label={explicit.label} seconds={explicit.seconds} big />}
            {parsed.map((t, i) => (
              <TimerChip key={i} label={t.label} seconds={t.seconds} isRange={t.isRange} big />
            ))}
            {primaryDuration && (
              <button
                type="button"
                onClick={copyForPhone}
                className="inline-flex min-h-12 items-center gap-1.5 rounded-full border border-line px-3 text-sm text-ink-soft"
                aria-label="Copy the timer duration to set on your phone"
              >
                <PhoneIcon size={18} /> Phone timer
              </button>
            )}
          </div>
        )}

        {step.photoIds.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-faint">
              Reminder
            </p>
            <div className="flex flex-wrap gap-3">
              {step.photoIds.map((pid) => (
                <PhotoThumb
                  key={pid}
                  photoId={pid}
                  alt={`Step ${stepIndex + 1} reminder photo`}
                  className="h-28 w-28"
                  rounded="rounded-2xl"
                />
              ))}
            </div>
          </div>
        )}

        {stepIngredients.length > 0 && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-ink-faint">
              Add now — tap to check off
            </p>
            <ul className="space-y-2">
              {stepIngredients.map(({ ing, kind }) => {
                const isChecked = checked.has(ing.id)
                const show = isChecked || revealAll
                const amount =
                  (ing.grams || 0) > 0 ? formatGrams(ing.scaledGrams) : ing.display || ''
                const s = KIND_STYLE[kind]
                const Icon = s.Icon
                return (
                  <li key={ing.id}>
                    <button
                      type="button"
                      onClick={() => toggleIngredient(ing.id)}
                      aria-pressed={isChecked}
                      className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border px-4 text-left transition-colors ${
                        isChecked
                          ? 'border-gold/40 bg-gold/10'
                          : `${s.border} ${s.cardBg}`
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          isChecked ? 'border-gold bg-gold text-black' : `${s.border} ${s.text}`
                        }`}
                      >
                        {isChecked ? <CheckIcon size={18} /> : <Icon size={16} />}
                      </span>
                      <span
                        className={`flex-1 text-xl ${
                          isChecked ? 'text-ink-faint line-through' : 'text-ink'
                        }`}
                      >
                        {ing.name}
                      </span>
                      <span
                        className={`shrink-0 text-xl font-semibold tabular-nums ${
                          show ? 'text-ink' : 'text-ink-faint'
                        }`}
                      >
                        {show ? amount : 'tap'}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="flex items-stretch gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          onClick={prev}
          disabled={stepIndex === 0}
          className="flex min-h-[64px] flex-1 items-center justify-center gap-1 rounded-2xl border border-line text-lg font-semibold text-ink disabled:opacity-30"
        >
          <ChevronLeftIcon size={26} /> Back
        </button>
        {isLast ? (
          <Link
            to={`/recipe/${id}`}
            className="flex min-h-[64px] flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-gold text-lg font-bold text-black"
          >
            <FlameIcon size={24} /> Done
          </Link>
        ) : (
          <button
            type="button"
            onClick={next}
            className="flex min-h-[64px] flex-[1.4] items-center justify-center gap-1 rounded-2xl bg-gold text-lg font-bold text-black"
          >
            Next <ChevronRightIcon size={26} />
          </button>
        )}
      </div>

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-28 flex justify-center px-4">
          <span className="rounded-full bg-surface-3 px-4 py-2 text-sm text-ink shadow-lg">
            {toast}
          </span>
        </div>
      )}
    </div>
  )
}
