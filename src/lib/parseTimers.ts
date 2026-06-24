// Detect cookable durations inside step text so we can offer a one-tap
// "Start 12:00" chip — and auto-name the timer from the step's action verb
// (Crouton-style self-naming timers: "Bake", "Proof", "Chill"…).

export interface ParsedTimer {
  seconds: number
  /** The matched source text, e.g. "20–25 minutes". */
  raw: string
  /** Auto-generated name from the step's action verb. */
  label: string
  /** True when the source was a range; we set the timer to the LOWER bound (check early). */
  isRange: boolean
}

const ACTION_WORDS: ReadonlyArray<[RegExp, string]> = [
  [/\bbak(e|ing)\b/i, 'Bake'],
  [/\bproof(ing)?\b/i, 'Proof'],
  [/\b(prove|proving)\b/i, 'Prove'],
  [/\b(rest|resting)\b/i, 'Rest'],
  [/\b(rise|rising)\b/i, 'Rise'],
  [/\b(ferment|fermenting|bulk)\b/i, 'Ferment'],
  [/\b(chill|chilling|refrigerat)/i, 'Chill'],
  [/\b(cool|cooling)\b/i, 'Cool'],
  [/\b(knead|kneading)\b/i, 'Knead'],
  [/\b(mix|mixing|whisk|beat)\b/i, 'Mix'],
  [/\b(boil|boiling)\b/i, 'Boil'],
  [/\b(simmer|simmering)\b/i, 'Simmer'],
  [/\b(roast|roasting)\b/i, 'Roast'],
  [/\b(fry|frying|sauté|saute)\b/i, 'Fry'],
  [/\b(steep|steeping|soak|soaking)\b/i, 'Steep'],
  [/\b(marinat)/i, 'Marinate'],
  [/\b(set|setting)\b/i, 'Set'],
]

function unitSeconds(unit: string): number {
  const u = unit.toLowerCase()
  if (u.startsWith('h')) return 3600
  if (u.startsWith('s')) return 1
  return 60 // m / min / minute
}

function labelFor(text: string): string {
  for (const [re, label] of ACTION_WORDS) if (re.test(text)) return label
  return 'Timer'
}

/** The auto-name for a timer derived from a step's action verb ("Bake", "Proof"…). */
export function actionLabel(text: string): string {
  return labelFor(text)
}

const COMBO_RE =
  /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\s*(?:and\s+)?(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|min|m)\b/gi

const SINGLE_RE =
  /(\d+(?:\.\d+)?)(?:\s*(?:[–—-]|to)\s*(\d+(?:\.\d+)?))?\s*(hours?|hrs?|h|minutes?|mins?|min|m|seconds?|secs?|sec|s)\b/gi

/** Find every distinct timer in a piece of step text. */
export function parseTimers(text: string): ParsedTimer[] {
  if (!text) return []
  const label = labelFor(text)
  const results: ParsedTimer[] = []
  const taken: Array<[number, number]> = []

  // Pass 1: "1 hour 30 minutes" style combos win over their parts.
  for (const m of text.matchAll(COMBO_RE)) {
    const start = m.index ?? 0
    taken.push([start, start + m[0].length])
    const seconds = parseFloat(m[1]) * 3600 + parseFloat(m[2]) * 60
    if (seconds > 0) results.push({ seconds, raw: m[0].trim(), label, isRange: false })
  }

  // Pass 2: single units, optionally a range. Skip anything inside a combo span.
  for (const m of text.matchAll(SINGLE_RE)) {
    const start = m.index ?? 0
    const end = start + m[0].length
    if (taken.some(([s, e]) => start < e && end > s)) continue
    const lower = parseFloat(m[1])
    const isRange = m[2] !== undefined
    const seconds = lower * unitSeconds(m[3])
    if (seconds > 0) results.push({ seconds, raw: m[0].trim(), label, isRange })
  }

  // De-duplicate identical durations, keeping source order so chips read in the
  // same order as the step text and the first-mentioned time stays primary.
  const seen = new Set<number>()
  return results.filter((t) => (seen.has(t.seconds) ? false : (seen.add(t.seconds), true)))
}
