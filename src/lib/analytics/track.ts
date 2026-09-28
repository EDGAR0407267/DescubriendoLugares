import type { AnalyticsEvent } from './events'

type DataLayer = Record<string, unknown>[]

declare global {
  interface Window {
    dataLayer?: DataLayer
  }
}

/**
 * Client-side event sink. Pushes to `window.dataLayer` only if an analytics
 * script initialised it (GA4/GTM, loaded after cookie consent). Until then
 * this is a no-op, so components can emit events without knowing whether
 * analytics is installed or consented.
 */
export function track(event: AnalyticsEvent): void {
  if (typeof window === 'undefined' || !Array.isArray(window.dataLayer)) return
  window.dataLayer.push({ event: event.name, ...event.params })
}
