import { useState, useRef, useEffect } from 'react'
import { toPng } from 'html-to-image'
import {
  FacebookShareButton,
  WhatsappShareButton,
  TwitterShareButton,
  TelegramShareButton,
  RedditShareButton,
} from 'react-share'

interface Props {
  getUrl: () => string
}

const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

export function ShareMenu({ getUrl }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sharingImage, setSharingImage] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleNativeShare() {
    navigator.share({
      title: 'My WC 2026 Bracket',
      text: 'Check out my 2026 FIFA World Cup bracket prediction!',
      url: getUrl(),
    }).catch(() => {})
  }

  async function handleShareImage() {
    const el = document.getElementById('bracket-capture')
    if (!el) {
      alert('Switch to the Knockout tab first, then share.')
      return
    }
    setSharingImage(true)
    setOpen(false)
    try {
      const dataUrl = await toPng(el, { backgroundColor: '#020a16', pixelRatio: 2 })
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const file = new File([blob], 'wc2026-bracket.png', { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My WC 2026 Bracket Prediction',
          text: 'Check out my 2026 FIFA World Cup bracket prediction!',
        })
      } else {
        // Fallback: download the image
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = 'wc2026-bracket.png'
        a.click()
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        alert('Could not share image. Try saving it instead.')
      }
    } finally {
      setSharingImage(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(getUrl()).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // On mobile with native share support — show both options
  if (canNativeShare) {
    return (
      <div className="flex gap-1">
        <button
          onClick={handleNativeShare}
          className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white whitespace-nowrap"
        >
          Share link
        </button>
        <button
          onClick={handleShareImage}
          disabled={sharingImage}
          className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded bg-green-700 hover:bg-green-600 text-white whitespace-nowrap"
        >
          {sharingImage ? '…' : 'Share image'}
        </button>
      </div>
    )
  }

  const url = open ? getUrl() : ''
  const title = 'Check out my 2026 FIFA World Cup bracket prediction!'

  const btnCls = 'flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded hover:bg-gray-700 transition-colors text-gray-200'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-white whitespace-nowrap"
      >
        <span className="hidden sm:inline">Share</span>
        <span className="sm:hidden">Share</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
        <div className="w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl py-1.5 overflow-hidden" onClick={e => e.stopPropagation()}>
          <FacebookShareButton url={url} className="w-full">
            <span className={btnCls}>
              <svg className="w-4 h-4 fill-[#1877f2]" viewBox="0 0 24 24"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
              Facebook
            </span>
          </FacebookShareButton>

          <WhatsappShareButton url={url} title={title} className="w-full">
            <span className={btnCls}>
              <svg className="w-4 h-4 fill-[#25d366]" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </span>
          </WhatsappShareButton>

          <TwitterShareButton url={url} title={title} hashtags={['WC2026', 'WorldCup2026']} className="w-full">
            <span className={btnCls}>
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X (Twitter)
            </span>
          </TwitterShareButton>

          <TelegramShareButton url={url} title={title} className="w-full">
            <span className={btnCls}>
              <svg className="w-4 h-4 fill-[#26a5e4]" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Telegram
            </span>
          </TelegramShareButton>

          <RedditShareButton url={url} title={title} className="w-full">
            <span className={btnCls}>
              <svg className="w-4 h-4 fill-[#ff4500]" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
              Reddit
            </span>
          </RedditShareButton>

          <div className="border-t border-gray-700 my-1" />

          <button onClick={handleShareImage} disabled={sharingImage} className={`${btnCls} w-full`}>
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {sharingImage ? 'Generating…' : 'Share bracket image'}
          </button>

          <div className="border-t border-gray-700 my-1" />

          <button onClick={handleCopy} className={`${btnCls} w-full`}>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
        </div>
      )}
    </div>
  )
}
