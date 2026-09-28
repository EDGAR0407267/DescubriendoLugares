import type { PlaceCard } from '@/lib/db/contracts'
import type {
  GeoPoint,
  Recommendation,
  RecommendationCriteria,
  RecommendationReason,
} from './types'

const WEIGHTS = { features: 0.35, category: 0.25, budget: 0.15, proximity: 0.15, rating: 0.1 }
const NEARBY_KM = 2
const PROXIMITY_HORIZON_KM = 10

export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2
  return 6371.0088 * 2 * Math.asin(Math.sqrt(h))
}

/**
 * Scores one candidate against soft criteria. Hard constraints (destination,
 * type, exclusions) are applied when fetching candidates.
 */
export function scoreCandidate(place: PlaceCard, criteria: RecommendationCriteria): Recommendation {
  const reasons: RecommendationReason[] = []
  let score = 0

  const wanted = criteria.features ?? []
  if (wanted.length > 0) {
    const matched = wanted.filter((code) => place.featureCodes.includes(code)).length
    score += WEIGHTS.features * (matched / wanted.length)
    if (matched > 0) reasons.push('feature_match')
  }

  if (criteria.categoryIds?.length && place.primaryCategory) {
    if (criteria.categoryIds.includes(place.primaryCategory.id)) {
      score += WEIGHTS.category
      reasons.push('category_match')
    }
  }

  if (criteria.budget?.length && place.priceLevel !== null) {
    if (criteria.budget.includes(place.priceLevel)) {
      score += WEIGHTS.budget
      reasons.push('budget_match')
    }
  }

  if (criteria.location && place.latitude !== null && place.longitude !== null) {
    const km = distanceKm(criteria.location, {
      latitude: place.latitude,
      longitude: place.longitude,
    })
    score += WEIGHTS.proximity * Math.max(0, 1 - km / PROXIMITY_HORIZON_KM)
    if (km <= NEARBY_KM) reasons.push('nearby')
  }

  if (place.rating !== null) {
    score += WEIGHTS.rating * (place.rating / 5)
    if (place.rating >= 4.5) reasons.push('rating')
  }

  return { place, score: Math.round(score * 1000) / 1000, reasons }
}

export function rankCandidates(
  candidates: readonly PlaceCard[],
  criteria: RecommendationCriteria,
): Recommendation[] {
  const excluded = new Set(criteria.excludeIds ?? [])
  return candidates
    .filter((place) => !excluded.has(place.id))
    .filter((place) => criteria.minRating == null || (place.rating ?? 0) >= criteria.minRating)
    .map((place) => scoreCandidate(place, criteria))
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .slice(0, criteria.limit ?? 6)
}
