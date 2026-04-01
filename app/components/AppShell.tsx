import { useState } from 'react'
import { bracketStore } from '../store/bracketStore'
import { ALL_MATCH_IDS } from '../data/teams'
import { GroupGrid } from './GroupStage/GroupGrid'
import { BracketView } from './Knockout/BracketView'
import { GenerateButton } from './ImageGen/GenerateButton'
import { getShareableUrl } from '../hooks/usePersistence'
import { useStore } from 'zustand'

type Tab = 'groups' | 'knockout'

function usePlacedCount(): number {
  const matches = useStore(bracketStore, s => s.matches)
  return ALL_MATCH_IDS.filter(id => matches[id].winner !== null).length
}

export function AppShell() {
  const [tab, setTab] = useState<Tab>('groups')
  const placedCount = usePlacedCount()

  function copyLink() {
    navigator.clipboard.writeText(getShareableUrl())
      .then(() => alert('Link copied!'))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">WC 2026 Predictor</span>
          <span className="text-sm text-gray-400">{placedCount} / 32 teams placed</span>
        </div>
        <div className="flex gap-2">
          <a href="/schedule" className="text-sm px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600">
            Schedule
          </a>
          <button
            onClick={copyLink}
            className="text-sm px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600"
          >
            Copy link
          </button>
          <GenerateButton />
        </div>
      </header>

      <nav className="flex border-b border-gray-800 bg-gray-900">
        {(['groups', 'knockout'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? 'border-b-2 border-green-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'groups' ? 'Group Stage' : 'Knockout'}
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-auto p-4">
        {tab === 'groups' ? <GroupGrid /> : <BracketView />}
      </main>
    </div>
  )
}
