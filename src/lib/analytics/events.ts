/**
 * Typed analytics events. Components emit semantic events; adapters decide
 * where they go (GA4, affiliate trackers…). Adding an event = adding it here.
 */
export type AnalyticsEvent =
  | { name: 'outbound_click'; params: { kind: OutboundKind; placeId?: string; url: string } }
  | { name: 'search'; params: { destination?: string; resultCount: number } }

export type OutboundKind = 'website' | 'phone' | 'instagram' | 'directions' | 'maps' | 'affiliate'
