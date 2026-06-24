import { Link, useParams } from 'react-router-dom'
import { useRecipes } from '../context/RecipesContext'
import { useBakeProgress } from '../hooks/useBakeProgress'
import { usePhotoUrl } from '../hooks/usePhotoUrl'
import {
  resolveScaleFactor,
  scaleRecipe,
  totalFlourGrams,
  hydrationPercent,
} from '../lib/recipeMath'
import { parseTimers, actionLabel } from '../lib/parseTimers'
import { IngredientGroupCard } from '../components/IngredientGroupCard'
import { ScaleControls } from '../components/ScaleControls'
import { TimerChip } from '../components/TimerChip'
import { PhotoThumb } from '../components/PhotoThumb'
import {
  ArrowLeftIcon,
  FlameIcon,
  PencilIcon,
  NoteIcon,
  StarIcon,
} from '../components/icons'
import type { RecipeStep } from '../types/recipe'

export function RecipePage() {
  const { id = '' } = useParams()
  const { recipes, loading, saveRecipe } = useRecipes()
  const recipe = recipes.find((r) => r.id === id)
  const { progress, update } = useBakeProgress(id)

  if (!recipe) {
    return (
      <div className="py-16 text-center text-ink-faint">
        {loading ? 'Loading…' : 'Recipe not found.'}
        <div className="mt-4">
          <Link to="/" className="text-gold underline">
            Back to the cookbook
          </Link>
        </div>
      </div>
    )
  }

  const mode = progress?.scaleMode ?? 'factor'
  const factorVal = progress?.scaleFactor ?? 1
  const factor = progress ? resolveScaleFactor(recipe, progress) : 1
  const scaled = scaleRecipe(recipe, factor)
  const heroUrl = recipe.heroPhotoId

  const notesPreview = recipe.notes.trim()

  const toggleFavorite = () =>
    void saveRecipe({ ...recipe, favorite: !recipe.favorite, updatedAt: Date.now() })

  return (
    <div className="pb-4">
      <Link
        to="/"
        className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-gold"
      >
        <ArrowLeftIcon size={18} /> Cookbook
      </Link>

      {heroUrl && <HeroImage photoId={heroUrl} alt={recipe.name} />}

      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-recipe text-3xl leading-tight text-ink">{recipe.name}</h1>
          <p className="mt-1 text-ink-soft">
            {[recipe.category, recipe.yieldText].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button
          type="button"
          onClick={toggleFavorite}
          className={`min-tap flex shrink-0 items-center justify-center rounded-xl border border-line ${
            recipe.favorite ? 'text-gold' : 'text-ink-faint'
          }`}
          aria-pressed={!!recipe.favorite}
          aria-label={
            recipe.favorite
              ? `Remove ${recipe.name} from favourites`
              : `Add ${recipe.name} to favourites`
          }
        >
          <StarIcon filled={!!recipe.favorite} />
        </button>
      </div>

      {recipe.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {recipe.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-soft"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      <div className="mb-5 grid grid-cols-[1fr_auto_auto] gap-2">
        <Link
          to={`/recipe/${recipe.id}/bake`}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-gold text-lg font-bold text-black"
        >
          <FlameIcon size={24} /> Bake mode
        </Link>
        <Link
          to={`/recipe/${recipe.id}/notes`}
          className="flex min-h-14 min-w-14 items-center justify-center rounded-2xl border border-line text-ink-soft"
          aria-label="Notes"
        >
          <NoteIcon />
        </Link>
        <Link
          to={`/recipe/${recipe.id}/edit`}
          className="flex min-h-14 min-w-14 items-center justify-center rounded-2xl border border-line text-ink-soft"
          aria-label="Edit recipe"
        >
          <PencilIcon />
        </Link>
      </div>

      <div className="mb-5">
        <ScaleControls
          baseFlourGrams={totalFlourGrams(recipe)}
          mode={mode}
          factor={factorVal}
          targetFlourGrams={progress?.targetFlourGrams}
          hydration={hydrationPercent(recipe)}
          onSetFactor={(f) => update({ scaleMode: 'factor', scaleFactor: f })}
          onSetFlour={(g) => update({ scaleMode: 'flour', targetFlourGrams: g })}
        />
      </div>

      <h2 className="mb-3 font-recipe text-2xl text-ink">Ingredients</h2>
      <div className="mb-6 space-y-3">
        {scaled.groups.map((g) => (
          <IngredientGroupCard key={g.id} group={g} factor={factor} />
        ))}
      </div>

      <h2 className="mb-3 font-recipe text-2xl text-ink">Method</h2>
      <ol className="mb-6 space-y-4">
        {recipe.steps.map((step, i) => (
          <StepPreview key={step.id} step={step} index={i} />
        ))}
      </ol>

      <h2 className="mb-3 font-recipe text-2xl text-ink">Notes</h2>
      <Link
        to={`/recipe/${recipe.id}/notes`}
        className="block rounded-2xl border border-line bg-surface p-4 hover:border-gold/40"
      >
        {notesPreview ? (
          <p className="clamp-3 whitespace-pre-line text-ink-soft">{notesPreview}</p>
        ) : (
          <p className="text-ink-faint">Add notes — packing, tweaks, what to fix next time…</p>
        )}
        <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-gold">
          <NoteIcon size={16} /> Open notes
        </span>
      </Link>
    </div>
  )
}

function HeroImage({ photoId, alt }: { photoId: string; alt: string }) {
  const url = usePhotoUrl(photoId)
  if (!url) return null
  return (
    <img
      src={url}
      alt={alt}
      className="mb-4 aspect-[16/10] w-full rounded-2xl border border-line object-cover"
    />
  )
}

function StepPreview({ step, index }: { step: RecipeStep; index: number }) {
  const timers = parseTimers(step.text)
  const explicit =
    step.timerSeconds && step.timerSeconds > 0
      ? { seconds: step.timerSeconds, label: actionLabel(step.text), isRange: false }
      : null

  return (
    <li className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-recipe text-lg text-gold">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-lg leading-relaxed text-ink">{step.text}</p>

        {step.photoIds.length > 0 && (
          <div className="mt-2 flex gap-2">
            {step.photoIds.map((pid) => (
              <PhotoThumb
                key={pid}
                photoId={pid}
                alt={`Step ${index + 1} reminder`}
                className="h-16 w-16"
              />
            ))}
          </div>
        )}

        {(explicit || timers.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {explicit && (
              <TimerChip label={explicit.label} seconds={explicit.seconds} />
            )}
            {timers.map((t, ti) => (
              <TimerChip key={ti} label={t.label} seconds={t.seconds} isRange={t.isRange} />
            ))}
          </div>
        )}
      </div>
    </li>
  )
}
