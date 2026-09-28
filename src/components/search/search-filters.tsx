import Form from 'next/form'
import Link from 'next/link'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import type { CategorySummary, DestinationCard, Feature, PlaceType } from '@/lib/db/contracts'
import type { Dictionary } from '@/lib/i18n/types'
import { sortOptions } from '@/features/places/types'
import type { SearchState } from '@/features/search/params'
import { DataIcon } from '@/components/ui/icon'
import { CheckboxGroup, SelectField } from './field'

interface SearchFiltersProps {
  dict: Dictionary
  /** Form target: the listing or search page path without query. */
  action: string
  state: SearchState
  features: readonly Feature[]
  categories: readonly CategorySummary[]
  /** Only on the global search page; listings take them from the path. */
  destinations?: readonly DestinationCard[]
  placeTypes?: readonly PlaceType[]
  showKeyword?: boolean
}

function activeCount(state: SearchState, context: { destination: boolean; type: boolean }): number {
  return (
    (context.destination && state.destination ? 1 : 0) +
    (context.type && state.type ? 1 : 0) +
    (state.category ? 1 : 0) +
    state.price.length +
    state.features.length +
    (state.q ? 1 : 0)
  )
}

/**
 * Filter panel as a native GET form inside <details>: shareable URLs, no
 * client state, no JavaScript required.
 */
export function SearchFilters({
  dict,
  action,
  state,
  features,
  categories,
  destinations,
  placeTypes,
  showKeyword = false,
}: SearchFiltersProps) {
  const t = dict.search
  const count = activeCount(state, {
    destination: Boolean(destinations),
    type: Boolean(placeTypes),
  })

  return (
    <details className="group rounded-card border border-line-soft bg-surface" open={count > 0}>
      <summary className="flex h-12 items-center justify-between gap-3 px-4 text-sm font-medium text-ink">
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal aria-hidden className="size-4" />
          {t.filters}
          {count > 0 ? (
            <span className="rounded-full bg-ink px-2 py-0.5 text-xs text-white">{count}</span>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden
          className="size-4 text-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <Form action={action} className="space-y-6 border-t border-line-soft p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {showKeyword ? (
            <div>
              <label htmlFor="filter-q" className="block text-xs font-medium text-muted">
                {t.keyword}
              </label>
              <input
                id="filter-q"
                name="q"
                type="search"
                defaultValue={state.q ?? ''}
                placeholder={t.keywordPlaceholder}
                maxLength={80}
                className="mt-1 h-11 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none"
              />
            </div>
          ) : null}
          {destinations ? (
            <SelectField
              id="filter-destination"
              name="destination"
              label={dict.discovery.destination}
              placeholder={dict.discovery.anyDestination}
              defaultValue={state.destination}
              options={destinations.map((destination) => ({
                value: destination.slug,
                label: destination.name,
              }))}
            />
          ) : null}
          {placeTypes ? (
            <SelectField
              id="filter-type"
              name="type"
              label={dict.discovery.placeType}
              placeholder={dict.discovery.anyPlaceType}
              defaultValue={state.type}
              options={placeTypes.map((type) => ({ value: type.code, label: type.pluralName }))}
            />
          ) : null}
          {categories.length > 0 ? (
            <SelectField
              id="filter-category"
              name="category"
              label={t.category}
              placeholder={t.anyCategory}
              defaultValue={state.category}
              options={categories.map((category) => ({
                value: category.slug,
                label: category.name,
              }))}
            />
          ) : null}
          <SelectField
            id="filter-sort"
            name="sort"
            label={t.sort}
            placeholder={t.sortOptions.ranking}
            defaultValue={state.sort === 'ranking' ? null : state.sort}
            options={sortOptions
              .filter((option) => option !== 'ranking')
              .map((option) => ({ value: option, label: t.sortOptions[option] }))}
          />
        </div>
        <CheckboxGroup
          legend={t.price}
          name="price"
          selected={state.price.map(String)}
          options={([1, 2, 3, 4] as const).map((level) => ({
            value: String(level),
            label: '€'.repeat(level),
          }))}
        />
        <CheckboxGroup
          legend={t.features}
          name="feature"
          selected={state.features}
          options={features
            .filter((feature) => feature.isFilterable)
            .map((feature) => ({
              value: feature.code,
              label: feature.name,
              icon: <DataIcon name={feature.icon} className="size-4" />,
            }))}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-control bg-ink px-6 text-sm font-medium text-white transition-colors hover:bg-accent"
          >
            {t.apply}
          </button>
          <Link href={action} className="link-underline text-sm font-medium text-ink">
            {t.clear}
          </Link>
        </div>
      </Form>
    </details>
  )
}
