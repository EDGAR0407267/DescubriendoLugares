/** Skeleton for place grids; used as a Suspense fallback. */
export function LoadingState({ items = 6, label }: { items?: number; label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[4/3] rounded-card bg-sunken" />
          <div className="mt-4 h-4 w-2/3 rounded bg-sunken" />
          <div className="mt-2 h-3 w-1/3 rounded bg-sunken" />
        </div>
      ))}
    </div>
  )
}
