import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Renders its children only once the visitor scrolls near it, so lower
 * front-page sections don't fetch data or images up front.
 * `children` may be a function receiving `visible` to gate queries.
 */
export function LazySection({
  children,
  minHeight = 320,
  rootMargin = "400px",
  className,
}: {
  children: (visible: boolean) => ReactNode;
  minHeight?: number;
  rootMargin?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} className={className} style={visible ? undefined : { minHeight }}>
      {children(visible)}
    </div>
  );
}

/** Grey product-box shapes shown while products load. */
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="brand-card overflow-hidden" aria-hidden>
          <div className="aspect-4/5 animate-pulse bg-muted" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}
