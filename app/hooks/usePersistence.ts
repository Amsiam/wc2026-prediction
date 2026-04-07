import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { bracketStore } from '../store/bracketStore'
import { encodePicks, decodePicks } from '../lib/encoding'

const LS_KEY = 'wc2026_picks'

// Call once at app startup to hydrate from URL or localStorage
export function useHydrate() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlParam = params.get('p')
    if (urlParam) {
      const state = decodePicks(urlParam)
      if (state) {
        bracketStore.getState().loadState(state)
        return
      }
    }
    const stored = localStorage.getItem(LS_KEY)
    if (stored) {
      const state = decodePicks(stored)
      if (state) bracketStore.getState().loadState(state)
    }
  }, [])
}

// Call once to set up auto-save on every store change
export function usePersist() {
  const navigate = useNavigate()
  useEffect(() => {
    return bracketStore.subscribe((state) => {
      const encoded = encodePicks(state)
      localStorage.setItem(LS_KEY, encoded)
      navigate({
        to: '/predictor',
        search: { p: encoded },
        replace: true,
        resetScroll: false,
      })
    })
  }, [navigate])
}

// Returns the current shareable URL
export function getShareableUrl(): string {
  return window.location.href
}
