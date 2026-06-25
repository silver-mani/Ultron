/* Local Avatar shim.
   The Ultron app was authored against an older Alloy that exported a
   user-photo `Avatar`. The current alloy-design-system no longer ships one
   (it only has `AIAvatar`, an AI brand-mark star). This is a minimal
   stand-in — a circular image with an initials fallback — so the app builds
   and previews. Replace with a real Alloy Avatar when one is available. */

import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_PX: Record<AvatarSize, number> = { xs: 20, sm: 24, md: 32, lg: 40 };

export interface AvatarProps extends Omit<ComponentPropsWithoutRef<'span'>, 'children'> {
  src?: string;
  name?: string;
  alt?: string;
  size?: AvatarSize;
}

function initials(name?: string): string {
  if (!name) return '';
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, name, alt, size = 'md', style, ...rest }, ref) => {
    const px = SIZE_PX[size];
    return (
      <span
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: px,
          height: px,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'var(--color-bg-secondary, #e4e4e7)',
          color: 'var(--color-text-secondary, #52525b)',
          fontSize: Math.round(px * 0.4),
          fontWeight: 600,
          flexShrink: 0,
          ...style,
        }}
        {...rest}
      >
        {src ? (
          <img
            src={src}
            alt={alt ?? name ?? ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          initials(name)
        )}
      </span>
    );
  },
);

Avatar.displayName = 'Avatar';
