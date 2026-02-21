import { useAuth } from '../contexts/AuthContext.jsx'

const ICONS = {
  home: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  script: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  ),
  voice: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" x2="12" y1="19" y2="23" />
      <line x1="8" x2="16" y1="23" y2="23" />
    </svg>
  ),
  niche: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <line x1="8" x2="16" y1="7" y2="7" />
      <line x1="8" x2="16" y1="11" y2="11" />
    </svg>
  ),
  profile: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  account: (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  chevron: (expanded) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
}

const NAV_ITEMS = [
  { id: 'home', icon: 'home', label: 'Home' },
  { id: 'script', icon: 'script', label: 'Script' },
  { id: 'voice', icon: 'voice', label: 'Voice' },
  { id: 'niche', icon: 'niche', label: 'Niche' },
  { id: 'profile', icon: 'profile', label: 'Profile' },
  { id: 'account', icon: 'account', label: 'Account' },
]

export default function Sidebar({ activeTab, onTabChange, expanded, onExpandToggle }) {
  const { user, signOut, isConfigured } = useAuth()

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-700/50 bg-slate-900 transition-all duration-300 ease-in-out ${
        expanded ? 'w-[200px]' : 'w-14'
      }`}
    >
      <nav className="flex flex-1 flex-col gap-1 p-2 pt-16">
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-white transition-colors hover:bg-slate-800 hover:text-white ${
              activeTab === id ? 'bg-slate-800 font-medium text-white' : ''
            }`}
            title={label}
          >
            <span className="flex shrink-0 text-white">{ICONS[icon]}</span>
            {expanded && (
              <span className="whitespace-nowrap text-min text-white">{label}</span>
            )}
          </button>
        ))}
      </nav>

      {expanded && isConfigured && user && (
        <div className="border-t border-slate-700/50 px-3 py-4">
          <h3 className="text-min font-semibold text-white">Account</h3>
          <p className="mt-1 truncate text-min text-white/80">
            {user?.email}
          </p>
          <button
            onClick={() => signOut()}
            className="mt-3 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-min font-medium text-white transition-colors hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      )}

      <button
        onClick={onExpandToggle}
        className="mb-4 flex items-center justify-center gap-2 self-center rounded-lg px-3 py-2 text-white/80 transition-colors hover:bg-slate-800 hover:text-white"
        title={expanded ? 'Collapse' : 'Expand'}
      >
        {ICONS.chevron(expanded)}
        {expanded && <span className="text-min">Collapse</span>}
      </button>
    </aside>
  )
}
