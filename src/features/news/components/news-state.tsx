import { RotateCwIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type NewsStateProps = {
  title: string;
  detail: string;
  icon?: ReactNode;
  onRetry?: () => void;
  isRetrying?: boolean;
  action?: ReactNode;
};

/** Empty, error and not-found states for the news pages. */
export function NewsState({
  title,
  detail,
  icon,
  onRetry,
  isRetrying = false,
  action,
}: NewsStateProps) {
  return (
    <div
      className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-(--np-radius-xl) border border-white/10 bg-white/[0.02] px-6 py-12 text-center"
      role="status"
    >
      {icon ? <div className="text-(--np-subtle)">{icon}</div> : null}
      <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
      <p className="text-base leading-7 text-muted-foreground">{detail}</p>
      {onRetry ? (
        <Button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-2 h-12 rounded-full px-6 text-base active:scale-[0.97]"
        >
          <RotateCwIcon
            className={isRetrying ? 'animate-spin motion-reduce:animate-none' : undefined}
            aria-hidden="true"
          />
          {isRetrying ? 'Trying again…' : 'Try again'}
        </Button>
      ) : null}
      {action}
    </div>
  );
}
