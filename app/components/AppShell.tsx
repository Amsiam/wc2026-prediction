import { useState, useRef } from 'react'
import { bracketStore } from '../store/bracketStore'
import { groupScoreStore } from '../store/groupScoreStore'
import { EMPTY_STATE } from '../lib/encoding'
import { ALL_MATCH_IDS } from '../data/teams'
import { GroupGrid } from './GroupStage/GroupGrid'
import { BracketView } from './Knockout/BracketView'
import { GenerateButton } from './ImageGen/GenerateButton'
import { getShareableUrl } from '../hooks/usePersistence'
import { ShareMenu } from './ShareMenu'
import { useStore } from 'zustand'

type Tab = 'groups' | 'knockout'

function usePlacedCount(): number {
  const matches = useStore(bracketStore, s => s.matches)
  return ALL_MATCH_IDS.filter(id => matches[id].winner !== null).length
}

export function AppShell() {
  const [tab, setTab] = useState<Tab>(() =>
    new URLSearchParams(window.location.search).has('p') ? 'knockout' : 'groups'
  )
  const mainRef = useRef<HTMLElement>(null)
  const scrollPos = useRef<Record<Tab, number>>({ groups: 0, knockout: 0 })
  const placedCount = usePlacedCount()

  function handleTabChange(next: Tab) {
    if (mainRef.current) scrollPos.current[tab] = mainRef.current.scrollTop
    setTab(next)
    requestAnimationFrame(() => {
      if (mainRef.current) mainRef.current.scrollTop = scrollPos.current[next]
    })
  }

  function handleClear() {
    if (!confirm('Reset all predictions and scores?')) return
    bracketStore.getState().loadState(EMPTY_STATE)
    groupScoreStore.setState({ scores: {}, overrides: {}, activeGroupModal: null })
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base sm:text-xl font-bold tracking-tight whitespace-nowrap text-white">WC 2026</span>
          <span className="text-xs text-gray-400 whitespace-nowrap">{placedCount}/32 placed</span>
        </div>
        <div className="flex gap-1.5 justify-center flex-wrap">
          <a href="/schedule" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 whitespace-nowrap">
            Schedule
          </a>
          <ShareMenu getUrl={getShareableUrl} />
          <button
            onClick={handleClear}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded bg-red-900 hover:bg-red-800 text-red-300 whitespace-nowrap"
          >
            Clear
          </button>
          <GenerateButton />
        </div>
      </header>

      <nav className="flex border-b border-gray-800 bg-gray-900">
        {(['groups', 'knockout'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
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

      <main ref={mainRef} className="flex-1 overflow-auto p-4">
        {tab === 'groups' ? <GroupGrid /> : <BracketView />}
      </main>
    </div>
  )
}
