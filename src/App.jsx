import { useState, useEffect } from 'react'

const STORAGE_KEY = 'your-voice-bg-color'
const DEFAULT_COLOR = '#f8fafc'

function App() {
  const [bgColor, setBgColor] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_COLOR
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, bgColor)
  }, [bgColor])

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex flex-col items-center pt-12 px-6">
        <h1 className="font-bubbly font-black text-6xl md:text-8xl lg:text-9xl text-slate-800 mb-12 tracking-tight drop-shadow-sm">
          YOUR VOICE
        </h1>

        <div className="flex flex-col items-center gap-4">
          <label className="text-sm font-medium text-slate-600">
            Pick your color — make it yours
          </label>
          <input
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            className="w-24 h-24 rounded-full cursor-pointer border-4 border-white shadow-xl hover:scale-105 transition-transform"
            title="Choose your background color"
          />
        </div>
      </div>
    </div>
  )
}

export default App
