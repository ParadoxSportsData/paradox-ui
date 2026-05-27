// src/components/PlayDescription.tsx
// PDX-27: Pure display — play description text with play_type badge.
// Fixed height (h-44) with overflow-y-auto so layout never shifts on long descriptions.

import type { PlaySnapshot } from '../api/schemas'

interface PlayDescriptionProps {
  play: PlaySnapshot | null
}

const BADGE_CLASSES: Record<string, string> = {
  pass: 'bg-blue-900 text-blue-200',
  run: 'bg-green-900 text-green-200',
  punt: 'bg-yellow-900 text-yellow-200',
  kickoff: 'bg-purple-900 text-purple-200',
  no_play: 'bg-gray-700 text-gray-400',
}

function badgeClass(playType: string): string {
  return BADGE_CLASSES[playType] ?? 'bg-gray-700 text-gray-400'
}

export function PlayDescription({ play }: PlayDescriptionProps) {
  if (play === null) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 h-44 flex items-center">
        <p className="text-gray-500 italic text-sm">Waiting for kickoff…</p>
      </div>
    )
  }

  const { play_type, description } = play

  return (
    <div className="bg-gray-800 rounded-lg p-4 h-44 overflow-y-auto">
      <div className="flex items-center gap-2 mb-2">
        <div className="text-xs text-gray-500 uppercase tracking-wide">Last Play</div>
        {play_type && (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${badgeClass(play_type)}`}>
            {play_type.replace('_', ' ')}
          </span>
        )}
      </div>
      <p className="text-gray-200 text-sm leading-relaxed">{description || '–'}</p>
    </div>
  )
}
