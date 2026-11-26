import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import {
  ArrowRightIcon,
  CompassIcon,
  HomeIcon,
  RotateCwIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { navigationItems } from '@/shared/config/navigation';
import { siteName } from '@/shared/config/seo';
import {
  canReloadForNewVersion,
  isStaleBuildError,
  reloadForNewVersion,
} from '@/shared/lib/stale-build';

/** Keeps a page out of search results while it is on screen. */
function useNoIndex(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | ${siteName}`;

    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);

    return () => {
      meta.remove();
      document.title = previousTitle;
    };
  }, [title]);
}

const actionClass =
  'np-focus h-12 rounded-full px-6 text-base font-medium transition-[background-color,box-shadow,transform,border-color] duration-(--np-duration-fast) ease-(--np-ease-out) active:scale-[0.97]';
const primaryClass =
  'border-primary-fill bg-primary-fill text-primary-foreground shadow-(--np-shadow-blue) hover:bg-(--np-blue-strong)';
const quietClass =
  'border-white/10 bg-white/[0.07] text-foreground hover:bg-white/10';

function StatusLayout({
  icon,
  eyebrow,
  title,
  detail,
  actions,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  detail: string;
  actions: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="np-container flex min-h-[70svh] items-center justify-center py-20 sm:py-28">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:ease-out">
        <span
          className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-primary"
          aria-hidden="true"
        >
          {icon}
        </span>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
          {eyebrow}
        </p>
        <h1 className="font-heading text-[clamp(2rem,4.5vw,3rem)] font-semibold leading-[1.1] tracking-tight text-balance text-foreground">
          {title}
        </h1>
        <p className="text-lg leading-8 text-pretty text-muted-foreground">
          {detail}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
        {children}
      </div>
    </section>
  );
}

function HomeButton({ variant }: { variant: 'primary' | 'quiet' }) {
  return (
    <Button
      asChild
      className={cn(actionClass, variant === 'primary' ? primaryClass : quietClass)}
    >
      <Link to="/">
        <HomeIcon aria-hidden="true" />
        Go to homepage
      </Link>
    </Button>
  );
}

/**
 * Shown only on a first visit while the page's code is still downloading.
 * It holds a full screen of space so the call-to-action and footer below
 * <main> never jump up into view and then slide back down.
 */
export function PageLoading() {
  return (
    <div className="min-h-svh" role="status" aria-busy="true">
      <span className="sr-only">Loading page…</span>
    </div>
  );
}

export function NotFoundPage() {
  useNoIndex('Page not found');

  const suggestions = navigationItems.filter((item) => item.path !== '/');

  return (
    <StatusLayout
      icon={<CompassIcon className="size-6" />}
      eyebrow="Error 404"
      title="We can’t find that page"
      detail="The link may be out of date, or the address may have a typo. Try one of these instead."
      actions={
        <>
          <HomeButton variant="primary" />
          <Button asChild className={cn(actionClass, quietClass)}>
            <Link to="/contact-us">Contact us</Link>
          </Button>
        </>
      }
    >
      <nav aria-label="Popular pages" className="mt-6 w-full">
        <ul className="grid gap-2 sm:grid-cols-2">
          {suggestions.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className="np-focus group flex min-h-14 items-center justify-between gap-3 rounded-(--np-radius-lg) border border-white/8 bg-white/[0.02] px-5 py-3 text-left transition-[background-color,border-color] duration-(--np-duration-fast) hover:border-white/15 hover:bg-white/[0.05]"
              >
                <span className="text-base font-medium text-foreground">
                  {item.title}
                </span>
                <ArrowRightIcon
                  className="size-4 shrink-0 text-(--np-subtle) transition-transform duration-(--np-duration-fast) group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </StatusLayout>
  );
}

export function RouteErrorPage({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  const staleBuild = isStaleBuildError(error);
  const [isRetrying, setIsRetrying] = useState(false);
  // A stale build is fixed by one fresh load; show a calm message meanwhile.
  const [isReloading, setIsReloading] = useState(
    () => staleBuild && canReloadForNewVersion(),
  );

  useNoIndex('Something went wrong');

  useEffect(() => {
    if (isReloading) reloadForNewVersion();
    else console.error(error);
  }, [error, isReloading]);

  if (isReloading) {
    return (
      <StatusLayout
        icon={<RotateCwIcon className="size-6 animate-spin motion-reduce:animate-none" />}
        eyebrow="Updating"
        title="Loading the latest version"
        detail="The site was updated since you opened it. This takes a second."
        actions={null}
      />
    );
  }

  async function retry() {
    if (staleBuild) {
      setIsReloading(true);
      return;
    }
    setIsRetrying(true);
    reset();
    await router.invalidate();
    setIsRetrying(false);
  }

  return (
    <StatusLayout
      icon={<TriangleAlertIcon className="size-6" />}
      eyebrow="Something went wrong"
      title={staleBuild ? 'This page didn’t finish loading' : 'This page ran into a problem'}
      detail={
        staleBuild
          ? 'Check your internet connection, then reload the page.'
          : 'It’s not something you did. Try again, or head back to the homepage. If it keeps happening, please contact us.'
      }
      actions={
        <>
          <Button
            type="button"
            onClick={retry}
            disabled={isRetrying}
            className={cn(actionClass, primaryClass)}
          >
            <RotateCwIcon
              className={isRetrying ? 'animate-spin motion-reduce:animate-none' : undefined}
              aria-hidden="true"
            />
            {isRetrying ? 'Trying again…' : staleBuild ? 'Reload page' : 'Try again'}
          </Button>
          <HomeButton variant="quiet" />
        </>
      }
    >
      {import.meta.env.DEV && error instanceof Error ? (
        <details className="mt-6 w-full rounded-(--np-radius-lg) border border-white/8 bg-white/[0.02] p-4 text-left">
          <summary className="cursor-pointer text-sm font-medium text-(--np-subtle)">
            Technical details (only shown in development)
          </summary>
          <pre className="mt-3 overflow-auto text-xs leading-5 whitespace-pre-wrap text-muted-foreground">
            {error.stack ?? error.message}
          </pre>
        </details>
      ) : null}
    </StatusLayout>
  );
}
