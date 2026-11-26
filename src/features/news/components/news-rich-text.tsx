import { useMemo } from 'react';

import { cn } from '@/lib/utils';

const BLOCKED_TAGS = 'script, style, iframe, object, embed, form, input, button, link, meta';

/**
 * The HTML comes from NetPro's own CMS editor, but it is still cleaned before
 * rendering: no scripts or embeds, no inline event handlers, no
 * `javascript:` links. Outside links open in a new tab.
 */
function cleanHtml(html: string) {
  if (typeof DOMParser === 'undefined') return '';

  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll(BLOCKED_TAGS).forEach((node) => node.remove());

  doc.body.querySelectorAll('*').forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();

      if (
        name.startsWith('on') ||
        name === 'style' ||
        ((name === 'href' || name === 'src') && value.startsWith('javascript:'))
      ) {
        element.removeAttribute(attribute.name);
      }
    }

    if (element instanceof HTMLAnchorElement && /^https?:/i.test(element.href)) {
      element.target = '_blank';
      element.rel = 'noreferrer';
    }

    if (element instanceof HTMLImageElement) {
      element.loading = 'lazy';
    }
  });

  return doc.body.innerHTML;
}

/** Gives CMS article HTML this site's type scale and spacing. */
export function NewsRichText({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const safeHtml = useMemo(() => cleanHtml(html), [html]);

  return (
    <div
      className={cn(
        // Body copy: ~19px, generous leading, high contrast for long reading.
        'text-[1.1875rem] leading-[1.8] text-foreground/85 [&_p]:text-pretty',
        '[&_p]:mb-7 [&>*:last-child]:mb-0',
        // The opening paragraph reads as a lead.
        '[&>p:first-of-type]:text-[1.3125rem] [&>p:first-of-type]:leading-[1.7] [&>p:first-of-type]:text-foreground',
        '[&_:is(h1,h2,h3,h4)]:mt-12 [&_:is(h1,h2,h3,h4)]:mb-4 [&_:is(h1,h2,h3,h4)]:font-semibold [&_:is(h1,h2,h3,h4)]:leading-tight [&_:is(h1,h2,h3,h4)]:tracking-[-0.02em] [&_:is(h1,h2,h3,h4)]:text-balance [&_:is(h1,h2,h3,h4)]:text-foreground',
        '[&_h1]:text-[1.875rem] [&_h2]:text-[1.75rem] [&_h3]:text-[1.375rem] [&_h4]:text-xl',
        '[&_strong]:font-semibold [&_strong]:text-foreground [&_em]:italic',
        '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/40 [&_a]:underline-offset-4 [&_a]:transition-colors hover:[&_a]:decoration-primary',
        '[&_ul]:mb-7 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-7 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-2.5 [&_li]:pl-1 [&_li::marker]:text-primary',
        '[&_blockquote]:my-10 [&_blockquote]:border-l-[3px] [&_blockquote]:border-primary [&_blockquote]:pl-6 [&_blockquote]:text-[1.375rem] [&_blockquote]:leading-[1.6] [&_blockquote]:font-medium [&_blockquote]:text-foreground',
        '[&_hr]:my-12 [&_hr]:border-white/10',
        '[&_img]:my-10 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-(--np-radius-lg)',
        // Alignment classes from the CMS's Quill editor
        '[&_.ql-align-justify]:text-justify [&_.ql-align-center]:text-center [&_.ql-align-right]:text-right',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
