import { useState, useEffect } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

const STORAGE_KEY = 'your-voice-bg-color'
const DEFAULT_COLOR = '#f8fafc'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const [bgColor, setBgColor] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_COLOR
  })
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const activeTab = location.pathname === '/settings' ? 'settings' : 'home'

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, bgColor)
  }, [bgColor])

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
    >
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => navigate(tab === 'settings' ? '/settings' : '/')}
        expanded={sidebarExpanded}
        onExpandToggle={() => setSidebarExpanded((e) => !e)}
      />

      <main
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          sidebarExpanded ? 'pl-[200px]' : 'pl-14'
        }`}
      >
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex flex-col items-center pt-12 px-6">
                <h1
                  className="font-bubbly font-black text-6xl md:text-8xl lg:text-9xl text-slate-800 tracking-tight"
                  style={{
                    textShadow:
                      '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white, 1px 1px 0 white, 0 0 6px white, 0 0 12px white',
                  }}
                >
                  YOUR VOICE
                </h1>
                <p className="mt-6 text-center text-base text-slate-600">
                  The personalized content generator that learns who you are
                </p>
                <div className="mt-12 flex flex-row items-center justify-center gap-3">
                  <span className="text-min font-medium text-slate-600">
                    Personalize your color
                  </span>
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-16 w-16 cursor-pointer rounded-full border-4 border-white shadow-xl transition-transform hover:scale-105"
                    title="Choose your background color"
                  />
                </div>
              </div>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
