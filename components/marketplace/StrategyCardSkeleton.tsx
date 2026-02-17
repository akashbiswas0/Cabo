export default function StrategyCardSkeleton() {
  return (
    <div
      className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 animate-pulse"
      aria-hidden
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="h-5 w-2/3 rounded bg-white/10" />
        <div className="h-4 w-10 rounded bg-white/10 shrink-0" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-3 w-full rounded bg-white/10" />
        <div className="h-3 w-3/4 rounded bg-white/10" />
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="h-6 w-16 rounded-lg bg-white/10" />
        <div className="h-4 w-24 rounded bg-white/10" />
      </div>
      <div className="flex items-center justify-between text-sm mt-4">
        <div className="h-4 w-28 rounded bg-white/10" />
        <div className="h-4 w-16 rounded bg-white/10" />
      </div>
    </div>
  );
}
