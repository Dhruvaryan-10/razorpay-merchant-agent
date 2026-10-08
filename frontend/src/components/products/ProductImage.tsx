'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

type Size = 'thumb' | 'tile' | 'hero';

const frame: Record<Size, string> = {
  thumb: 'h-8 w-8 rounded-sm text-[11px]',
  tile: 'aspect-[4/3] w-full rounded-sm text-[17px]',
  hero: 'aspect-[4/3] w-full rounded-md text-[32px]',
};

/**
 * The store's own product image when the API provides one. Otherwise a
 * neutral typographic placeholder (initials on the well surface): never
 * stock photography and never a broken image icon.
 */
export function ProductImage({
  src,
  name,
  size,
  className,
}: {
  src: string | null | undefined;
  name: string;
  size: Size;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = src && !failed;

  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden bg-well shadow-[inset_0_0_0_1px_rgb(var(--line))]',
        frame[size],
        className
      )}
    >
      {showImage ? (
        // Store images live on arbitrary merchant domains, so next/image's
        // remote allow-list doesn't apply; a lazy plain <img> is the right tool.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden className={cn('select-none font-medium tracking-[-0.02em]', size === 'thumb' ? 'text-ink-3' : 'text-ink-4')}>
          {initials(name)}
        </span>
      )}
    </span>
  );
}
