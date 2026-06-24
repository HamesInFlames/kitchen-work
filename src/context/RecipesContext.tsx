import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Recipe } from '../types/recipe'
import {
  getAllRecipes,
  putRecipe,
  deleteRecipe,
  newId,
} from '../db/database'
import { SEED_RECIPES } from '../lib/seed'

interface RecipesContextValue {
  recipes: Recipe[]
  loading: boolean
  getById: (id: string) => Recipe | undefined
  saveRecipe: (recipe: Recipe) => Promise<void>
  removeRecipe: (id: string) => Promise<void>
  reload: () => Promise<void>
}

const RecipesContext = createContext<RecipesContextValue | null>(null)

export function RecipesProvider({ children }: { children: ReactNode }) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    const all = await getAllRecipes()
    setRecipes(all)
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      let all = await getAllRecipes()
      if (all.length === 0) {
        // First run — plant the starter recipes.
        for (const r of SEED_RECIPES) await putRecipe(r)
        all = await getAllRecipes()
      }
      if (alive) {
        setRecipes(all)
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const saveRecipe = useCallback(async (recipe: Recipe) => {
    await putRecipe(recipe)
    setRecipes((prev) => {
      const idx = prev.findIndex((r) => r.id === recipe.id)
      const next = idx >= 0 ? prev.map((r) => (r.id === recipe.id ? recipe : r)) : [recipe, ...prev]
      return [...next].sort((a, b) => b.updatedAt - a.updatedAt)
    })
  }, [])

  const removeRecipe = useCallback(async (id: string) => {
    await deleteRecipe(id)
    setRecipes((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const getById = useCallback(
    (id: string) => recipes.find((r) => r.id === id),
    [recipes],
  )

  const value = useMemo<RecipesContextValue>(
    () => ({ recipes, loading, getById, saveRecipe, removeRecipe, reload }),
    [recipes, loading, getById, saveRecipe, removeRecipe, reload],
  )

  return <RecipesContext.Provider value={value}>{children}</RecipesContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRecipes(): RecipesContextValue {
  const ctx = useContext(RecipesContext)
  if (!ctx) throw new Error('useRecipes must be used within a RecipesProvider')
  return ctx
}

/** A blank recipe ready for the editor. */
// eslint-disable-next-line react-refresh/only-export-components
export function createBlankRecipe(): Recipe {
  const ts = Date.now()
  return {
    id: newId(),
    name: '',
    category: '',
    yieldText: '',
    notes: '',
    tags: [],
    createdAt: ts,
    updatedAt: ts,
    groups: [
      {
        id: newId(),
        title: 'Dry',
        kind: 'dry',
        combine: 'Whisk together',
        ingredients: [{ id: newId(), name: '', grams: 0, isFlour: true }],
      },
      {
        id: newId(),
        title: 'Wet',
        kind: 'wet',
        combine: 'Beat together',
        ingredients: [{ id: newId(), name: '', grams: 0, isLiquid: true }],
      },
    ],
    steps: [{ id: newId(), text: '', ingredientIds: [], photoIds: [] }],
  }
}
