/**
 * Organic ranking score for places (stored in `places.ranking_score`).
 *
 * Design rules
 * - Deterministic and explainable: same inputs → same score, every term is
 *   inspectable. No hidden boosts.
 * - Organic only: promotions/sponsorship are NOT an input and never will be.
 *   Sponsored placements live in `place_promotions` and are rendered apart.
 * - Missing signals do not penalise a place; their weight is redistributed
 *   among the signals that are present.
 * - Computed offline (batch job / admin action), not at request time, so the
 *   formula can evolve without touching query performance.
 *
 * v1 formula (intentionally simple, to be tuned with real data):
 *   quality      = Bayesian average of the rating, normalised to 0–1.
 *                  Prior: mean 4.0 with the weight of 20 reviews, so a 5.0
 *                  with 3 reviews does not outrank a 4.7 with 800.
 *   editorial    = editorial_score / 100
 *   completeness = share of key profile fields that are filled in (0–1)
 *   score        = 100 × Σ(weight × signal) / Σ(weights of present signals)
 *
 * Planned inputs (typed now, weight 0 until data exists): popularity,
 * recency. Changing weights = bumping RANKING_VERSION and re-running the job.
 */
export const RANKING_VERSION = 1

export interface RankingSignals {
  /** Third-party aggregate rating on a 0–5 scale. */
  rating: number | null
  reviewCount: number | null
  /** Editorial assessment, 0–100. */
  editorialScore: number | null
  /** Profile completeness, 0–1 (see profileCompleteness). */
  completeness: number | null
  /** Normalised popularity (visits, saves…), 0–1. Not used yet. */
  popularity?: number | null
  /** Freshness of the information, 0–1. Not used yet. */
  recency?: number | null
}

export const RANKING_WEIGHTS = {
  quality: 0.6,
  editorial: 0.25,
  completeness: 0.15,
  popularity: 0,
  recency: 0,
} as const satisfies Record<string, number>

const PRIOR_MEAN = 4.0
const PRIOR_WEIGHT = 20

export function bayesianRating(rating: number, reviewCount: number): number {
  const count = Math.max(0, reviewCount)
  return (PRIOR_MEAN * PRIOR_WEIGHT + rating * count) / (PRIOR_WEIGHT + count)
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** Returns a score in [0, 100] with 4 decimals, or null when no signal exists. */
export function calculateRankingScore(signals: RankingSignals): number | null {
  const terms: [weight: number, value: number | null][] = [
    [
      RANKING_WEIGHTS.quality,
      signals.rating !== null && signals.reviewCount !== null && signals.reviewCount > 0
        ? bayesianRating(signals.rating, signals.reviewCount) / 5
        : null,
    ],
    [
      RANKING_WEIGHTS.editorial,
      signals.editorialScore !== null ? signals.editorialScore / 100 : null,
    ],
    [RANKING_WEIGHTS.completeness, signals.completeness],
    [RANKING_WEIGHTS.popularity, signals.popularity ?? null],
    [RANKING_WEIGHTS.recency, signals.recency ?? null],
  ]

  let weighted = 0
  let totalWeight = 0
  for (const [weight, value] of terms) {
    if (value === null || weight === 0) continue
    weighted += weight * clamp01(value)
    totalWeight += weight
  }
  if (totalWeight === 0) return null
  return Math.round((weighted / totalWeight) * 100 * 10_000) / 10_000
}

export interface ProfileFields {
  shortDescription: string | null
  fullDescription: string | null
  imageUrl: string | null
  latitude: number | null
  addressLine: string | null
  phone: string | null
  website: string | null
  priceLevel: number | null
  categoryCount: number
  featureCount: number
}

/** Share (0–1) of the fields that make a listing genuinely useful. */
export function profileCompleteness(fields: ProfileFields): number {
  const checks = [
    Boolean(fields.shortDescription),
    Boolean(fields.fullDescription),
    Boolean(fields.imageUrl),
    fields.latitude !== null,
    Boolean(fields.addressLine),
    Boolean(fields.phone || fields.website),
    fields.priceLevel !== null,
    fields.categoryCount > 0,
    fields.featureCount >= 3,
  ]
  return checks.filter(Boolean).length / checks.length
}
