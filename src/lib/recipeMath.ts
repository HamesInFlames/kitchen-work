import type { Recipe, IngredientGroup, Ingredient, BakeProgress } from '../types/recipe'

// Baker's math. The rules pros actually want (and that competing apps get wrong):
//   • Flour is the anchor at 100%. TOTAL flour = the SUM of every flour ingredient
//     (bread flour + whole wheat + rye …), and that sum is the denominator.
//   • Each ingredient's baker % = its grams / total flour × 100. This is invariant
//     under scaling, which is exactly why it's useful.
//   • Hydration = total liquid / total flour × 100.

export function totalFlourGrams(recipe: Recipe): number {
  return sumIngredients(recipe, (i) => !!i.isFlour)
}

export function totalLiquidGrams(recipe: Recipe): number {
  return sumIngredients(recipe, (i) => !!i.isLiquid)
}

function sumIngredients(recipe: Recipe, pred: (i: Ingredient) => boolean): number {
  let total = 0
  for (const g of recipe.groups) for (const i of g.ingredients) if (pred(i)) total += i.grams || 0
  return total
}

/** Hydration as a percentage of total flour, or null when the recipe has no flour. */
export function hydrationPercent(recipe: Recipe): number | null {
  const flour = totalFlourGrams(recipe)
  if (flour <= 0) return null
  return (totalLiquidGrams(recipe) / flour) * 100
}

/** Baker's percentage for a single ingredient, or null when there's no flour to anchor to. */
export function bakerPercent(grams: number, totalFlour: number): number | null {
  if (totalFlour <= 0) return null
  return (grams / totalFlour) * 100
}

/**
 * The multiplier to apply to every base-recipe gram amount, derived from the
 * current scale settings. In 'flour' mode it's targetFlour / baseFlour.
 */
export function resolveScaleFactor(
  recipe: Recipe,
  opts: Pick<BakeProgress, 'scaleMode' | 'scaleFactor' | 'targetFlourGrams'>,
): number {
  if (opts.scaleMode === 'flour') {
    const base = totalFlourGrams(recipe)
    const target = opts.targetFlourGrams
    if (base > 0 && target && target > 0) return target / base
    return 1
  }
  return opts.scaleFactor > 0 ? opts.scaleFactor : 1
}

export interface ScaledIngredient extends Ingredient {
  scaledGrams: number
  /** Baker's % (scaling-invariant), or null when there's no flour. */
  percent: number | null
}

export interface ScaledGroup extends Omit<IngredientGroup, 'ingredients'> {
  ingredients: ScaledIngredient[]
}

export interface ScaledRecipe {
  factor: number
  baseFlourGrams: number
  scaledFlourGrams: number
  hydration: number | null
  groups: ScaledGroup[]
}

/** Project a recipe through a scale factor, attaching scaled grams + baker %. */
export function scaleRecipe(recipe: Recipe, factor: number): ScaledRecipe {
  const baseFlour = totalFlourGrams(recipe)
  const groups: ScaledGroup[] = recipe.groups.map((g) => ({
    ...g,
    ingredients: g.ingredients.map((i) => ({
      ...i,
      scaledGrams: roundGrams((i.grams || 0) * factor),
      percent: bakerPercent(i.grams || 0, baseFlour),
    })),
  }))
  return {
    factor,
    baseFlourGrams: baseFlour,
    scaledFlourGrams: roundGrams(baseFlour * factor),
    hydration: hydrationPercent(recipe),
    groups,
  }
}

/** Round to a kitchen-sensible precision: 0.1 g below 20 g, whole grams above. */
export function roundGrams(g: number): number {
  if (!isFinite(g)) return 0
  if (g < 20) return Math.round(g * 10) / 10
  return Math.round(g)
}

export const SCALE_PRESETS: ReadonlyArray<{ label: string; factor: number }> = [
  { label: '½×', factor: 0.5 },
  { label: '1×', factor: 1 },
  { label: '1½×', factor: 1.5 },
  { label: '2×', factor: 2 },
  { label: '3×', factor: 3 },
]
