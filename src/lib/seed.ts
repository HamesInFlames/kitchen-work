import type { Recipe } from '../types/recipe'

// Starter recipes so the book isn't empty on first run. Chosen to exercise every
// feature: wet/dry grouped ingredients, flour/liquid flags for baker's math,
// free-text amounts, combine instructions, step↔ingredient links, and times in
// step text that become one-tap timers. Kosher-bakery-appropriate for Tova's.

const now = Date.now()

export const SEED_RECIPES: Recipe[] = [
  {
    id: 'seed-challah',
    name: 'Six-Braid Challah',
    category: 'Breads',
    yieldText: 'Two medium loaves',
    tags: ['shabbat', 'enriched', 'pareve'],
    favorite: true,
    notes:
      'Pareve — uses oil, not butter, so it can go with a meat meal.\n\nDouble-braid for holidays. If the dough feels tight, the eggs were probably small — add a splash of warm water. Egg-wash twice (before AND after the first 10 min) for the deepest shine.',
    createdAt: now,
    updatedAt: now,
    groups: [
      {
        id: 'chal-g-dry',
        title: 'For the dough — dry',
        kind: 'dry',
        combine: 'Whisk together in the mixer bowl',
        ingredients: [
          { id: 'chal-flour', name: 'Bread flour', grams: 500, isFlour: true },
          { id: 'chal-sugar', name: 'Sugar', grams: 50 },
          { id: 'chal-yeast', name: 'Instant yeast', grams: 7, display: '2¼ tsp' },
          { id: 'chal-salt', name: 'Fine salt', grams: 10 },
        ],
      },
      {
        id: 'chal-g-wet',
        title: 'For the dough — wet',
        kind: 'wet',
        combine: 'Beat together, then pour into the dry',
        ingredients: [
          { id: 'chal-water', name: 'Warm water', grams: 140, isLiquid: true },
          { id: 'chal-eggs', name: 'Eggs', grams: 150, display: '3 large', isLiquid: true },
          { id: 'chal-yolk', name: 'Egg yolk', grams: 18, display: '1', isLiquid: true },
          { id: 'chal-oil', name: 'Vegetable oil', grams: 60 },
          { id: 'chal-honey', name: 'Honey', grams: 30 },
        ],
      },
      {
        id: 'chal-g-finish',
        title: 'To finish',
        kind: 'other',
        ingredients: [
          { id: 'chal-wash', name: 'Egg, beaten (wash)', grams: 50, display: '1' },
          { id: 'chal-seeds', name: 'Sesame or poppy seeds', grams: 0, display: 'to sprinkle' },
        ],
      },
    ],
    steps: [
      {
        id: 'chal-s1',
        text: 'Whisk the dry ingredients. Add the wet and mix to a shaggy dough.',
        ingredientIds: ['chal-flour', 'chal-sugar', 'chal-yeast', 'chal-salt', 'chal-water', 'chal-eggs', 'chal-yolk', 'chal-oil', 'chal-honey'],
        photoIds: [],
      },
      {
        id: 'chal-s2',
        text: 'Knead on medium for 8–10 minutes until smooth, elastic, and slightly tacky.',
        ingredientIds: [],
        photoIds: [],
      },
      {
        id: 'chal-s3',
        text: 'Cover and bulk-proof until doubled, about 1 hour 30 minutes in a warm spot.',
        ingredientIds: [],
        photoIds: [],
      },
      {
        id: 'chal-s4',
        text: 'Divide, roll six strands per loaf, and braid. Place on lined trays.',
        ingredientIds: [],
        photoIds: [],
      },
      {
        id: 'chal-s5',
        text: 'Proof the braided loaves until puffy, about 45 minutes. Heat the oven to 175°C.',
        ingredientIds: [],
        photoIds: [],
      },
      {
        id: 'chal-s6',
        text: 'Brush with egg wash, sprinkle seeds, and bake 25–30 minutes until deep golden and hollow-sounding.',
        ingredientIds: ['chal-wash', 'chal-seeds'],
        photoIds: [],
      },
    ],
  },
  {
    id: 'seed-babka',
    name: 'Chocolate Babka',
    category: 'Babka & Rogalach',
    yieldText: 'Two 9-inch loaves',
    tags: ['enriched', 'dairy', 'chocolate'],
    notes:
      'Dairy — keep separate from the pareve bakes.\n\nChill the dough hard before rolling or the butter leaks. Brush the warm syrup on the second they come out — that is what makes them glossy and keeps them moist for days.',
    createdAt: now - 1000,
    updatedAt: now - 1000,
    groups: [
      {
        id: 'bab-g-dry',
        title: 'Dough — dry',
        kind: 'dry',
        combine: 'Whisk together',
        ingredients: [
          { id: 'bab-flour', name: 'Bread flour', grams: 500, isFlour: true },
          { id: 'bab-sugar', name: 'Sugar', grams: 60 },
          { id: 'bab-yeast', name: 'Instant yeast', grams: 10, display: '1 tbsp' },
          { id: 'bab-salt', name: 'Fine salt', grams: 8 },
        ],
      },
      {
        id: 'bab-g-wet',
        title: 'Dough — wet',
        kind: 'wet',
        combine: 'Warm the milk slightly, then beat in eggs',
        ingredients: [
          { id: 'bab-milk', name: 'Whole milk', grams: 240, isLiquid: true },
          { id: 'bab-eggs', name: 'Eggs', grams: 100, display: '2 large', isLiquid: true },
          { id: 'bab-butter', name: 'Soft butter', grams: 110 },
        ],
      },
      {
        id: 'bab-g-fill',
        title: 'For the filling',
        kind: 'other',
        combine: 'Melt together until spreadable',
        ingredients: [
          { id: 'bab-choc', name: 'Dark chocolate', grams: 180 },
          { id: 'bab-fbutter', name: 'Butter', grams: 90 },
          { id: 'bab-cocoa', name: 'Cocoa powder', grams: 30 },
          { id: 'bab-fsugar', name: 'Icing sugar', grams: 70 },
        ],
      },
      {
        id: 'bab-g-syrup',
        title: 'Soaking syrup',
        kind: 'wet',
        combine: 'Boil 2 minutes, then cool',
        ingredients: [
          { id: 'bab-ssugar', name: 'Sugar', grams: 100 },
          { id: 'bab-swater', name: 'Water', grams: 80, isLiquid: true },
        ],
      },
    ],
    steps: [
      {
        id: 'bab-s1',
        text: 'Mix the dough, then knead in the soft butter until silky. Chill, covered, for 1 hour.',
        ingredientIds: ['bab-flour', 'bab-sugar', 'bab-yeast', 'bab-salt', 'bab-milk', 'bab-eggs', 'bab-butter'],
        photoIds: [],
      },
      {
        id: 'bab-s2',
        text: 'Roll into a rectangle, spread the filling, roll up tightly, then cut lengthwise and twist.',
        ingredientIds: ['bab-choc', 'bab-fbutter', 'bab-cocoa', 'bab-fsugar'],
        photoIds: [],
      },
      {
        id: 'bab-s3',
        text: 'Settle into loaf tins and proof until risen, about 1 hour 15 minutes. Heat oven to 180°C.',
        ingredientIds: [],
        photoIds: [],
      },
      {
        id: 'bab-s4',
        text: 'Bake 30 minutes until set. Brush generously with syrup while still hot.',
        ingredientIds: ['bab-ssugar', 'bab-swater'],
        photoIds: [],
        timerSeconds: 1800,
      },
    ],
  },
  {
    id: 'seed-cookies',
    name: 'Brown-Butter Chocolate Chip Cookies',
    category: 'Cookies',
    yieldText: 'About 24 cookies',
    tags: ['dairy', 'chocolate', 'crowd-pleaser'],
    notes:
      'The two-bowl method: everything dry in one bowl, everything wet in another. Rest the dough cold so they don’t spread thin.\n\nUnderbake by a minute — they set on the tray.',
    createdAt: now - 2000,
    updatedAt: now - 2000,
    groups: [
      {
        id: 'cook-g-dry',
        title: 'Dry bowl',
        kind: 'dry',
        combine: 'Whisk together',
        ingredients: [
          { id: 'cook-flour', name: 'Plain flour', grams: 280, isFlour: true },
          { id: 'cook-soda', name: 'Baking soda', grams: 5, display: '1 tsp' },
          { id: 'cook-salt', name: 'Salt', grams: 4 },
        ],
      },
      {
        id: 'cook-g-wet',
        title: 'Wet bowl',
        kind: 'wet',
        combine: 'Cream, then beat in eggs',
        ingredients: [
          { id: 'cook-butter', name: 'Browned butter, cooled', grams: 226 },
          { id: 'cook-brown', name: 'Brown sugar', grams: 200 },
          { id: 'cook-white', name: 'White sugar', grams: 100 },
          { id: 'cook-eggs', name: 'Eggs', grams: 100, display: '2 large', isLiquid: true },
          { id: 'cook-vanilla', name: 'Vanilla', grams: 0, display: '2 tsp' },
        ],
      },
      {
        id: 'cook-g-mix',
        title: 'Fold in',
        kind: 'other',
        ingredients: [{ id: 'cook-chips', name: 'Chocolate chips', grams: 320 }],
      },
    ],
    steps: [
      {
        id: 'cook-s1',
        text: 'Cream the butter and sugars, then beat in the eggs and vanilla until glossy.',
        ingredientIds: ['cook-butter', 'cook-brown', 'cook-white', 'cook-eggs', 'cook-vanilla'],
        photoIds: [],
      },
      {
        id: 'cook-s2',
        text: 'Fold in the dry bowl just until no streaks remain, then fold in the chips.',
        ingredientIds: ['cook-flour', 'cook-soda', 'cook-salt', 'cook-chips'],
        photoIds: [],
      },
      {
        id: 'cook-s3',
        text: 'Chill the dough for at least 30 minutes. Heat the oven to 190°C.',
        ingredientIds: [],
        photoIds: [],
      },
      {
        id: 'cook-s4',
        text: 'Scoop onto lined trays and bake 11–13 minutes until the edges set but centres look underdone.',
        ingredientIds: [],
        photoIds: [],
      },
    ],
  },
]
