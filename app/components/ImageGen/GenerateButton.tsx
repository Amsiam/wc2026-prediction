import { useState } from 'react'
import { toPng } from 'html-to-image'

export function GenerateButton() {
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    const el = document.getElementById('bracket-capture')
    if (!el) {
      alert('Switch to the Knockout tab first, then click Save.')
      return
    }
    setLoading(true)
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: '#020a16',
        pixelRatio: 2,
      })
      const link = document.createElement('a')
      link.download = 'worldcup-2026-bracket.png'
      link.href = dataUrl
      link.click()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className={`text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded font-medium transition-colors whitespace-nowrap ${
        !loading
          ? 'bg-green-600 hover:bg-green-500 text-white'
          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
      }`}
    >
      {loading ? 'Generating…' : (
        <>
          <span className="hidden sm:inline">Save bracket image</span>
          <span className="sm:hidden">Save</span>
        </>
      )}
    </button>
  )
}
