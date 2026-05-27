import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import { isClerkAuth } from '../lib/auth'

const navItems = [
  { to: '/dashboard', label: 'Home' },
  { to: '/food', label: 'Food' },
  { to: '/workouts', label: 'Move' },
  { to: '/cycle', label: 'Cycle' },
]

export default function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col page-enter relative overflow-hidden app-shell">
      <div className="grain" />
      <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_22%_18%,rgba(184,111,77,0.22)_0,transparent_38%),radial-gradient(circle_at_82%_18%,rgba(186,156,109,0.3)_0,transparent_35%)]" />
      {/* Top nav */}
      <header className="sticky top-0 z-20 backdrop-blur-sm border-b border-[var(--line)]/80 bg-[#f8efe3]/85">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-[var(--ink)] text-2xl tracking-tight [font-family:var(--heading-font)]">Nurturing</p>
            <p className="text-[11px] text-[var(--muted)] uppercase tracking-[0.18em]">Daily rhythm companion</p>
          </div>
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex gap-1.5 p-1 rounded-2xl bg-white/70 border border-[var(--line)] shadow-[0_8px_22px_-18px_rgba(94,56,32,0.6)]">
              {navItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[var(--brand-soft)] text-[var(--brand-strong)]'
                        : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[#f1e3d4]'
                    }`
                  }
                >
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-white/75 p-2 text-[var(--ink)]"
              aria-expanded={isMenuOpen}
              aria-label="Open navigation menu"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                <path d="M4 6.5H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M4 17.5H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            {isClerkAuth && (
              <SignedIn>
                <UserButton afterSignOutUrl="/sign-in" />
              </SignedIn>
            )}
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden border-t border-[var(--line)]/70 bg-[#f8efe3]/95">
            <div className="max-w-5xl mx-auto px-4 py-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-xl border border-[var(--line)] bg-white/80 p-2 text-[var(--ink)]"
                aria-label="Close navigation menu"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                  <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <nav className="max-w-5xl mx-auto px-4 pb-3 grid gap-1">
              {navItems.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[var(--brand-soft)] text-[var(--brand-strong)]'
                        : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[#f1e3d4]'
                    }`
                  }
                >
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
