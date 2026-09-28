import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  id: string
  name: string
  label: string
  placeholder: string
  options: readonly SelectOption[]
  defaultValue?: string | null
}

export function SelectField({
  id,
  name,
  label,
  placeholder,
  options,
  defaultValue,
}: SelectFieldProps) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-xs font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-1">
        <select
          id={id}
          name={name}
          defaultValue={defaultValue ?? ''}
          className="h-11 w-full cursor-pointer appearance-none truncate rounded-control border border-line bg-surface pr-9 pl-3 text-sm text-ink transition-colors hover:border-line-strong focus:border-ink focus:outline-none"
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
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
        />
      </div>
    </div>
  )
}

interface CheckboxGroupProps {
  legend: string
  name: string
  options: readonly (SelectOption & { icon?: ReactNode })[]
  selected: readonly string[]
}

export function CheckboxGroup({ legend, name, options, selected }: CheckboxGroupProps) {
  return (
    <fieldset>
      <legend className="text-xs font-medium text-ink">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm text-ink transition-colors hover:border-ink has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white"
          >
            <input
              type="checkbox"
              name={name}
              value={option.value}
              defaultChecked={selected.includes(option.value)}
              className="sr-only"
            />
            {option.icon}
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
