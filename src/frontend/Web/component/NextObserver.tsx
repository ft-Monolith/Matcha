import { useEffect, useRef, useState } from "react";

interface NextObserverProps {
  hasNext: boolean;
  onNext: () => Promise<void> | void;
  finishedMessage?: string;
}


export function NextObserver({ hasNext, onNext, finishedMessage }: NextObserverProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasNext) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting || loading) return;
      setLoading(true);
      void Promise.resolve(onNext()).finally(() => setLoading(false));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNext, loading, onNext]);

  return (
    <div ref={ref} className="flex justify-center p-4 text-muted-foreground text-sm">
      {loading && "Loading…"}
      {!hasNext && !loading && (finishedMessage ?? "No more results")}
    </div>
  );
}
