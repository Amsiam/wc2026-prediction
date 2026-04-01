import { useRef, useState } from 'react'
import { useStore } from 'zustand'
import html2canvas from 'html2canvas'
import { bracketStore } from '../../store/bracketStore'
import { BracketCanvas } from './BracketCanvas'
import { WinnerCard } from './WinnerCard'

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export function GenerateButton() {
  const bracketRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  const finalWinner = useStore(bracketStore, s => s.matches.final.winner)
  const thirdPlaceWinner = useStore(bracketStore, s => s.matches.third_place.winner)
  const canGenerate = finalWinner !== null && thirdPlaceWinner !== null

  async function handleGenerate() {
    if (!bracketRef.current || !cardRef.current) return
    setLoading(true)
    try {
      const [bracketCanvas, cardCanvas] = await Promise.all([
        html2canvas(bracketRef.current, { backgroundColor: '#0f172a', scale: 1 }),
        html2canvas(cardRef.current, { backgroundColor: null, scale: 1 }),
      ])
      downloadCanvas(bracketCanvas, 'worldcup-2026-bracket.png')
      downloadCanvas(cardCanvas, 'worldcup-2026-winner.png')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={!canGenerate || loading}
        className={`text-sm px-3 py-1.5 rounded font-medium transition-colors ${
          canGenerate && !loading
            ? 'bg-green-600 hover:bg-green-500 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        {loading ? 'Generating…' : 'Generate images'}
      </button>
      <BracketCanvas ref={bracketRef} />
      <WinnerCard ref={cardRef} />
    </>
  )
}
