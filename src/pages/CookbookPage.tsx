import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecipes } from '../context/RecipesContext'
import { RecipeCard } from '../components/RecipeCard'
import { SearchIcon, PlusIcon, BookIcon } from '../components/icons'

export function CookbookPage() {
  const { recipes, loading } = useRecipes()
  const [query, setQuery] = useState('')
  const [tag, setTag] = useState<string | null>(null)

  const allTags = useMemo(() => {
    const set = new Set<string>()
    for (const r of recipes) for (const t of r.tags) set.add(t)
    return [...set].sort()
  }, [recipes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return recipes.filter((r) => {
      const matchesTag = !tag || r.tags.includes(tag)
      if (!matchesTag) return false
      if (!q) return true
      return (
        r.name.toLowerCase().includes(q) ||
        (r.category ?? '').toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
  }, [recipes, query, tag])

  return (
    <div>
      <div className="relative mb-3">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint">
          <SearchIcon size={20} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search recipes, tags…"
          className="w-full rounded-xl border border-line bg-surface py-3 pl-11 pr-3 text-base text-ink placeholder:text-ink-faint focus:border-gold focus:outline-none"
          aria-label="Search recipes"
        />
      </div>

      {allTags.length > 0 && (
        <div className="scroll-x mb-4 flex gap-2 pb-1">
          <TagChip label="All" active={tag === null} onClick={() => setTag(null)} />
          {allTags.map((t) => (
            <TagChip key={t} label={t} active={tag === t} onClick={() => setTag(t)} />
          ))}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-ink-faint">Loading the recipe book…</p>
      ) : filtered.length === 0 ? (
        <EmptyState hasRecipes={recipes.length > 0} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      )}
    </div>
  )
}

function TagChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'border-gold bg-gold text-black'
          : 'border-line bg-surface text-ink-soft hover:border-gold/50'
      }`}
    >
      {label}
    </button>
  )
}

function EmptyState({ hasRecipes }: { hasRecipes: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-16 text-center">
      <span className="text-gold/70">
        <BookIcon size={48} />
      </span>
      <p className="font-recipe text-xl text-ink">
        {hasRecipes ? 'No recipes match that search.' : 'Your recipe book is empty.'}
      </p>
      {!hasRecipes && (
        <Link
          to="/new"
          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gold px-5 font-semibold text-black"
        >
          <PlusIcon size={20} /> Add your first recipe
        </Link>
      )}
    </div>
  )
}
