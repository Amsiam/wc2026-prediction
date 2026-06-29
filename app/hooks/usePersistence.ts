import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { bracketStore } from '../store/bracketStore'
import { encodePicks, decodePicks } from '../lib/encoding'

// Hydrate bracket picks from ?p= share link only (no localStorage).
export function useHydrate() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlParam = params.get('p')
    if (!urlParam) return

    const state = decodePicks(urlParam)
    if (state) bracketStore.getState().loadState(state)
  }, [])
}

// Keep the shareable ?p= URL in sync as the user edits picks.
export function usePersist() {
  const navigate = useNavigate()
  useEffect(() => {
    return bracketStore.subscribe((state) => {
      const encoded = encodePicks(state)
      navigate({
        to: '/predictor',
        search: { p: encoded },
        replace: true,
        resetScroll: false,
      })
    })
  }, [navigate])
}

export function getShareableUrl(): string {
  return window.location.href
}
