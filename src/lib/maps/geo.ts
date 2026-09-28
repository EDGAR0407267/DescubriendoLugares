import type { MapBounds, MapPoint } from './types'

const KM_PER_DEGREE_LAT = 111.32

/** Square box of roughly `radiusKm` around a point. */
export function boundsAround(
  point: Pick<MapPoint, 'latitude' | 'longitude'>,
  radiusKm: number,
): MapBounds {
  const dLat = radiusKm / KM_PER_DEGREE_LAT
  const dLng =
    radiusKm / (KM_PER_DEGREE_LAT * Math.max(Math.cos((point.latitude * Math.PI) / 180), 0.01))
  return {
    south: point.latitude - dLat,
    north: point.latitude + dLat,
    west: point.longitude - dLng,
    east: point.longitude + dLng,
  }
}

/**
 * Universal directions link (Google Maps URLs API): no API key, opens the
 * native maps app on mobile. Independent from the embed provider.
 */
export function directionsUrl(point: Pick<MapPoint, 'latitude' | 'longitude'>): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${point.latitude},${point.longitude}`
}
