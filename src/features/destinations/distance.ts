interface Point {
  latitude: number
  longitude: number
}

/** Great-circle distance in kilometres (same formula as SQL haversine_km). */
export function distanceKm(a: Point, b: Point): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const dLat = radians(b.latitude - a.latitude)
  const dLng = radians(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 6371.0088 * 2 * Math.asin(Math.sqrt(h))
}

/** Closest first; ties keep their original order. */
export function sortByDistance<T extends Point>(origin: Point, items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index, distance: distanceKm(origin, item) }))
    .sort((a, b) => a.distance - b.distance || a.index - b.index)
    .map(({ item }) => item)
}
