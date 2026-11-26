import { useEffect, useRef, type RefObject } from 'react';

/**
 * Thin bar under the header showing how far through the article the reader
 * is. It maps scroll position directly (no easing), so it's fine with reduced
 * motion. Hidden from assistive tech: it repeats what the scrollbar says.
 */
export function ReadingProgress({
  targetRef,
}: {
  targetRef: RefObject<HTMLElement | null>;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const target = targetRef.current;
      const bar = barRef.current;
      if (!target || !bar) return;

      const rect = target.getBoundingClientRect();
      const distance = rect.height - window.innerHeight;
      const progress =
        distance <= 0 ? (rect.top <= 0 ? 1 : 0) : Math.min(1, Math.max(0, -rect.top / distance));

      bar.style.transform = `scaleX(${progress})`;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [targetRef]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full origin-left bg-primary"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}
