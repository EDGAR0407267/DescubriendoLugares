export interface MapPoint {
  id: string
  latitude: number
  longitude: number
  label: string
}

export interface MapBounds {
  south: number
  west: number
  north: number
  east: number
}

/**
 * A map provider renders places without the rest of the app knowing which
 * vendor is behind it. Implement this interface to add Mapbox, Google Maps or
 * an interactive Leaflet map; components only depend on it.
 */
export interface MapProvider {
  id: string
  /** Origin that must be allowed in the CSP `frame-src` directive. */
  frameOrigin: string
  /** Keyless embeddable URL for a single point, or null if unsupported. */
  embedUrl(point: MapPoint, zoomKm?: number): string | null
  /** Link to a full map view of the point. */
  viewUrl(point: MapPoint): string
}
