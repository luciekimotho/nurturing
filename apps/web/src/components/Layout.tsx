import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/food', label: 'Food', icon: '🥗' },
  { to: '/workouts', label: 'Workouts', icon: '💪' },
  { to: '/cycle', label: 'Cycle', icon: '🌙' },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-stone-800 text-lg tracking-tight">nurturing</span>
          <nav className="flex gap-1">
            {navItems.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-rose-50 text-rose-700'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                  }`
                }
              >
                <span>{icon}</span>
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
