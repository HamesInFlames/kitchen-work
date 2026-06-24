// Adjustable text size — "great for reading recipes across the kitchen".
// All UI sizing is rem-based, so changing the root font-size scales everything.

const KEY = 'tova-text-scale'

export interface TextSize {
  px: number
  label: string
}

export const TEXT_SIZES: ReadonlyArray<TextSize> = [
  { px: 15, label: 'S' },
  { px: 16, label: 'M' },
  { px: 18, label: 'L' },
  { px: 20, label: 'XL' },
  { px: 22, label: 'XXL' },
]

const DEFAULT_PX = 16

export function getStoredScale(): number {
  const raw = Number(localStorage.getItem(KEY))
  return TEXT_SIZES.some((s) => s.px === raw) ? raw : DEFAULT_PX
}

export function setStoredScale(px: number): void {
  localStorage.setItem(KEY, String(px))
  applyScale(px)
}

export function applyScale(px: number): void {
  document.documentElement.style.fontSize = `${px}px`
}

/** Call once at startup before first paint to avoid a flash at the default size. */
export function applyStoredTextScale(): void {
  applyScale(getStoredScale())
}
