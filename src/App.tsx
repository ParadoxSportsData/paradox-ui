// src/App.tsx
// PDX-28: Top-level app shell. Routes between GameSelector, GameView, and Lab.
// PDX-55: blindMode applies to game selection only — masks final scores on cards.
// PDX-66: View discriminated union replaces selectedGameId binary state.
// PDX-86: Hash-based routing — each view maps to a URL hash so browser back/forward work.
//         Selector sub-steps encoded as #/team/SEA and #/team/SEA/2011 so back button
//         restores team picker and year picker steps correctly.

import { useState, useEffect } from 'react'
import { GameSelector } from './components/GameSelector'
import type { SelectorStep } from './components/GameSelector'
import { GameView } from './components/GameView'
import { Lab } from './components/Lab'

type View =
  | { mode: 'selector'; selectorStep: SelectorStep }
  | { mode: 'game'; gameId: string }
  | { mode: 'lab' }

function parseUrl(): View {
  const hash = window.location.hash
  if (hash.startsWith('#/game/')) {
    const gameId = decodeURIComponent(hash.slice(7))
    if (gameId) return { mode: 'game', gameId }
  }
  if (hash === '#/lab') return { mode: 'lab' }
  if (hash.startsWith('#/team/')) {
    const rest = hash.slice(7)
    const slash = rest.indexOf('/')
    if (slash !== -1) {
      const team = decodeURIComponent(rest.slice(0, slash))
      const season = parseInt(rest.slice(slash + 1), 10)
      if (team && !isNaN(season)) {
        return { mode: 'selector', selectorStep: { step: 'schedule', team, season } }
      }
    }
    const team = decodeURIComponent(rest)
    if (team) return { mode: 'selector', selectorStep: { step: 'years', team } }
  }
  return { mode: 'selector', selectorStep: { step: 'teams' } }
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
      className={`text-xs font-mono px-3 py-2 rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
    let url: string
    if (newView.mode === 'game') {
      url = `#/game/${encodeURIComponent(newView.gameId)}`
    } else if (newView.mode === 'lab') {
      url = '#/lab'
    } else {
      const ss = newView.selectorStep
      if (ss.step === 'years') url = `#/team/${encodeURIComponent(ss.team)}`
      else if (ss.step === 'schedule') url = `#/team/${encodeURIComponent(ss.team)}/${ss.season}`
      else url = '/'
    }
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
        onBack={() => navigate({ mode: 'selector', selectorStep: { step: 'teams' } })}
        onGoToLab={() => navigate({ mode: 'lab' })}
      />
    )
  }

  if (view.mode === 'lab') {
    return <Lab onBack={() => navigate({ mode: 'selector', selectorStep: { step: 'teams' } })} />
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
            className="text-xs font-mono px-3 py-2 rounded-md border border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            The Lab
          </button>
          <div className="w-px h-4 bg-gray-700" />
          <BlindModeButton blindMode={blindMode} onToggle={toggleBlindMode} />
        </div>
      </header>
      <GameSelector
        selectorStep={view.mode === 'selector' ? view.selectorStep : { step: 'teams' }}
        onStepChange={(ss) => navigate({ mode: 'selector', selectorStep: ss })}
        onSelect={(gameId) => navigate({ mode: 'game', gameId })}
        blindMode={blindMode}
      />
    </div>
  )
}

export default App
