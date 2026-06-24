// Display formatters. Grams-first, with thousands separators so big bakery
// batches stay readable.
import { roundGrams } from './recipeMath'

export function formatGrams(g: number): string {
  if (!isFinite(g)) return '—'
  const rounded = roundGrams(g)
  const str = rounded.toLocaleString(undefined, {
    maximumFractionDigits: g < 20 ? 1 : 0,
  })
  return `${str} g`
}

export function formatPercent(p: number | null, digits = 1): string {
  if (p === null || !isFinite(p)) return '—'
  return `${p.toLocaleString(undefined, { maximumFractionDigits: digits })}%`
}

/** Seconds → "M:SS" or "H:MM:SS". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes)
  const ss = String(seconds).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`
}

/** A short human label like "12 min" / "1 h 30 m" for chips. */
export function humanizeDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const parts: string[] = []
  if (h) parts.push(`${h} h`)
  if (m) parts.push(`${m} min`)
  if (sec && !h) parts.push(`${sec} s`)
  return parts.join(' ') || '0 s'
}

export function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const day = 86_400_000
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`
  if (diff < day) return `${Math.floor(diff / 3_600_000)} h ago`
  if (diff < 7 * day) return `${Math.floor(diff / day)} d ago`
  return new Date(ts).toLocaleDateString()
}
