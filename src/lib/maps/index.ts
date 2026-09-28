import { openStreetMapProvider } from './openstreetmap'
import type { MapProvider } from './types'

/**
 * Active provider. To switch vendor, implement MapProvider (e.g. a Mapbox
 * provider reading a public, domain-restricted token) and export it here.
 */
export const mapProvider: MapProvider = openStreetMapProvider

export { boundsAround, directionsUrl } from './geo'
export type { MapBounds, MapPoint, MapProvider } from './types'
