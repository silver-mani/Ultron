// 48px top header used on viewports below the mobile breakpoint.
// Layout (left to right): hamburger, breadcrumb dropdowns, search
// icon, avatar. Supports scroll-away: when the parent passes
// `hidden`, the header translates off-screen with a short transition.

import { forwardRef, type MouseEventHandler } from 'react';
import styled from 'styled-components';
import { SearchSmIcon } from 'alloy-design-system';
import { BreadcrumbButton } from './BreadcrumbButton';
import type { UserProfile } from '../../../types/nav';

const HeaderRoot = styled.header<{ $hidden: boolean }>`
  position: sticky;
  top: 0;
  z-index: 800;
  background: var(--color-bg-primary, #ffffff);
  border-bottom: 1px solid var(--color-border-opaque, #e8eaee);
  padding-top: env(safe-area-inset-top);
  transform: ${p => (p.$hidden ? 'translateY(-100%)' : 'translateY(0)')};
  transition: transform 180ms ease-out;
`;

const Row = styled.div`
  height: 48px;
  display: flex;
  align-items: center;
  gap: var(--space-2, 8px);
  padding: 0 var(--space-3, 12px);
`;

const IconButton = styled.button`
  all: unset;
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md, 8px);
  color: var(--color-content-secondary, #475569);
  cursor: pointer;
  flex: 0 0 auto;
  &:hover { background: var(--color-bg-tertiary, #eceef1); }
  &:focus-visible {
    outline: 2px solid var(--color-border-focus, #446cff);
    outline-offset: 2px;
  }
`;

const Crumbs = styled.div`
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  gap: 2px;
`;

const Separator = styled.span`
  flex: 0 0 auto;
  font-size: 14px;
  color: var(--color-content-tertiary, #87919f);
  line-height: 1;
  user-select: none;
`;

const AvatarBtn = styled.button<{ $color?: string }>`
  all: unset;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: ${p => p.$color ?? 'var(--color-bg-tertiary, #eceef1)'};
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-sans, Geist, sans-serif);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  flex: 0 0 auto;
  &:focus-visible {
    outline: 2px solid var(--color-border-focus, #446cff);
    outline-offset: 2px;
  }
`;

/** Simple 3-line hamburger glyph — avoids pulling in another Alloy icon. */
function HamburgerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface MobileHeaderProps {
  primaryLabel: string;
  secondaryLabel?: string;
  tertiaryLabel?: string | null;
  openOverlay: 'drawer' | 'primary' | 'secondary' | 'persona' | null;
  user: UserProfile;
  hidden: boolean;
  onHamburgerClick: MouseEventHandler<HTMLButtonElement>;
  onPrimaryClick: MouseEventHandler<HTMLButtonElement>;
  onSecondaryClick: MouseEventHandler<HTMLButtonElement>;
  onTertiaryClick?: MouseEventHandler<HTMLButtonElement>;
  onSearchClick: MouseEventHandler<HTMLButtonElement>;
  onUserClick?: MouseEventHandler<HTMLButtonElement>;
}

export const MobileHeader = forwardRef<HTMLElement, MobileHeaderProps>(function MobileHeader(
  {
    primaryLabel,
    secondaryLabel,
    tertiaryLabel,
    openOverlay,
    user,
    hidden,
    onHamburgerClick,
    onPrimaryClick,
    onSecondaryClick,
    onTertiaryClick,
    onSearchClick,
    onUserClick,
  },
  ref,
) {
  return (
    <HeaderRoot ref={ref} $hidden={hidden}>
      <Row>
        <IconButton onClick={onHamburgerClick} aria-label="Open navigation">
          <HamburgerIcon size={18} />
        </IconButton>

        <Crumbs>
          <BreadcrumbButton
            label={primaryLabel}
            isOpen={openOverlay === 'primary'}
            onClick={onPrimaryClick}
            ariaLabel="Choose a module"
          />
          {secondaryLabel && (
            <>
              <Separator aria-hidden="true">›</Separator>
              <BreadcrumbButton
                label={secondaryLabel}
                isOpen={openOverlay === 'secondary'}
                onClick={onSecondaryClick}
                ariaLabel="Choose a section"
              />
            </>
          )}
          {tertiaryLabel && (
            <>
              <Separator aria-hidden="true">›</Separator>
              <BreadcrumbButton
                label={tertiaryLabel}
                isOpen={openOverlay === 'persona'}
                onClick={onTertiaryClick ?? (() => {})}
                ariaLabel="Choose a persona"
              />
            </>
          )}
        </Crumbs>

        <IconButton onClick={onSearchClick} aria-label="Search">
          <SearchSmIcon size={18} />
        </IconButton>

        <AvatarBtn onClick={onUserClick} $color={user.avatarColor} aria-label={`User: ${user.name}`}>
          {user.initials}
        </AvatarBtn>
      </Row>
    </HeaderRoot>
  );
});
