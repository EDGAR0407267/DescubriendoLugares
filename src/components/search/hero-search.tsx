import Form from 'next/form'
import { ChevronDown, Search } from 'lucide-react'
import type { Locale } from '@/config/i18n'
import type { DestinationCard, PlaceType } from '@/lib/db/contracts'
import type { Dictionary } from '@/lib/i18n/types'
import { directoryPath } from '@/lib/routing/paths'

interface HeroSearchProps {
  locale: Locale
  dict: Dictionary
  destinations: readonly DestinationCard[]
  placeTypes: readonly PlaceType[]
}

interface HeroFieldProps {
  id: string
  name: string
  label: string
  placeholder: string
  options: readonly { value: string; label: string }[]
  className?: string
}

function HeroField({ id, name, label, placeholder, options, className }: HeroFieldProps) {
  return (
    <label
      htmlFor={id}
      className={`relative flex min-w-0 flex-[100_1_180px] cursor-pointer flex-col gap-[3px] rounded-control px-3.5 py-2.5 transition-colors hover:bg-hover ${className ?? ''}`}
    >
      <span className="text-xs leading-tight font-medium text-ink">{label}</span>
      <select
        id={id}
        name={name}
        defaultValue=""
        className="w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-[15px] leading-snug text-ink outline-none"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 bottom-3.5 size-4 text-subtle"
      />
    </label>
  )
}

/**
 * Floating search bar of the home hero. A native GET form targeting the
 * "Comer y beber" directory: shareable results, works without JavaScript.
 */
export function HeroSearch({ locale, dict, destinations, placeTypes }: HeroSearchProps) {
  const t = dict.discovery
  return (
    <Form
      action={directoryPath(locale)}
      className="flex flex-wrap gap-1 rounded-2xl border border-line bg-surface p-2 shadow-card"
    >
      <HeroField
        id="hero-destination"
        name="destination"
        label={t.where}
        placeholder={t.anyDestination}
        options={destinations.map((destination) => ({
          value: destination.slug,
          label: destination.name,
        }))}
      />
      <HeroField
        id="hero-type"
        name="type"
        label={t.what}
        placeholder={t.anyPlaceType}
        options={placeTypes.map((type) => ({ value: type.code, label: type.pluralName }))}
        className="sm:border-l sm:border-line-soft"
      />
      <button
        type="submit"
        className="flex min-h-[54px] flex-[1_0_120px] items-center justify-center gap-2 rounded-[11px] bg-ink text-[15px] font-medium text-white transition-colors hover:bg-accent active:bg-accent-strong"
      >
        <Search aria-hidden className="size-[17px]" strokeWidth={2} />
        {t.search}
      </button>
    </Form>
  )
}
