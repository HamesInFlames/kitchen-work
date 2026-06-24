import { useCallback, useEffect, useRef, useState } from 'react'
import type { BakeProgress } from '../types/recipe'
import { getProgress, putProgress } from '../db/database'

function defaultProgress(recipeId: string): BakeProgress {
  return {
    recipeId,
    stepIndex: 0,
    checkedIngredientIds: [],
    scaleMode: 'factor',
    scaleFactor: 1,
    updatedAt: Date.now(),
  }
}

/**
 * Per-recipe cook-mode state, persisted to IndexedDB. This is the explicit
 * Paprika failure we refuse to repeat: check-offs and the current step survive
 * navigating away, backgrounding, or reopening the app.
 */
export function useBakeProgress(recipeId: string) {
  const [progress, setProgress] = useState<BakeProgress | null>(null)
  const loadedFor = useRef<string | null>(null)

  useEffect(() => {
    let alive = true
    loadedFor.current = null
    getProgress(recipeId).then((stored) => {
      if (!alive) return
      loadedFor.current = recipeId
      setProgress(stored ?? defaultProgress(recipeId))
    })
    return () => {
      alive = false
    }
  }, [recipeId])

  const update = useCallback(
    (patch: Partial<Omit<BakeProgress, 'recipeId'>>) => {
      setProgress((prev) => {
        const base = prev ?? defaultProgress(recipeId)
        const next: BakeProgress = { ...base, ...patch, recipeId, updatedAt: Date.now() }
        putProgress(next).catch((e) => console.error('Failed to persist bake progress', e))
        return next
      })
    },
    [recipeId],
  )

  const toggleIngredient = useCallback(
    (ingredientId: string) => {
      setProgress((prev) => {
        const base = prev ?? defaultProgress(recipeId)
        const set = new Set(base.checkedIngredientIds)
        if (set.has(ingredientId)) set.delete(ingredientId)
        else set.add(ingredientId)
        const next: BakeProgress = {
          ...base,
          checkedIngredientIds: [...set],
          recipeId,
          updatedAt: Date.now(),
        }
        putProgress(next).catch((e) => console.error('Failed to persist bake progress', e))
        return next
      })
    },
    [recipeId],
  )

  return { progress, update, toggleIngredient, ready: progress !== null }
}
