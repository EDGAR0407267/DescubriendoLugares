import { ImageResponse } from 'next/og'
import { siteConfig } from '@/config/site'

/**
 * Brand images rendered at build time with next/og (no binary assets to keep
 * in sync with the wordmark). Colors mirror src/app/globals.css.
 */
const CANVAS = '#faf9f6'
const INK = '#171715'
const ACCENT = '#1d5360'

/** Square mark: "dl" monogram on the accent color (logo, touch icon). */
export function brandMark(size: number): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: ACCENT,
        color: CANVAS,
        fontSize: size * 0.46,
        fontWeight: 700,
        letterSpacing: -size * 0.02,
      }}
    >
      dl
    </div>,
    { width: size, height: size },
  )
}

/** Default 1200×630 share image for pages without a photo of their own. */
export function defaultShareImage(): ImageResponse {
  const { lead, accent } = siteConfig.wordmark
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: 96,
        background: CANVAS,
        borderBottom: `24px solid ${ACCENT}`,
      }}
    >
      <div style={{ display: 'flex', fontSize: 96, letterSpacing: -4 }}>
        <span style={{ color: INK, fontWeight: 700 }}>{lead}</span>
        <span style={{ color: ACCENT }}>{accent}</span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  )
}
