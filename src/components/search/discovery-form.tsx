import Form from 'next/form'
import { ArrowRight } from 'lucide-react'
import type { Locale } from '@/config/i18n'
import type { CategorySummary, DestinationCard } from '@/lib/db/contracts'
import type { Dictionary } from '@/lib/i18n/types'
import { searchPath } from '@/lib/routing/paths'
import { SelectField } from './field'

/** Category groups offered as "experience" (who / what kind of outing). */
const EXPERIENCE_GROUPS = new Set(['audience', 'style', 'setting'])

interface DiscoveryFormProps {
  locale: Locale
  dict: Dictionary
  destinations: readonly DestinationCard[]
  categories: readonly CategorySummary[]
}

/**
 * Guided discovery ("¿No sabes dónde ir?"): destination, budget and
 * experience as a GET form to the search page. Rule-based today; the same
 * criteria can later feed getRecommendations() or an AI recommender.
 */
export function DiscoveryForm({ locale, dict, destinations, categories }: DiscoveryFormProps) {
  const t = dict.discovery
  return (
    <Form action={searchPath(locale)} className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-2.5">
        <SelectField
          id="discover-destination"
          name="destination"
          label={t.destination}
          placeholder={t.anyDestination}
          options={destinations.map((destination) => ({
            value: destination.slug,
            label: destination.name,
          }))}
        />
        <SelectField
          id="discover-price"
          name="price"
          label={t.budget}
          placeholder={t.anyBudget}
          options={([1, 2, 3, 4] as const).map((level) => ({
            value: String(level),
            label: `${'€'.repeat(level)} · ${dict.price.levels[level]}`,
          }))}
        />
        <div className="col-span-2">
          <SelectField
            id="discover-experience"
            name="category"
            label={t.experience}
            placeholder={t.anyExperience}
            options={categories
              .filter((category) => EXPERIENCE_GROUPS.has(category.groupCode))
              .map((category) => ({ value: category.slug, label: category.name }))}
          />
        </div>
      </div>
      <button
        type="submit"
        className="mt-1 inline-flex h-[50px] items-center justify-center gap-2.5 rounded-xl bg-ink px-[22px] text-[15px] font-medium text-white transition-colors hover:bg-accent active:bg-accent-strong"
      >
        {t.submit}
        <ArrowRight aria-hidden className="size-4" />
      </button>
    </Form>
  )
}
