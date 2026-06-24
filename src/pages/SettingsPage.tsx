import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTextScale } from '../hooks/useTextScale'
import { usePersistentStorage } from '../hooks/usePersistentStorage'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useTimers } from '../context/TimerContext'
import { TEXT_SIZES } from '../lib/textScale'
import { downloadBackup, restoreFromFile } from '../lib/backup'
import {
  ArrowLeftIcon,
  TextSizeIcon,
  DownloadIcon,
  UploadIcon,
  BellIcon,
  CheckIcon,
} from '../components/icons'

export function SettingsPage() {
  const { px, set } = useTextScale()
  const persist = usePersistentStorage()
  const { canInstall, promptInstall, installed } = useInstallPrompt()
  const { notificationPermission, requestNotifications } = useTimers()
  const [message, setMessage] = useState<string | null>(null)

  const onImport = async (file: File) => {
    try {
      const count = await restoreFromFile(file)
      setMessage(`Restored ${count} recipe${count === 1 ? '' : 's'}. Reloading…`)
      window.setTimeout(() => window.location.reload(), 900)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not import that file.')
    }
  }

  return (
    <div className="pb-6">
      <Link
        to="/"
        className="mb-3 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-gold"
      >
        <ArrowLeftIcon size={18} /> Cookbook
      </Link>
      <h1 className="mb-5 font-recipe text-3xl text-ink">Settings</h1>

      {/* Text size */}
      <Section icon={<TextSizeIcon size={20} />} title="Text size">
        <p className="mb-3 text-sm text-ink-soft">
          Bigger text reads more easily across the kitchen.
        </p>
        <div className="flex gap-2">
          {TEXT_SIZES.map((sz) => (
            <button
              key={sz.px}
              type="button"
              onClick={() => set(sz.px)}
              aria-pressed={px === sz.px}
              aria-label={`${sz.label} text size`}
              className={`flex-1 rounded-xl border py-3 font-semibold transition-colors ${
                px === sz.px
                  ? 'border-gold bg-gold text-black'
                  : 'border-line bg-surface-2 text-ink'
              }`}
              style={{ fontSize: `${sz.px}px` }}
            >
              {sz.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Install / durability */}
      <Section icon={<DownloadIcon size={20} />} title="Install & data safety">
        <p className="mb-3 text-sm text-ink-soft">
          Installing to the home screen is what keeps your recipes from being deleted on iOS and
          lets the screen stay awake while baking.
        </p>
        <StatusRow
          label="Installed to home screen"
          ok={installed}
          okText="Yes"
          notText="Not yet"
        />
        <StatusRow
          label="Storage marked persistent"
          ok={persist === 'persisted'}
          okText="Protected"
          notText={persist === 'unsupported' ? 'Not supported' : 'Best effort'}
        />
        {!installed && canInstall && (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="mt-3 min-h-11 rounded-xl bg-gold px-4 font-semibold text-black"
          >
            Install app
          </button>
        )}
      </Section>

      {/* Notifications */}
      <Section icon={<BellIcon size={20} />} title="Timer alerts">
        <p className="mb-3 text-sm text-ink-soft">
          Notifications work best on Android and desktop. On iOS, keep the app open while baking — the
          chime and on-screen banner are reliable there; background alerts are not.
        </p>
        <StatusRow
          label="Notifications"
          ok={notificationPermission === 'granted'}
          okText="On"
          notText={notificationPermission === 'denied' ? 'Blocked' : 'Off'}
        />
        {notificationPermission !== 'granted' && notificationPermission !== 'unsupported' && (
          <button
            type="button"
            onClick={() => void requestNotifications()}
            className="mt-3 min-h-11 rounded-xl border border-line px-4 font-semibold text-ink"
          >
            Enable notifications
          </button>
        )}
      </Section>

      {/* Backup */}
      <Section icon={<UploadIcon size={20} />} title="Backup & restore">
        <p className="mb-3 text-sm text-ink-soft">
          Export everything (recipes, notes, photos) to a single file you control. No lock-in.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void downloadBackup()}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-line px-4 font-semibold text-ink"
          >
            <DownloadIcon size={18} /> Export backup
          </button>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-line px-4 font-semibold text-ink">
            <UploadIcon size={18} /> Import backup
            <input
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void onImport(file)
                e.target.value = ''
              }}
            />
          </label>
        </div>
        {message && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-gold">
            <CheckIcon size={16} /> {message}
          </p>
        )}
      </Section>

      <p className="mt-6 text-center text-xs text-ink-faint">
        Tova’s Bakery · Recipe Book — local-first PWA. Built by Kim Consultant.
      </p>
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-4 rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-2 flex items-center gap-2 font-recipe text-xl text-ink">
        <span className="text-gold">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function StatusRow({
  label,
  ok,
  okText,
  notText,
}: {
  label: string
  ok: boolean
  okText: string
  notText: string
}) {
  return (
    <div className="flex items-center justify-between border-t border-line/60 py-2 first:border-t-0">
      <span className="text-ink-soft">{label}</span>
      <span className={`text-sm font-semibold ${ok ? 'text-ok' : 'text-ink-faint'}`}>
        {ok ? okText : notText}
      </span>
    </div>
  )
}
