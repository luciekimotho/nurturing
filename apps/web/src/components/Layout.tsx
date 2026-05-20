import { NavLink, Outlet } from 'react-router-dom'
import { SignedIn, UserButton } from '@clerk/clerk-react'
import { isClerkAuth } from '../lib/auth'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/food', label: 'Food', icon: '🥗' },
  { to: '/workouts', label: 'Workouts', icon: '💪' },
  { to: '/cycle', label: 'Cycle', icon: '🌙' },
]

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col page-enter relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(182,73,47,0.16)_0,transparent_36%),radial-gradient(circle_at_78%_24%,rgba(31,106,88,0.18)_0,transparent_30%)]" />
      {/* Top nav */}
      <header className="sticky top-0 z-10 backdrop-blur-sm border-b border-[var(--line)]/70 bg-[#f8f2e8]/85">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-[var(--ink)] text-2xl tracking-tight [font-family:var(--heading-font)]">Nurturing</span>
          <div className="flex items-center gap-2">
            <nav className="flex gap-1 p-1 rounded-xl bg-white/65 border border-[var(--line)]">
              {navItems.map(({ to, label, icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--brand-soft)] text-[var(--brand)]'
                        : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[#f1e7d8]'
                    }`
                  }
                >
                  <span>{icon}</span>
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
            </nav>
            {isClerkAuth && (
              <SignedIn>
                <UserButton afterSignOutUrl="/sign-in" />
              </SignedIn>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="relative z-1 flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
