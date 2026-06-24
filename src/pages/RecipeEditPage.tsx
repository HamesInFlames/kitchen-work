import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useRecipes, createBlankRecipe } from '../context/RecipesContext'
import { newId } from '../db/database'
import { savePhoto, evictPhotoUrl } from '../db/photos'
import { deletePhoto } from '../db/database'
import { usePhotoUrl } from '../hooks/usePhotoUrl'
import { KIND_STYLE } from '../components/WetDryBadge'
import {
  PlusIcon,
  TrashIcon,
  CameraIcon,
  CloseIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
} from '../components/icons'
import type { Recipe, IngredientGroup, Ingredient, RecipeStep, IngredientKind } from '../types/recipe'

export function RecipeEditPage() {
  const { id } = useParams()
  const editing = !!id
  const navigate = useNavigate()
  const { recipes, saveRecipe, removeRecipe } = useRecipes()

  const [draft, setDraft] = useState<Recipe | null>(null)
  const [tagsText, setTagsText] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Initialise the draft once (clone the stored recipe so edits stay local).
  useEffect(() => {
    if (draft) return
    if (editing) {
      const existing = recipes.find((r) => r.id === id)
      if (existing) {
        setDraft(structuredClone(existing))
        setTagsText(existing.tags.join(', '))
      }
    } else {
      setDraft(createBlankRecipe())
    }
  }, [draft, editing, id, recipes])

  if (!draft) {
    return <p className="py-16 text-center text-ink-faint">Loading…</p>
  }

  const patch = (p: Partial<Recipe>) => setDraft((d) => (d ? { ...d, ...p } : d))

  const updateGroup = (gid: string, p: Partial<IngredientGroup>) =>
    patch({ groups: draft.groups.map((g) => (g.id === gid ? { ...g, ...p } : g)) })

  const updateIngredient = (gid: string, iid: string, p: Partial<Ingredient>) =>
    updateGroup(gid, {
      ingredients: draft.groups
        .find((g) => g.id === gid)!
        .ingredients.map((i) => (i.id === iid ? { ...i, ...p } : i)),
    })

  const addIngredient = (gid: string) =>
    updateGroup(gid, {
      ingredients: [
        ...draft.groups.find((g) => g.id === gid)!.ingredients,
        { id: newId(), name: '', grams: 0 },
      ],
    })

  const removeIngredient = (gid: string, iid: string) =>
    updateGroup(gid, {
      ingredients: draft.groups.find((g) => g.id === gid)!.ingredients.filter((i) => i.id !== iid),
    })

  const addGroup = () =>
    patch({
      groups: [
        ...draft.groups,
        { id: newId(), title: 'New group', kind: 'other', ingredients: [{ id: newId(), name: '', grams: 0 }] },
      ],
    })

  const removeGroup = (gid: string) =>
    patch({ groups: draft.groups.filter((g) => g.id !== gid) })

  const moveGroup = (gid: string, dir: -1 | 1) => patch({ groups: move(draft.groups, gid, dir) })

  const updateStep = (sid: string, p: Partial<RecipeStep>) =>
    patch({ steps: draft.steps.map((s) => (s.id === sid ? { ...s, ...p } : s)) })

  const addStep = () =>
    patch({ steps: [...draft.steps, { id: newId(), text: '', ingredientIds: [], photoIds: [] }] })

  const removeStep = (sid: string) => patch({ steps: draft.steps.filter((s) => s.id !== sid) })
  const moveStep = (sid: string, dir: -1 | 1) => patch({ steps: move(draft.steps, sid, dir) })

  // --- photos ---
  const pickHero = async (file: File) => {
    try {
      if (draft.heroPhotoId) {
        await deletePhoto(draft.heroPhotoId)
        evictPhotoUrl(draft.heroPhotoId)
      }
      const photo = await savePhoto(draft.id, 'hero', file)
      patch({ heroPhotoId: photo.id })
    } catch (e) {
      console.error(e)
      setError('Could not add that photo. Try a different one.')
    }
  }
  const removeHero = async () => {
    if (draft.heroPhotoId) {
      await deletePhoto(draft.heroPhotoId).catch(() => {})
      evictPhotoUrl(draft.heroPhotoId)
    }
    patch({ heroPhotoId: undefined })
  }
  const addStepPhoto = async (sid: string, file: File) => {
    try {
      const photo = await savePhoto(draft.id, 'reminder', file)
      const step = draft.steps.find((s) => s.id === sid)!
      updateStep(sid, { photoIds: [...step.photoIds, photo.id] })
    } catch (e) {
      console.error(e)
      setError('Could not add that photo. Try a different one.')
    }
  }
  const removeStepPhoto = async (sid: string, pid: string) => {
    await deletePhoto(pid)
    evictPhotoUrl(pid)
    const step = draft.steps.find((s) => s.id === sid)!
    updateStep(sid, { photoIds: step.photoIds.filter((p) => p !== pid) })
  }

  const allIngredients = draft.groups.flatMap((g) =>
    g.ingredients.map((i) => ({ ...i, groupTitle: g.title, kind: g.kind })),
  )

  const save = async () => {
    if (!draft.name.trim()) {
      setError('Give the recipe a name first.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const validIds = new Set(allIngredients.map((i) => i.id))
    const cleaned: Recipe = {
      ...draft,
      name: draft.name.trim(),
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      groups: draft.groups.map((g) => ({
        ...g,
        ingredients: g.ingredients.filter(
          (i) => i.name.trim() || (i.display ?? '').trim() || i.grams > 0,
        ),
      })),
      steps: draft.steps
        .filter((s) => s.text.trim() || s.photoIds.length > 0)
        .map((s) => ({ ...s, ingredientIds: s.ingredientIds.filter((iid) => validIds.has(iid)) })),
      updatedAt: Date.now(),
    }
    try {
      await saveRecipe(cleaned)
      navigate(`/recipe/${cleaned.id}`)
    } catch (e) {
      console.error(e)
      setError('Could not save the recipe. Please try again.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const destroy = async () => {
    if (!window.confirm(`Delete “${draft.name || 'this recipe'}” permanently?`)) return
    try {
      await removeRecipe(draft.id)
      navigate('/')
    } catch (e) {
      console.error(e)
      setError('Could not delete the recipe. Please try again.')
    }
  }

  return (
    <div className="pb-8">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-gold"
        >
          <ArrowLeftIcon size={18} /> Cancel
        </button>
        <button
          type="button"
          onClick={() => void save()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-gold px-4 font-semibold text-black"
        >
          <CheckIcon size={18} /> Save
        </button>
      </div>

      <h1 className="mb-4 font-recipe text-2xl text-ink">
        {editing ? 'Edit recipe' : 'New recipe'}
      </h1>

      {error && (
        <p className="mb-4 rounded-xl border border-danger/50 bg-danger/10 px-4 py-2 text-danger">
          {error}
        </p>
      )}

      {/* Basics */}
      <div className="space-y-3">
        <Field label="Name">
          <input
            value={draft.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="e.g. Six-Braid Challah"
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <input
              value={draft.category ?? ''}
              onChange={(e) => patch({ category: e.target.value })}
              placeholder="Breads"
              className={inputClass}
            />
          </Field>
          <Field label="Yield">
            <input
              value={draft.yieldText ?? ''}
              onChange={(e) => patch({ yieldText: e.target.value })}
              placeholder="Two loaves"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Tags (comma separated)">
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="shabbat, enriched, pareve"
            className={inputClass}
          />
        </Field>

        <Field label="Cover photo">
          <HeroPhotoField
            photoId={draft.heroPhotoId}
            onPick={pickHero}
            onRemove={removeHero}
          />
        </Field>
      </div>

      {/* Ingredient groups */}
      <h2 className="mb-3 mt-7 font-recipe text-xl text-ink">Ingredient groups</h2>
      <div className="space-y-4">
        {draft.groups.map((group, gi) => (
          <GroupEditor
            key={group.id}
            group={group}
            index={gi}
            total={draft.groups.length}
            onChange={(p) => updateGroup(group.id, p)}
            onUpdateIngredient={(iid, p) => updateIngredient(group.id, iid, p)}
            onAddIngredient={() => addIngredient(group.id)}
            onRemoveIngredient={(iid) => removeIngredient(group.id, iid)}
            onRemove={() => removeGroup(group.id)}
            onMove={(dir) => moveGroup(group.id, dir)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={addGroup}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-3 text-ink-soft hover:border-gold/50 hover:text-gold"
      >
        <PlusIcon size={20} /> Add group
      </button>

      {/* Steps */}
      <h2 className="mb-3 mt-7 font-recipe text-xl text-ink">Method</h2>
      <div className="space-y-4">
        {draft.steps.map((step, si) => (
          <StepEditor
            key={step.id}
            step={step}
            index={si}
            total={draft.steps.length}
            allIngredients={allIngredients}
            onChange={(p) => updateStep(step.id, p)}
            onRemove={() => removeStep(step.id)}
            onMove={(dir) => moveStep(step.id, dir)}
            onAddPhoto={(file) => addStepPhoto(step.id, file)}
            onRemovePhoto={(pid) => removeStepPhoto(step.id, pid)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={addStep}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-3 text-ink-soft hover:border-gold/50 hover:text-gold"
      >
        <PlusIcon size={20} /> Add step
      </button>

      {/* Footer actions */}
      <div className="mt-8 flex items-center justify-between">
        {editing ? (
          <button
            type="button"
            onClick={() => void destroy()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-danger/40 px-4 py-2 text-danger"
          >
            <TrashIcon size={18} /> Delete
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={() => void save()}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-gold px-5 font-semibold text-black"
        >
          <CheckIcon size={18} /> Save recipe
        </button>
      </div>
    </div>
  )
}

// --- helpers ---------------------------------------------------------------

const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-base text-ink placeholder:text-ink-faint focus:border-gold focus:outline-none'

function move<T extends { id: string }>(arr: T[], id: string, dir: -1 | 1): T[] {
  const idx = arr.findIndex((x) => x.id === id)
  const next = idx + dir
  if (idx < 0 || next < 0 || next >= arr.length) return arr
  const copy = [...arr]
  ;[copy[idx], copy[next]] = [copy[next], copy[idx]]
  return copy
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  )
}

function PhotoInput({
  onPick,
  children,
  className,
}: {
  onPick: (file: File) => void | Promise<void>
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={className}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) {
            try {
              await onPick(file)
            } catch (err) {
              console.error('Photo capture failed', err)
            }
          }
          e.target.value = ''
        }}
      />
      {children}
    </label>
  )
}

function HeroPhotoField({
  photoId,
  onPick,
  onRemove,
}: {
  photoId?: string
  onPick: (file: File) => void
  onRemove: () => void
}) {
  const url = usePhotoUrl(photoId)
  if (photoId && url) {
    return (
      <div className="relative">
        <img src={url} alt="" className="aspect-[16/10] w-full rounded-xl border border-line object-cover" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white"
          aria-label="Remove cover photo"
        >
          <TrashIcon size={18} />
        </button>
      </div>
    )
  }
  return (
    <PhotoInput
      onPick={onPick}
      className="flex aspect-[16/10] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface text-ink-soft"
    >
      <CameraIcon size={28} />
      <span className="text-sm">Add a cover photo</span>
    </PhotoInput>
  )
}

const KIND_OPTIONS: IngredientKind[] = ['dry', 'wet', 'other']

function GroupEditor({
  group,
  index,
  total,
  onChange,
  onUpdateIngredient,
  onAddIngredient,
  onRemoveIngredient,
  onRemove,
  onMove,
}: {
  group: IngredientGroup
  index: number
  total: number
  onChange: (p: Partial<IngredientGroup>) => void
  onUpdateIngredient: (iid: string, p: Partial<Ingredient>) => void
  onAddIngredient: () => void
  onRemoveIngredient: (iid: string) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const s = KIND_STYLE[group.kind]
  return (
    <div className={`rounded-2xl border ${s.border} ${s.cardBg} p-3`}>
      <div className="mb-3 flex items-center gap-2">
        <input
          value={group.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Group title (e.g. For the dry)"
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2.5 py-2 font-recipe text-lg text-ink focus:border-gold focus:outline-none"
        />
        <MoveButtons index={index} total={total} onMove={onMove} />
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-2 text-ink-faint hover:text-danger"
          aria-label="Remove group"
        >
          <TrashIcon size={18} />
        </button>
      </div>

      <div className="mb-3 flex gap-1.5">
        {KIND_OPTIONS.map((k) => {
          const ks = KIND_STYLE[k]
          const Icon = ks.Icon
          const active = group.kind === k
          return (
            <button
              key={k}
              type="button"
              onClick={() => onChange({ kind: k })}
              aria-pressed={active}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-1.5 text-sm font-semibold capitalize ${
                active ? `border-current ${ks.text} bg-black/20` : 'border-line text-ink-faint'
              }`}
            >
              <Icon size={15} /> {ks.label}
            </button>
          )
        })}
      </div>

      <input
        value={group.combine ?? ''}
        onChange={(e) => onChange({ combine: e.target.value })}
        placeholder="Combine instruction (e.g. Whisk together)"
        className="mb-3 w-full rounded-lg border border-line bg-bg px-2.5 py-2 text-sm text-ink focus:border-gold focus:outline-none"
      />

      <div className="space-y-2">
        {group.ingredients.map((ing) => (
          <div key={ing.id} className="rounded-xl border border-line bg-bg/40 p-2">
            <div className="flex items-center gap-2">
              <input
                value={ing.name}
                onChange={(e) => onUpdateIngredient(ing.id, { name: e.target.value })}
                placeholder="Ingredient"
                className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2.5 py-2 text-ink focus:border-gold focus:outline-none"
              />
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={ing.grams || ''}
                onChange={(e) => onUpdateIngredient(ing.id, { grams: Number(e.target.value) || 0 })}
                placeholder="0"
                className="w-20 rounded-lg border border-line bg-bg px-2 py-2 text-right tabular-nums text-ink focus:border-gold focus:outline-none"
                aria-label="Grams"
              />
              <span className="text-sm text-ink-faint">g</span>
              <button
                type="button"
                onClick={() => onRemoveIngredient(ing.id)}
                className="rounded-lg p-1.5 text-ink-faint hover:text-danger"
                aria-label="Remove ingredient"
              >
                <CloseIcon size={18} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <input
                value={ing.display ?? ''}
                onChange={(e) => onUpdateIngredient(ing.id, { display: e.target.value })}
                placeholder='Free-text amount (e.g. "3 large")'
                className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2.5 py-1.5 text-sm text-ink focus:border-gold focus:outline-none"
              />
              <label className="flex items-center gap-1.5 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={!!ing.isFlour}
                  onChange={(e) => onUpdateIngredient(ing.id, { isFlour: e.target.checked })}
                  className="h-4 w-4 accent-gold"
                />
                flour
              </label>
              <label className="flex items-center gap-1.5 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={!!ing.isLiquid}
                  onChange={(e) => onUpdateIngredient(ing.id, { isLiquid: e.target.checked })}
                  className="h-4 w-4 accent-gold"
                />
                liquid
              </label>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddIngredient}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-line py-2 text-sm text-ink-soft hover:text-gold"
      >
        <PlusIcon size={16} /> Add ingredient
      </button>
    </div>
  )
}

function StepEditor({
  step,
  index,
  total,
  allIngredients,
  onChange,
  onRemove,
  onMove,
  onAddPhoto,
  onRemovePhoto,
}: {
  step: RecipeStep
  index: number
  total: number
  allIngredients: Array<Ingredient & { groupTitle: string; kind: IngredientKind }>
  onChange: (p: Partial<RecipeStep>) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
  onAddPhoto: (file: File) => void
  onRemovePhoto: (pid: string) => void
}) {
  const selected = new Set(step.ingredientIds)
  const toggle = (iid: string) => {
    const next = new Set(selected)
    if (next.has(iid)) next.delete(iid)
    else next.add(iid)
    onChange({ ingredientIds: [...next] })
  }
  const minutes = step.timerSeconds ? +(step.timerSeconds / 60).toFixed(2) : ''

  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 font-recipe text-gold">
          {index + 1}
        </span>
        <span className="flex-1 text-sm text-ink-faint">Step {index + 1}</span>
        <MoveButtons index={index} total={total} onMove={onMove} />
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg p-2 text-ink-faint hover:text-danger"
          aria-label="Remove step"
        >
          <TrashIcon size={18} />
        </button>
      </div>

      <textarea
        value={step.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Describe this step. Times like “bake 25–30 minutes” become tappable timers."
        className="min-h-20 w-full resize-y rounded-lg border border-line bg-bg px-2.5 py-2 text-ink focus:border-gold focus:outline-none"
      />

      {allIngredients.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-faint">
            Ingredients used here
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allIngredients
              .filter((i) => i.name.trim())
              .map((i) => {
                const active = selected.has(i.id)
                return (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => toggle(i.id)}
                    aria-pressed={active}
                    className={`rounded-full border px-2.5 py-1 text-sm ${
                      active
                        ? 'border-gold bg-gold/15 text-gold'
                        : 'border-line text-ink-soft'
                    }`}
                  >
                    {i.name}
                  </button>
                )
              })}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          Timer
          <input
            type="number"
            inputMode="decimal"
            min={0}
            value={minutes}
            onChange={(e) => {
              const m = Number(e.target.value)
              onChange({ timerSeconds: m > 0 ? Math.round(m * 60) : undefined })
            }}
            placeholder="min"
            className="w-20 rounded-lg border border-line bg-bg px-2 py-1.5 text-right tabular-nums text-ink focus:border-gold focus:outline-none"
          />
          min
        </label>

        <div className="flex flex-wrap items-center gap-2">
          {step.photoIds.map((pid) => (
            <StepPhotoThumb key={pid} photoId={pid} onRemove={() => onRemovePhoto(pid)} />
          ))}
          <PhotoInput
            onPick={onAddPhoto}
            className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-xl border border-dashed border-line text-ink-soft"
          >
            <CameraIcon size={20} />
          </PhotoInput>
        </div>
      </div>
    </div>
  )
}

function StepPhotoThumb({ photoId, onRemove }: { photoId: string; onRemove: () => void }) {
  const url = usePhotoUrl(photoId)
  return (
    <div className="relative h-14 w-14">
      {url ? (
        <img src={url} alt="" className="h-full w-full rounded-xl border border-line object-cover" />
      ) : (
        <div className="h-full w-full rounded-xl border border-line bg-surface-2" />
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 rounded-full bg-black/70 p-0.5 text-white"
        aria-label="Remove photo"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  )
}

function MoveButtons({
  index,
  total,
  onMove,
}: {
  index: number
  total: number
  onMove: (dir: -1 | 1) => void
}) {
  return (
    <span className="flex items-center">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        className="rounded-lg p-1.5 text-ink-faint disabled:opacity-30"
        aria-label="Move up"
      >
        <ChevronLeftIcon size={18} className="rotate-90" />
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        className="rounded-lg p-1.5 text-ink-faint disabled:opacity-30"
        aria-label="Move down"
      >
        <ChevronRightIcon size={18} className="rotate-90" />
      </button>
    </span>
  )
}
