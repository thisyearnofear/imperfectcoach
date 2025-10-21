import { cn } from "@/lib/utils";

interface EnhancedSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Variant of the skeleton
   * @default "default"
   */
  variant?: "default" | "card" | "text" | "avatar" | "button";
}

/**
 * Enhanced skeleton loader with common presets
 */
export function EnhancedSkeleton({ 
  className, 
  variant = "default",
  ...props 
}: EnhancedSkeletonProps) {
  const baseClasses = "animate-pulse rounded-md bg-muted";
  
  const variantClasses = {
    default: "",
    card: "h-32 w-full",
    text: "h-4 w-full",
    avatar: "h-12 w-12 rounded-full",
    button: "h-10 w-24",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    />
  );
}

/**
 * Common skeleton patterns for loading states
 */
export function SkeletonCard() {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <EnhancedSkeleton variant="text" className="w-3/4" />
      <EnhancedSkeleton variant="text" className="w-full" />
      <EnhancedSkeleton variant="text" className="w-5/6" />
      <EnhancedSkeleton variant="button" className="mt-4" />
    </div>
  );
}

export function SkeletonAnalysis() {
  return (
    <div className="space-y-6 p-6 border-2 border-muted rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-4">
        <EnhancedSkeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <EnhancedSkeleton variant="text" className="w-1/2" />
          <EnhancedSkeleton variant="text" className="w-1/3 h-3" />
        </div>
      </div>
      
      {/* Content blocks */}
      <div className="space-y-4">
        <EnhancedSkeleton variant="card" className="h-24" />
        <EnhancedSkeleton variant="card" className="h-32" />
      </div>
      
      {/* Footer actions */}
      <div className="flex gap-4 pt-4 border-t">
        <EnhancedSkeleton variant="button" className="flex-1" />
        <EnhancedSkeleton variant="button" className="flex-1" />
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <EnhancedSkeleton variant="avatar" className="h-8 w-8" />
          <div className="flex-1 space-y-2">
            <EnhancedSkeleton variant="text" className="w-3/4" />
            <EnhancedSkeleton variant="text" className="w-1/2 h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPaymentStatus() {
  return (
    <div className="p-4 bg-blue-50 rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        <EnhancedSkeleton className="h-4 w-4 rounded-full" />
        <EnhancedSkeleton variant="text" className="w-48 h-4" />
      </div>
      <EnhancedSkeleton variant="text" className="w-32 h-3" />
    </div>
  );
}
