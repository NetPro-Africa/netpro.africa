import { CheckIcon, LinkIcon, Share2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

type ArticleShareProps = {
  url: string;
  title: string;
  /** `compact` = icon buttons for the byline; `full` = labelled row for the end. */
  variant?: 'compact' | 'full';
  className?: string;
};

const pillClass =
  'np-focus inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-medium text-foreground transition-[background-color,border-color,transform] duration-(--np-duration-fast) hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.96]';

const iconButtonClass =
  'np-focus inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-foreground transition-[background-color,border-color,transform] duration-(--np-duration-fast) hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.94]';

export function ArticleShare({
  url,
  title,
  variant = 'full',
  className,
}: ArticleShareProps) {
  const [copied, setCopied] = useState(false);
  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied', { description: 'Paste it anywhere to share this story.' });
    } catch {
      toast.error('Couldn’t copy the link', {
        description: 'Copy it from your browser’s address bar instead.',
      });
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // The person closed the share sheet; nothing to report.
    }
  }

  const copyIcon = copied ? (
    <CheckIcon className="size-4 text-primary motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-200" aria-hidden="true" />
  ) : (
    <LinkIcon className="size-4" aria-hidden="true" />
  );

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <button
          type="button"
          onClick={copyLink}
          className={iconButtonClass}
          aria-label={copied ? 'Link copied' : 'Copy link to this story'}
          title="Copy link"
        >
          {copyIcon}
        </button>
        {canNativeShare ? (
          <button
            type="button"
            onClick={nativeShare}
            className={iconButtonClass}
            aria-label="Share this story"
            title="Share"
          >
            <Share2Icon className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    );
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const networks = [
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: 'X',
      href: `https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
  ];

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <button type="button" onClick={copyLink} className={pillClass}>
        {copyIcon}
        {copied ? 'Copied' : 'Copy link'}
      </button>
      {networks.map((network) => (
        <a
          key={network.label}
          href={network.href}
          target="_blank"
          rel="noreferrer"
          className={pillClass}
          aria-label={`Share on ${network.label}`}
        >
          {network.label}
        </a>
      ))}
    </div>
  );
}
