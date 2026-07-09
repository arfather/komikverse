interface SkeletonCardProps {
  variant?: "grid" | "list" | "featured";
}

export default function SkeletonCard({ variant = "grid" }: SkeletonCardProps) {
  if (variant === "list") {
    return (
      <div className="flex gap-4 p-3 rounded-xl bg-panel border border-border-subtle animate-pulse">
        <div className="w-24 h-32 rounded-lg shimmer flex-shrink-0" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-3/4 rounded shimmer" />
          <div className="h-3 w-1/2 rounded shimmer" />
          <div className="h-3 w-2/3 rounded shimmer" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-14 rounded-full shimmer" />
            <div className="h-5 w-14 rounded-full shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "featured") {
    return (
      <div className="flex gap-6 p-4 rounded-xl bg-panel border border-border-subtle animate-pulse">
        <div className="w-40 h-56 rounded-lg shimmer flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-6 w-2/3 rounded shimmer" />
          <div className="h-4 w-1/3 rounded shimmer" />
          <div className="h-3 w-full rounded shimmer" />
          <div className="h-3 w-5/6 rounded shimmer" />
          <div className="h-3 w-4/6 rounded shimmer" />
          <div className="flex gap-2 pt-2">
            <div className="h-8 w-24 rounded-lg shimmer" />
            <div className="h-8 w-24 rounded-lg shimmer" />
          </div>
        </div>
      </div>
    );
  }

  // grid variant
  return (
    <div className="rounded-xl bg-panel border border-border-subtle overflow-hidden animate-pulse">
      <div className="aspect-[3/4] shimmer" />
      <div className="p-3 space-y-2">
        <div className="h-3.5 w-4/5 rounded shimmer" />
        <div className="h-3 w-2/5 rounded shimmer" />
        <div className="flex items-center justify-between">
          <div className="h-3 w-12 rounded shimmer" />
          <div className="h-3 w-8 rounded shimmer" />
        </div>
      </div>
    </div>
  );
}
