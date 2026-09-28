import type { Locale } from '@/config/i18n'
import type { PlaceCard, PriceLevel } from '@/lib/db/contracts'

export interface GeoPoint {
  latitude: number
  longitude: number
}

export interface RecommendationCriteria {
  locale: Locale
  destinationId?: string | null
  placeType?: string | null
  /** Reference point, e.g. the place being viewed or the user's hotel. */
  location?: GeoPoint | null
  budget?: readonly PriceLevel[]
  categoryIds?: readonly string[]
  features?: readonly string[]
  minRating?: number | null
  excludeIds?: readonly string[]
  limit?: number
}

export type RecommendationReason =
  'feature_match' | 'category_match' | 'budget_match' | 'nearby' | 'rating'

export interface Recommendation {
  place: PlaceCard
  /** Relative relevance in [0, 1]; only comparable within one response. */
  score: number
  reasons: RecommendationReason[]
}

/**
 * Contract every recommendation strategy implements. The rule-based version
 * can be replaced (embeddings, collaborative filtering, an external service…)
 * without touching callers.
 */
export interface Recommender {
  recommend(criteria: RecommendationCriteria): Promise<Recommendation[]>
}
