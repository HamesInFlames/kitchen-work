import { Link } from 'react-router-dom'
import type { Recipe } from '../types/recipe'
import { usePhotoUrl } from '../hooks/usePhotoUrl'
import { hydrationPercent } from '../lib/recipeMath'
import { formatPercent } from '../lib/format'
import { StarIcon } from './icons'

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const url = usePhotoUrl(recipe.heroPhotoId)
  const hydration = hydrationPercent(recipe)
  const initial = (recipe.name || '?').trim().charAt(0).toUpperCase() || '?'

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="no-tap-highlight group block overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-gold/50"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        {url ? (
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-2 to-surface-3">
            <span className="font-recipe text-5xl text-gold/70">{initial}</span>
          </div>
        )}
        {recipe.favorite && (
          <span className="absolute right-2 top-2 rounded-full bg-black/40 p-1.5 text-gold backdrop-blur">
            <StarIcon size={18} filled />
          </span>
        )}
        {recipe.category && (
          <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-ink backdrop-blur">
            {recipe.category}
          </span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-recipe text-lg leading-tight text-ink">{recipe.name || 'Untitled'}</h3>
        <p className="mt-0.5 text-sm text-ink-soft">
          {recipe.yieldText || `${recipe.steps.length} step${recipe.steps.length === 1 ? '' : 's'}`}
          {hydration !== null && (
            <>
              {' · '}
              <span className="text-dry">{formatPercent(hydration, 0)} hydration</span>
            </>
          )}
        </p>
      </div>
    </Link>
  )
}
