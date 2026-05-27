// src/App.tsx
// PDX-28: Top-level app shell. Routes between GameSelector, GameView, and Lab.
// PDX-55: blindMode applies to game selection only — masks final scores on cards.
// PDX-66: View discriminated union replaces selectedGameId binary state.

import { useState } from 'react'
import { GameSelector } from './components/GameSelector'
import { GameView } from './components/GameView'
import { Lab } from './components/Lab'

type View =
  | { mode: 'selector' }
  | { mode: 'game'; gameId: string }
  | { mode: 'lab' }

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
  const [view, setView] = useState<View>({ mode: 'selector' })
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

  if (view.mode === 'game') {
    return (
      <GameView
        gameId={view.gameId}
        onBack={() => setView({ mode: 'selector' })}
      />
    )
  }

  if (view.mode === 'lab') {
    return <Lab onBack={() => setView({ mode: 'selector' })} />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="px-6 py-5 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          clock-gate <span className="text-blue-400 font-mono text-lg">UI</span>
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView({ mode: 'lab' })}
            className="text-xs font-mono px-3 py-1.5 rounded transition bg-purple-700 text-gray-100 hover:bg-purple-600"
          >
            The Lab
          </button>
          <BlindModeButton blindMode={blindMode} onToggle={toggleBlindMode} />
        </div>
      </header>
      <GameSelector
        onSelect={(gameId) => setView({ mode: 'game', gameId })}
        blindMode={blindMode}
      />
    </div>
  )
}

export default App
