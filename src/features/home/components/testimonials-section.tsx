import { useEffect, useRef, useState } from 'react';

import { LandingSectionHeading } from '@/features/home/components/landing-section-heading';
import { TestimonialCard } from '@/features/home/components/testimonial-card';
import { testimonials } from '@/features/home/data/landing-page-content';

export function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Refs keep RAF closure fresh without restarting the loop on state changes
  const hoveringRef = useRef(false);
  const isDraggingRef = useRef(false);
  const isTouchingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const speed = prefersReduced ? 0 : 40; // px/sec — 0 respects reduced-motion but leaves manual scroll intact

    let rafId: number;
    let lastTime: number | null = null;

    function tick(now: number) {
      const container = scrollRef.current;
      if (
        container &&
        lastTime !== null &&
        speed > 0 &&
        !hoveringRef.current &&
        !isDraggingRef.current &&
        !isTouchingRef.current
      ) {
        container.scrollLeft += (speed * (now - lastTime)) / 1000;
        // Seamless loop: jump back when past the first duplicated copy
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft -= container.scrollWidth / 2;
        }
      }
      lastTime = now;
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === 'touch') return; // mobile: native scroll handles it
    const el = scrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    setDragging(true);
    dragStartX.current = e.clientX;
    dragScrollLeft.current = el.scrollLeft;
    el.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current || !scrollRef.current) return;
    scrollRef.current.scrollLeft = dragScrollLeft.current - (e.clientX - dragStartX.current);
  }

  function handlePointerUp() {
    isDraggingRef.current = false;
    setDragging(false);
  }

  return (
    <section className="np-section overflow-hidden">
      <div className="flex flex-col gap-10 sm:gap-16">
        <LandingSectionHeading
          title="Testimonials"
          description="Clients value clear communication, careful delivery, and work that their teams can keep improving after launch."
        />
        <div
          className="relative"
          aria-label="Testimonials"
          aria-roledescription="carousel"
        >
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto select-none sm:gap-8 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseEnter={() => { hoveringRef.current = true; }}
            onMouseLeave={() => { hoveringRef.current = false; }}
            onTouchStart={() => { isTouchingRef.current = true; }}
            onTouchEnd={() => { isTouchingRef.current = false; }}
            onTouchCancel={() => { isTouchingRef.current = false; }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {[...testimonials, ...testimonials].map((testimonial, i) => (
              <div key={`${testimonial.name}-${i}`} className="shrink-0">
                <TestimonialCard {...testimonial} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
