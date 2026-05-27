// src/App.tsx
// PDX-28: Top-level app shell. Routes between GameSelector list view and GameView.
// No router library — single selectedGameId state drives the two-screen flow.
// PDX-55: blindMode state lifted here so it persists across game selection and game view.

import { useState } from 'react'
import { GameSelector } from './components/GameSelector'
import { GameView } from './components/GameView'

function BlindModeButton({ blindMode, onToggle }: { blindMode: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`text-xs font-mono px-3 py-1.5 rounded transition ${
        blindMode
          ? 'bg-amber-500 text-gray-950 font-semibold hover:bg-amber-400'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {blindMode ? 'Reveal Scores' : 'Blind Mode'}
    </button>
  )
}

function App() {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [blindMode, setBlindMode] = useState(
    () => localStorage.getItem('blindMode') === 'true'
  )

  function toggleBlindMode() {
    setBlindMode(prev => {
      const next = !prev
      localStorage.setItem('blindMode', String(next))
      return next
    })
  }

  if (selectedGameId) {
    return (
      <GameView
        gameId={selectedGameId}
        onBack={() => setSelectedGameId(null)}
        blindMode={blindMode}
        onToggleBlindMode={toggleBlindMode}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="px-6 py-5 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          clock-gate <span className="text-blue-400 font-mono text-lg">UI</span>
        </h1>
        <BlindModeButton blindMode={blindMode} onToggle={toggleBlindMode} />
      </header>
      <GameSelector onSelect={setSelectedGameId} blindMode={blindMode} />
    </div>
  )
}

export default App
