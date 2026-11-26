import { useEffect, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

const decimalPlaces = (value: number) => {
  const decimals = value.toString().split('.')[1];
  return decimals && Number(decimals) !== 0 ? decimals.length : 0;
};

/** Settles quickly, then eases into place, like the spring it replaces. */
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * Counts from `from` to `to` once the number scrolls into view. Uses
 * requestAnimationFrame instead of Motion, which kept a large library on the
 * home page's critical path for this one effect.
 */
export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const start = direction === 'down' ? to : from;
  const end = direction === 'down' ? from : to;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const places = Math.max(decimalPlaces(from), decimalPlaces(to));
    const format = new Intl.NumberFormat('en-US', {
      useGrouping: Boolean(separator),
      minimumFractionDigits: places,
      maximumFractionDigits: places,
    });
    const show = (value: number) => {
      const text = format.format(value);
      element.textContent = separator ? text.replace(/,/g, separator) : text;
    };

    show(start);
    if (!startWhen) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    let frame = 0;
    let delayTimer = 0;
    let endTimer = 0;

    const run = () => {
      onStart?.();

      if (reduceMotion) {
        show(end);
        onEnd?.();
        return;
      }

      const startedAt = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - startedAt) / (duration * 1000), 1);
        show(start + (end - start) * easeOutExpo(progress));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      endTimer = window.setTimeout(() => onEnd?.(), duration * 1000);
    };

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      delayTimer = window.setTimeout(run, delay * 1000);
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
      window.clearTimeout(delayTimer);
      window.clearTimeout(endTimer);
      cancelAnimationFrame(frame);
    };
  }, [start, end, from, to, delay, duration, separator, startWhen, onStart, onEnd]);

  return <span className={className} ref={ref} />;
}
