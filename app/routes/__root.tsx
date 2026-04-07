/// <reference types="vite/client" />
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'

const SITE_URL = 'https://wc2026-prediction.vercel.app'
const OG_IMAGE = `${SITE_URL}/og-image.png`
const TITLE = 'WC 2026 Bracket Predictor'
const DESCRIPTION = 'Predict the full FIFA World Cup 2026 knockout bracket. Pick group stage results, third-place qualifiers, and track your predictions through to the final.'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: TITLE },
      { name: 'description', content: DESCRIPTION },
      { name: 'keywords', content: 'FIFA World Cup 2026, bracket predictor, WC 2026, football predictions, knockout bracket, group stage' },
      { name: 'theme-color', content: '#020817' },
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: SITE_URL },
      { property: 'og:title', content: TITLE },
      { property: 'og:description', content: DESCRIPTION },
      { property: 'og:image', content: OG_IMAGE },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: 'FIFA WC 2026 Bracket Predictor' },
      { property: 'og:site_name', content: 'WC 2026 Predictor' },
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: TITLE },
      { name: 'twitter:description', content: DESCRIPTION },
      { name: 'twitter:image', content: OG_IMAGE },
      { name: 'twitter:image:alt', content: 'FIFA WC 2026 Bracket Predictor' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'canonical', href: SITE_URL },
    ],
  }),
  component: () => (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-gray-950 text-white">
        <Outlet />
        <Scripts />
      </body>
    </html>
  ),
})

