import { AnimatePresence, motion } from 'motion/react'
import { useTimers } from '../context/TimerContext'
import { formatDuration } from '../lib/format'
import { TimerIcon, CloseIcon, PlusIcon, BellIcon } from './icons'

// Persistent heads-up display: active timers stay visible while you keep using
// the app, and finished timers ring + stick around until dismissed.
export function TimerHud() {
  const { timers, finished, cancel, addTime, dismissFinished } = useTimers()

  if (timers.length === 0 && finished.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex flex-col items-center gap-2 px-3 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <AnimatePresence initial={false}>
        {finished.map((f) => (
          <motion.div
            key={`done-${f.id}`}
            layout
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-gold bg-gold px-4 py-3 text-black shadow-lg"
            role="alert"
          >
            <BellIcon size={22} />
            <span className="flex-1 font-semibold">{f.label} — time’s up</span>
            <button
              type="button"
              onClick={() => dismissFinished(f.id)}
              className="rounded-full bg-black/10 p-1.5"
              aria-label="Dismiss"
            >
              <CloseIcon size={18} />
            </button>
          </motion.div>
        ))}

        {timers.map((t) => {
          const pct = t.total > 0 ? Math.max(0, Math.min(100, (t.remaining / t.total) * 100)) : 0
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="pointer-events-auto flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl border border-line bg-surface/95 px-4 py-2.5 shadow-lg backdrop-blur"
            >
              <TimerIcon size={20} className="text-gold" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-ink-soft">{t.label}</span>
                  <span className="text-xl font-bold tabular-nums text-ink">
                    {formatDuration(t.remaining)}
                  </span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <button
                type="button"
                onClick={() => addTime(t.id, 60)}
                className="shrink-0 rounded-lg border border-line px-2 py-1 text-xs font-semibold text-ink-soft"
                aria-label={`Add one minute to ${t.label}`}
              >
                <span className="flex items-center gap-0.5">
                  <PlusIcon size={13} />
                  1:00
                </span>
              </button>
              <button
                type="button"
                onClick={() => cancel(t.id)}
                className="shrink-0 rounded-full bg-line/60 p-1.5 text-ink-soft"
                aria-label={`Cancel ${t.label} timer`}
              >
                <CloseIcon size={16} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
