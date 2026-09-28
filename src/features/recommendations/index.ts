import 'server-only'
import { searchPlaces } from '@/features/places/queries'
import { rankCandidates } from './scoring'
import type { Recommendation, RecommendationCriteria, Recommender } from './types'

const CANDIDATE_POOL = 60

/**
 * v1: rule-based. Pulls a pool of organically ranked candidates with the hard
 * constraints, then re-scores them against the soft criteria.
 */
export const ruleBasedRecommender: Recommender = {
  async recommend(criteria) {
    const { items } = await searchPlaces(criteria.locale, {
      destinationId: criteria.destinationId,
      placeType: criteria.placeType,
      excludeIds: criteria.excludeIds,
      limit: CANDIDATE_POOL,
    })
    return rankCandidates(items, criteria)
  },
}

export function getRecommendations(
  criteria: RecommendationCriteria,
  recommender: Recommender = ruleBasedRecommender,
): Promise<Recommendation[]> {
  return recommender.recommend(criteria)
}

export type { Recommendation, RecommendationCriteria, Recommender } from './types'
