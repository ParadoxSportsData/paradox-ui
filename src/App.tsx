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

// Clock face with a probability S-curve cutting through it.
// Circle = game clock; curve = win probability arc over time.
function ParadoxIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" stroke="#64748b" strokeWidth="1.5" />
      <line x1="12" y1="3"  x2="12" y2="5.2" stroke="#64748b" strokeWidth="1.5" />
      <line x1="21" y1="12" x2="18.8" y2="12" stroke="#64748b" strokeWidth="1.5" />
      <line x1="12" y1="21" x2="12" y2="18.8" stroke="#64748b" strokeWidth="1.5" />
      <line x1="3"  y1="12" x2="5.2" y2="12" stroke="#64748b" strokeWidth="1.5" />
      {/* Rising probability S-curve — blue accent, clips naturally at clock edge */}
      <path d="M4 16.5 C7.5 16.5, 9.5 12, 12 12 C14.5 12, 16.5 7.5, 20 7.5"
        stroke="#60a5fa" strokeWidth="1.75" fill="none" />
    </svg>
  )
}

function BlindModeButton({ blindMode, onToggle }: { blindMode: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`text-xs font-mono px-3 py-1.5 rounded-md border transition-colors ${
        blindMode
          ? 'border-amber-500/60 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
          : 'border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'
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
      <header className="px-6 py-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ParadoxIcon />
          <span className="text-base font-mono font-bold tracking-[0.22em] text-white uppercase">
            Paradox
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ mode: 'lab' })}
            className="text-xs font-mono px-3 py-1.5 rounded-md border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors"
          >
            The Lab
          </button>
          <div className="w-px h-4 bg-gray-700" />
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
