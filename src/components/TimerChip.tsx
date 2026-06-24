import { useState } from 'react'
import { useTimers } from '../context/TimerContext'
import { formatDuration } from '../lib/format'
import { TimerIcon, CheckIcon } from './icons'

interface Props {
  label: string
  seconds: number
  /** Source was a range — we start at the lower bound and show a "+". */
  isRange?: boolean
  big?: boolean
}

/** One-tap "Start 12:00" chip that launches a named timer into the global HUD. */
export function TimerChip({ label, seconds, isRange, big }: Props) {
  const { start } = useTimers()
  const [started, setStarted] = useState(false)

  const go = () => {
    start(label, seconds)
    setStarted(true)
    window.setTimeout(() => setStarted(false), 1600)
  }

  return (
    <button
      type="button"
      onClick={go}
      className={`inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 font-semibold text-gold transition-colors hover:bg-gold/20 active:scale-[0.98] ${
        big ? 'min-h-12 px-4 text-lg' : 'px-3 py-1.5 text-sm'
      }`}
      aria-label={`Start a ${label.toLowerCase()} timer for ${formatDuration(seconds)}`}
      title={`Start a ${label.toLowerCase()} timer for ${formatDuration(seconds)}`}
    >
      {started ? <CheckIcon size={big ? 20 : 16} /> : <TimerIcon size={big ? 20 : 16} />}
      {started ? 'Started' : `${label} ${formatDuration(seconds)}${isRange ? '+' : ''}`}
    </button>
  )
}
