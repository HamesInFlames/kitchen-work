import { Link, Outlet } from 'react-router-dom'
import { BookIcon, PlusIcon, GearIcon } from './icons'
import { InstallBanner } from './InstallBanner'

/** App chrome for all normal pages. Bake mode renders full-screen outside this. */
export function Layout() {
  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-safe pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <Link to="/" className="no-tap-highlight flex items-center gap-2">
            <span className="text-gold">
              <BookIcon size={26} />
            </span>
            <span className="font-recipe text-xl leading-none text-ink">
              Tova’s <span className="text-ink-soft">Recipes</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/new"
              aria-label="New recipe"
              className="min-tap flex items-center justify-center rounded-xl text-ink-soft hover:text-gold"
            >
              <PlusIcon />
            </Link>
            <Link
              to="/settings"
              aria-label="Settings"
              className="min-tap flex items-center justify-center rounded-xl text-ink-soft hover:text-gold"
            >
              <GearIcon />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-safe pb-28 pt-3">
        <InstallBanner />
        <Outlet />
      </main>
    </div>
  )
}
