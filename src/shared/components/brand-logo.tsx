import { Link } from '@tanstack/react-router';

import { cn } from '@/lib/utils';
import { assetUrl } from '@/shared/config/site';

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <Link
      to="/"
      className={cn(
        'np-focus inline-flex min-h-11 items-center rounded-sm transition-opacity duration-(--np-duration-fast) hover:opacity-90',
        className,
      )}
      aria-label="NetPro home"
    >
      <img
        src={assetUrl('/assets/netpro/logo.webp')}
        // Shown at most 176px wide; the 480px copy is plenty, even on retina.
        srcSet={`${assetUrl('/assets/netpro/logo-480w.webp')} 480w, ${assetUrl('/assets/netpro/logo.webp')} 800w`}
        sizes="176px"
        // Intrinsic size, so the browser reserves the space before it loads.
        width={800}
        height={267}
        alt=""
        className="h-10 w-auto max-w-40 object-contain sm:h-11 sm:max-w-44"
        aria-hidden="true"
      />
    </Link>
  );
}
