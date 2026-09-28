import { boundsAround } from './geo'
import type { MapProvider } from './types'

/** OpenStreetMap embed: free, keyless, zero client JavaScript (iframe). */
export const openStreetMapProvider: MapProvider = {
  id: 'openstreetmap',
  frameOrigin: 'https://www.openstreetmap.org',
  embedUrl(point, zoomKm = 0.6) {
    const { west, south, east, north } = boundsAround(point, zoomKm)
    const bbox = [west, south, east, north].map((value) => value.toFixed(5)).join(',')
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${point.latitude},${point.longitude}`
  },
  viewUrl(point) {
    return `https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=17/${point.latitude}/${point.longitude}`
  },
}
