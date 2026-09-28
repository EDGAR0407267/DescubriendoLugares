import {
  Baby,
  BedDouble,
  Beef,
  Beer,
  CalendarCheck,
  Car,
  ChefHat,
  Coffee,
  CookingPot,
  Fish,
  FishSymbol,
  Heart,
  Landmark,
  Leaf,
  Martini,
  PiggyBank,
  Pizza,
  Salad,
  Shell,
  ShoppingBag,
  Sun,
  Tag,
  TreePalm,
  Umbrella,
  Users,
  Utensils,
  UtensilsCrossed,
  Waves,
  WheatOff,
  Wine,
  type LucideIcon,
} from 'lucide-react'

/**
 * Icons referenced by name from the database (features.icon,
 * categories.icon). Unknown names fall back to a neutral tag icon, so new
 * data never breaks rendering.
 */
const registry: Record<string, LucideIcon> = {
  baby: Baby,
  beef: Beef,
  'calendar-check': CalendarCheck,
  car: Car,
  'chef-hat': ChefHat,
  coffee: Coffee,
  'cooking-pot': CookingPot,
  fish: Fish,
  'fish-symbol': FishSymbol,
  heart: Heart,
  leaf: Leaf,
  'piggy-bank': PiggyBank,
  pizza: Pizza,
  salad: Salad,
  shell: Shell,
  'shopping-bag': ShoppingBag,
  sun: Sun,
  palmtree: TreePalm,
  umbrella: Umbrella,
  users: Users,
  utensils: Utensils,
  waves: Waves,
  'wheat-off': WheatOff,
}

export function DataIcon({ name, className }: { name: string | null; className?: string }) {
  const Icon = (name && registry[name]) || Tag
  return <Icon aria-hidden className={className} strokeWidth={1.75} />
}

/** Icon per place type code (place_types.code); neutral fallback for new types. */
const placeTypeIcons: Record<string, LucideIcon> = {
  restaurant: UtensilsCrossed,
  bar: Wine,
  cafe: Coffee,
  tapas_bar: Beer,
  drinks: Martini,
  beach_club: Umbrella,
  hotel: BedDouble,
  attraction: Landmark,
  beach: Waves,
}

export function PlaceTypeIcon({ code, className }: { code: string; className?: string }) {
  const Icon = placeTypeIcons[code] ?? Tag
  return <Icon aria-hidden className={className} strokeWidth={1.6} />
}
