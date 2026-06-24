// Dedicated worker that keeps multiple kitchen timers ticking accurately even
// when the tab is throttled in the background. It computes remaining time from
// wall-clock deltas (endAt - now) rather than counting interval fires, so drift
// can't accumulate. The main thread owns sound/notification on 'done'.

interface TimerRec {
  label: string
  endAt: number
  total: number
}

type InMsg =
  | { type: 'start'; id: string; label: string; seconds: number }
  | { type: 'cancel'; id: string }
  | { type: 'cancelAll' }
  | { type: 'addTime'; id: string; seconds: number }

interface TimerSnapshot {
  id: string
  label: string
  remaining: number
  total: number
  endAt: number
}

type OutMsg =
  | { type: 'tick'; timers: TimerSnapshot[] }
  | { type: 'done'; id: string; label: string }

// Avoid pulling in the WebWorker lib (which collides with DOM types in the app
// tsconfig) by casting the worker globals to the minimal shapes we use.
const ctx = self as unknown as {
  postMessage(msg: OutMsg): void
  onmessage: ((e: MessageEvent<InMsg>) => void) | null
}

const timers = new Map<string, TimerRec>()
let interval: ReturnType<typeof setInterval> | null = null

function ensureLoop(): void {
  if (interval === null && timers.size > 0) {
    interval = setInterval(tick, 250)
  }
}

function stopLoopIfIdle(): void {
  if (interval !== null && timers.size === 0) {
    clearInterval(interval)
    interval = null
  }
}

function snapshot(now: number): TimerSnapshot[] {
  const out: TimerSnapshot[] = []
  for (const [id, t] of timers) {
    out.push({
      id,
      label: t.label,
      remaining: Math.max(0, Math.round((t.endAt - now) / 1000)),
      total: t.total,
      endAt: t.endAt,
    })
  }
  return out.sort((a, b) => a.remaining - b.remaining)
}

function tick(): void {
  const now = Date.now()
  const finished: Array<{ id: string; label: string }> = []
  for (const [id, t] of timers) {
    if (t.endAt <= now) finished.push({ id, label: t.label })
  }
  for (const f of finished) {
    timers.delete(f.id)
    ctx.postMessage({ type: 'done', id: f.id, label: f.label })
  }
  ctx.postMessage({ type: 'tick', timers: snapshot(now) })
  stopLoopIfIdle()
}

ctx.onmessage = (e: MessageEvent<InMsg>) => {
  const msg = e.data
  const now = Date.now()
  switch (msg.type) {
    case 'start': {
      const total = Math.max(1, Math.round(msg.seconds))
      timers.set(msg.id, { label: msg.label, endAt: now + total * 1000, total })
      ensureLoop()
      ctx.postMessage({ type: 'tick', timers: snapshot(now) })
      break
    }
    case 'addTime': {
      const t = timers.get(msg.id)
      if (t) {
        t.endAt += Math.round(msg.seconds) * 1000
        t.total += Math.round(msg.seconds)
      }
      ctx.postMessage({ type: 'tick', timers: snapshot(now) })
      break
    }
    case 'cancel': {
      timers.delete(msg.id)
      stopLoopIfIdle()
      ctx.postMessage({ type: 'tick', timers: snapshot(now) })
      break
    }
    case 'cancelAll': {
      timers.clear()
      stopLoopIfIdle()
      ctx.postMessage({ type: 'tick', timers: [] })
      break
    }
  }
}
