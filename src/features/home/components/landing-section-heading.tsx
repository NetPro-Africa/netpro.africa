import { cn } from '@/lib/utils'

type LandingSectionHeadingProps = {
  eyebrow?: string
  label?: string
  title: string
  description?: string
  className?: string
  /** Set false when the heading mounts after page load (async content):
   * the page's reveal observer only sees elements present on mount. */
  reveal?: boolean
}

export function LandingSectionHeading({
  eyebrow = 'Our',
  label,
  title,
  description,
  className,
  reveal = true,
}: LandingSectionHeadingProps) {
  const revealAttr = reveal ? 'title' : undefined

  return (
    <div className={cn('mx-auto flex max-w-4xl flex-col items-center gap-5 text-center', className)}>
      {label ? (
        <p
          className="rounded-full border border-white/14 bg-white/[0.04] px-4 py-1.5 text-sm font-medium text-[color:var(--np-muted)]"
          data-reveal={revealAttr}
        >
          {label}
        </p>
      ) : null}
      <h2
        className="font-heading text-[clamp(2.25rem,4.5vw,4rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground"
        data-reveal={revealAttr}
      >
        {eyebrow ? (
          <>
            <span className="text-[color:var(--np-subtle)]">{eyebrow}</span>{' '}
          </>
        ) : null}
        <span>{title}</span>
      </h2>
      {description ? (
        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg" data-reveal={revealAttr}>
          {description}
        </p>
      ) : null}
    </div>
  )
}
