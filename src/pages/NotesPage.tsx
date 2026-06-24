import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useRecipes } from '../context/RecipesContext'
import { ArrowLeftIcon, CheckIcon, NoteIcon } from '../components/icons'

/**
 * A dedicated, distraction-free notes page per recipe — the freeform space
 * bakers repeatedly ask for: packing instructions, tweaks, what went wrong.
 * Autosaves as you type.
 */
export function NotesPage() {
  const { id = '' } = useParams()
  const { recipes, saveRecipe } = useRecipes()
  const recipe = recipes.find((r) => r.id === id)

  const [text, setText] = useState('')
  const [saved, setSaved] = useState(true)
  const synced = useRef(false)

  useEffect(() => {
    if (recipe && !synced.current) {
      setText(recipe.notes)
      synced.current = true
    }
  }, [recipe])

  useEffect(() => {
    if (!recipe || !synced.current) return
    if (text === recipe.notes) {
      setSaved(true)
      return
    }
    setSaved(false)
    const handle = window.setTimeout(() => {
      saveRecipe({ ...recipe, notes: text, updatedAt: Date.now() })
        .then(() => setSaved(true))
        .catch((e) => {
          console.error('Failed to save notes', e)
          setSaved(false)
        })
    }, 500)
    return () => window.clearTimeout(handle)
  }, [text, recipe, saveRecipe])

  if (!recipe) {
    return <p className="py-16 text-center text-ink-faint">Loading…</p>
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Link
          to={`/recipe/${id}`}
          className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-gold"
        >
          <ArrowLeftIcon size={18} /> {recipe.name}
        </Link>
        <span
          className={`inline-flex items-center gap-1 text-sm ${
            saved ? 'text-ink-faint' : 'text-gold'
          }`}
        >
          {saved ? (
            <>
              <CheckIcon size={16} /> Saved
            </>
          ) : (
            'Saving…'
          )}
        </span>
      </div>

      <h1 className="mb-1 flex items-center gap-2 font-recipe text-2xl text-ink">
        <NoteIcon size={22} className="text-gold" /> Notes
      </h1>
      <p className="mb-3 text-sm text-ink-faint">
        Packing instructions, tweaks, timings, what to fix next time.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Start typing your notes…"
        className="min-h-[60vh] w-full resize-y rounded-2xl border border-line bg-surface p-4 text-lg leading-relaxed text-ink placeholder:text-ink-faint focus:border-gold focus:outline-none"
      />
    </div>
  )
}
