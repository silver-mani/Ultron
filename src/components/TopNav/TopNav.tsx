import type { ReactNode } from 'react';
import { Button, AICoreButton } from 'alloy-design-system';
import type { TopNavAction } from '../../types/nav';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import {
  TopNavRoot,
  TopNavHeading,
  HeadingText,
  TopNavActions,
  ButtonGroup,
} from './TopNav.styles';

// ── Icons (inline SVG — no external dep needed) ────────────────────────────

function DotsHorizontalIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="2.5" cy="7" r="1.25" fill="currentColor" />
      <circle cx="7" cy="7" r="1.25" fill="currentColor" />
      <circle cx="11.5" cy="7" r="1.25" fill="currentColor" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.25 3.5L8.75 7L5.25 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 2.333v9.334M2.333 7h9.334" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.75 3.5h10.5M1.75 7h10.5M1.75 10.5h10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export interface TopNavProps {
  /** Page heading — accepts a string or any ReactNode (e.g. Alloy Breadcrumb) */
  heading: ReactNode;
  /** Action buttons shown in the right button group */
  actions?: TopNavAction[];
  /** Show the activity/menu icon button */
  showActivityButton?: boolean;
  /** Show the Ponder AI button */
  showPonderButton?: boolean;
  /** Hide the bottom border */
  noBorder?: boolean;
  onActivityClick?: () => void;
  onPonderClick?: () => void;
  onDotsClick?: () => void;
}

export function TopNav({
  heading,
  actions = [],
  showActivityButton = true,
  showPonderButton = true,
  noBorder = false,
  onActivityClick,
  onPonderClick,
  onDotsClick,
}: TopNavProps) {
  const secondaryActions = actions.filter(a => a.variant === 'secondary');
  const primaryActions = actions.filter(a => a.variant === 'primary');
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  return (
    <TopNavRoot $noBorder={noBorder}>
      <TopNavHeading>
        {typeof heading === 'string' ? <HeadingText>{heading}</HeadingText> : heading}
      </TopNavHeading>

      <TopNavActions>
        <ButtonGroup>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onDotsClick}
            aria-label="More options"
            title="More options"
          >
            <DotsHorizontalIcon />
          </Button>

          {secondaryActions.map(action => (
            <Button
              key={action.id}
              variant="secondary"
              size="sm"
              leadingArtwork={<PlusIcon />}
              trailingArtwork={<ChevronRightIcon />}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}

          {primaryActions.map(action => (
            <Button
              key={action.id}
              variant="primary"
              size="sm"
              leadingArtwork={<PlusIcon />}
              trailingArtwork={<ChevronRightIcon />}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </ButtonGroup>

        {showActivityButton && (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onActivityClick}
            aria-label="Activity"
            title="Activity"
          >
            <MenuIcon />
          </Button>
        )}

        {showPonderButton && (
          <AICoreButton dark={prefersDark} onClick={onPonderClick} aria-label="Ponder AI" />
        )}
      </TopNavActions>
    </TopNavRoot>
  );
}
