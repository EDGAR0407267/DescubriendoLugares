import type { ReactNode } from 'react'
import Form from 'next/form'
import Link from 'next/link'
import { Search } from 'lucide-react'
import type { Locale } from '@/config/i18n'
import type { DestinationCard, PlaceType } from '@/lib/db/contracts'
import type { Dictionary } from '@/lib/i18n/types'
import { directoryPath } from '@/lib/routing/paths'
import { cn } from '@/lib/utils/cn'
import { directoryQuery, type DirectoryState } from '@/features/directory/state'
import { PlaceTypeIcon } from '@/components/ui/icon'

interface DirectoryFiltersProps {
  locale: Locale
  dict: Dictionary
  state: DirectoryState
  /** Destination matched by `state.destination` (its slug may be from another locale). */
  activeDestinationId: string | null
  /** Type matched by `state.type`, if it exists. */
  activeType: string | null
  destinations: readonly DestinationCard[]
  placeTypes: readonly PlaceType[]
}

interface ChipOption {
  key: string
  label: string
  href: string
  active: boolean
  icon?: ReactNode
}

const chip =
  'inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors'

function ChipGroup({ id, legend, options }: { id: string; legend: string; options: ChipOption[] }) {
  return (
    <div role="group" aria-labelledby={id}>
      <p id={id} className="text-xs font-medium text-ink">
        {legend}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <li key={option.key}>
            <Link
              href={option.href}
              scroll={false}
              aria-current={option.active ? 'true' : undefined}
              className={cn(
                chip,
                option.active
                  ? 'border-ink bg-ink text-white hover:bg-accent'
                  : 'border-line bg-surface text-ink hover:border-ink',
              )}
            >
              {option.icon}
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Search box (GET form) plus locality and category chips. Every control is a
 * plain URL, so filters combine, can be shared, and back/forward restores
 * them; no client-side state and no JavaScript required.
 */
export function DirectoryFilters({
  locale,
  dict,
  state,
  activeDestinationId,
  activeType,
  destinations,
  placeTypes,
}: DirectoryFiltersProps) {
  const t = dict.directory
  const activeDestination = destinations.find((item) => item.id === activeDestinationId) ?? null
  const hrefWith = (patch: Partial<DirectoryState>) =>
    directoryPath(
      locale,
      directoryQuery({
        ...state,
        destination: activeDestination?.slug ?? null,
        type: activeType,
        ...patch,
        page: 1,
      }),
    )

  return (
    <section
      aria-label={t.filtersLabel}
      className="space-y-5 rounded-card border border-line-soft bg-surface p-4 md:p-5"
    >
      <Form action={directoryPath(locale)} role="search" className="flex gap-2">
        <label htmlFor="directory-q" className="sr-only">
          {t.searchLabel}
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-subtle"
            strokeWidth={1.8}
          />
          <input
            // Remount when the URL changes so the field mirrors it after
            // "clear filters" or back/forward navigation.
            key={state.q ?? ''}
            id="directory-q"
            name="q"
            type="search"
            defaultValue={state.q ?? ''}
            placeholder={t.searchPlaceholder}
            maxLength={80}
            autoComplete="off"
            enterKeyHint="search"
            className="h-12 w-full rounded-control border border-line bg-canvas pr-3 pl-10 text-base text-ink transition-colors placeholder:text-subtle hover:border-line-strong focus:border-ink focus:outline-none"
          />
        </div>
        {activeDestination ? (
          <input type="hidden" name="destination" value={activeDestination.slug} />
        ) : null}
        {activeType ? <input type="hidden" name="type" value={activeType} /> : null}
        <button
          type="submit"
          className="inline-flex h-12 flex-none items-center justify-center rounded-control bg-ink px-5 text-sm font-medium text-white transition-colors hover:bg-accent active:bg-accent-strong"
        >
          {t.submit}
        </button>
      </Form>

      <ChipGroup
        id="directory-locality"
        legend={t.locality}
        options={[
          {
            key: 'all',
            label: t.all,
            href: hrefWith({ destination: null }),
            active: !activeDestination,
          },
          ...destinations.map((destination) => ({
            key: destination.id,
            label: destination.name,
            href: hrefWith({ destination: destination.slug }),
            active: destination.id === activeDestination?.id,
          })),
        ]}
      />

      <ChipGroup
        id="directory-category"
        legend={t.category}
        options={[
          { key: 'all', label: t.all, href: hrefWith({ type: null }), active: !activeType },
          ...placeTypes.map((type) => ({
            key: type.code,
            label: type.pluralName,
            href: hrefWith({ type: type.code }),
            active: type.code === activeType,
            icon: <PlaceTypeIcon code={type.code} className="size-4" />,
          })),
        ]}
      />
    </section>
  )
}
