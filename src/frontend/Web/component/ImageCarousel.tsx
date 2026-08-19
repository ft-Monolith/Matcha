import { useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@shadcn/lib/utils";

interface CarouselImage {
  id: string;
  url: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  overlay?: ReactNode;
  fallback?: ReactNode;
  className?: string;
  alt?: string;
}

const SWIPE_THRESHOLD = 40;


export function ImageCarousel({ images, overlay, fallback, className, alt = "" }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const count = images.length;
  const clamped = count > 0 ? Math.min(index, count - 1) : 0;

  function go(delta: number) {
    if (count <= 1) return;
    setIndex((i) => (i + delta + count) % count);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
    touchStartX.current = null;
  }

  return (
    <div
      className={cn(
        "group relative aspect-4/5 w-full overflow-hidden bg-muted select-none",
        className,
      )}
      tabIndex={count > 1 ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {count === 0 ? (
        <div className="flex h-full w-full items-center justify-center">{fallback}</div>
      ) : (
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${clamped * 100}%)` }}
        >
          {images.map((img) => (
            <img
              key={img.id}
              src={img.url}
              alt={alt}
              draggable={false}
              className="h-full w-full shrink-0 grow-0 basis-full object-cover"
            />
          ))}
        </div>
      )}

      {overlay}

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={() => go(-1)}
            className="absolute top-1/2 left-2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black/55"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={() => go(1)}
            className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur-sm transition group-hover:opacity-100 focus-visible:opacity-100 hover:bg-black/55"
          >
            <ChevronRight className="size-5" />
          </button>

          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {images.map((img, i) => (
              <button
                type="button"
                key={img.id}
                aria-label={`Go to photo ${i + 1}`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full bg-white/60 transition-all",
                  i === clamped ? "w-5 bg-white" : "w-1.5 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
