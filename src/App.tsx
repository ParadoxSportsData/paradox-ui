// src/App.tsx
// PDX-28: Top-level app shell. Routes between GameSelector, GameView, and Lab.
// PDX-55: blindMode applies to game selection only — masks final scores on cards.
// PDX-66: View discriminated union replaces selectedGameId binary state.
// PDX-86: Hash-based routing — each view maps to a URL hash so browser back/forward work.

import { useState, useEffect } from 'react'
import { GameSelector } from './components/GameSelector'
import { GameView } from './components/GameView'
import { Lab } from './components/Lab'

type View =
  | { mode: 'selector' }
  | { mode: 'game'; gameId: string }
  | { mode: 'lab' }

function parseUrl(): View {
  const hash = window.location.hash
  if (hash.startsWith('#/game/')) {
    const gameId = decodeURIComponent(hash.slice(7))
    if (gameId) return { mode: 'game', gameId }
  }
  if (hash === '#/lab') return { mode: 'lab' }
  return { mode: 'selector' }
}

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
  const [view, setView] = useState<View>(parseUrl)
  const [blindMode, setBlindMode] = useState(
    () => localStorage.getItem('blindMode') === 'true'
  )

  // Sync React state with browser back/forward navigation.
  useEffect(() => {
    const onPop = () => setView(parseUrl())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function navigate(newView: View) {
    const url =
      newView.mode === 'game' ? `#/game/${encodeURIComponent(newView.gameId)}`
      : newView.mode === 'lab' ? '#/lab'
      : '/'
    window.history.pushState(null, '', url)
    setView(newView)
  }

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
        onBack={() => navigate({ mode: 'selector' })}
        onGoToLab={() => navigate({ mode: 'lab' })}
      />
    )
  }

  if (view.mode === 'lab') {
    return <Lab onBack={() => navigate({ mode: 'selector' })} />
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="px-6 py-5 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Paradox
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate({ mode: 'lab' })}
            className="text-xs font-mono px-3 py-1.5 rounded transition bg-purple-700 text-gray-100 hover:bg-purple-600"
          >
            The Lab
          </button>
          <BlindModeButton blindMode={blindMode} onToggle={toggleBlindMode} />
        </div>
      </header>
      <GameSelector
        onSelect={(gameId) => navigate({ mode: 'game', gameId })}
        blindMode={blindMode}
      />
    </div>
  )
}

export default App
