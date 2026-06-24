// Core data model for the recipe book.
//
// Everything is a clean, serialisable JSON shape (photos are the one exception —
// stored as Blobs in IndexedDB) so the local store maps 1:1 to a future
// Railway/Postgres document model. Amounts are canonical in GRAMS — grams-first
// is what professional bakers want; volume/free-text lives in `display`.

export type IngredientKind = 'wet' | 'dry' | 'other'

export interface Ingredient {
  id: string
  name: string
  /** Canonical weight in grams for the BASE (unscaled) recipe. 0 when only `display` applies. */
  grams: number
  /** Free-text amount for things you don't weigh, e.g. "2 large eggs", "1 pinch". */
  display?: string
  /** Counts toward total flour weight — the denominator for baker's percentages. */
  isFlour?: boolean
  /** Counts toward hydration (water, milk, eggs-as-liquid…). */
  isLiquid?: boolean
  note?: string
}

export interface IngredientGroup {
  id: string
  /** Subsection header — "For the dry", "For the filling". */
  title: string
  /** Drives wet/dry colour-coding + icon + label. */
  kind: IngredientKind
  /** The "combine these together" instruction chip — "Whisk together", "Cream until pale". */
  combine?: string
  ingredients: Ingredient[]
}

export interface RecipeStep {
  id: string
  text: string
  /** Ingredients used in this step (shown inline; tap a name to reveal its scaled amount). */
  ingredientIds: string[]
  /** Reminder photos for this step — tray layouts, "where the X is stored". */
  photoIds: string[]
  /** An explicit timer for this step, in seconds (in addition to any auto-detected in the text). */
  timerSeconds?: number
}

export interface Recipe {
  id: string
  name: string
  category?: string
  heroPhotoId?: string
  /** "Makes 12 rolls", "Two 9-inch loaves". */
  yieldText?: string
  /** Dedicated freeform notes — packing instructions, tweaks, what went wrong last time. */
  notes: string
  groups: IngredientGroup[]
  steps: RecipeStep[]
  tags: string[]
  favorite?: boolean
  createdAt: number
  updatedAt: number
}

export interface Photo {
  id: string
  recipeId: string
  kind: 'hero' | 'reminder' | 'step'
  blob: Blob
  width?: number
  height?: number
  caption?: string
  createdAt: number
}

export type ScaleMode = 'factor' | 'flour'

/** Per-recipe cook-mode state — persisted so navigating away never resets progress. */
export interface BakeProgress {
  recipeId: string
  stepIndex: number
  checkedIngredientIds: string[]
  scaleMode: ScaleMode
  /** Multiplier applied to base grams when scaleMode === 'factor'. */
  scaleFactor: number
  /** Target total flour weight (g) when scaleMode === 'flour'. */
  targetFlourGrams?: number
  updatedAt: number
}
