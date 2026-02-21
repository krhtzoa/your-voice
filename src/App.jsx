import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase.js'
import { useAuth } from './contexts/AuthContext.jsx'
import OnboardingGate from './components/OnboardingGate.jsx'
import Sidebar from './components/Sidebar.jsx'
import AccountPage from './pages/AccountPage.jsx'
import HomePage from './pages/HomePage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'

const STORAGE_KEY = 'your-voice-bg-color'
const DEFAULT_COLOR = '#f8fafc'

function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [bgColor, setBgColor] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_COLOR
  })
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  const activeTab =
    location.pathname === '/account'
      ? 'account'
      : location.pathname === '/profile'
        ? 'profile'
        : 'home'

  const setColorFromServer = useCallback((color) => {
    const hex = color || DEFAULT_COLOR
    setBgColor(hex)
    localStorage.setItem(STORAGE_KEY, hex)
  }, [])

  const updateBgColor = useCallback(
    (color) => {
      const hex = color || DEFAULT_COLOR
      setBgColor(hex)
      localStorage.setItem(STORAGE_KEY, hex)
      if (supabase && user?.id) {
        supabase
          .from('profiles')
          .update({
            favorite_color: hex,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .then(() => {})
      }
    },
    [user?.id]
  )

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
        onTabChange={(tab) => {
          if (tab === 'account') navigate('/account')
          else if (tab === 'profile') navigate('/profile')
          else navigate('/')
        }}
        expanded={sidebarExpanded}
        onExpandToggle={() => setSidebarExpanded((e) => !e)}
      />

      <main
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          sidebarExpanded ? 'pl-[200px]' : 'pl-14'
        }`}
      >
        <OnboardingGate
          onColorChange={setColorFromServer}
          onColorUpdate={updateBgColor}
          homeElement={<HomePage />}
          profileElement={<ProfilePage />}
          accountElement={
            <AccountPage bgColor={bgColor} onColorChange={updateBgColor} />
          }
        />
      </main>
    </div>
  )
}

export default App
