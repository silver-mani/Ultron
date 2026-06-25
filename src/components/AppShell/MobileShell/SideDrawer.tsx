// Left-anchored side drawer — 84% viewport width, slides in from the
// left, dismissed by scrim tap (handled by OverlayScrim), close button,
// or a horizontal swipe-left gesture. Scrim is rendered by the parent
// so drawer + sheets share one backdrop.

import { useEffect, useRef, type ReactNode } from 'react';
import styled, { keyframes } from 'styled-components';
import { XIcon } from 'alloy-design-system';

const slideIn = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
`;

const DrawerRoot = styled.aside`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 84vw;
  max-width: 360px;
  z-index: 901;
  background: var(--color-bg-primary, #ffffff);
  display: flex;
  flex-direction: column;
  box-shadow: 8px 0 24px rgba(0, 0, 0, 0.12);
  animation: ${slideIn} 240ms cubic-bezier(0.22, 0.61, 0.36, 1);
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3, 12px) var(--space-4, 16px);
  border-bottom: 1px solid var(--color-border-opaque, #e8eaee);
  font-family: var(--font-sans, Geist, sans-serif);
`;

const HeaderTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: var(--color-content-primary, #151515);
`;

const CloseButton = styled.button`
  all: unset;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  color: var(--color-content-secondary, #475569);
  &:hover {
    background: var(--color-bg-tertiary, #eceef1);
  }
`;

const Body = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
`;

// ── Swipe-left dismiss ─────────────────────────────────────────────────────
const SWIPE_THRESHOLD_PX = 60;
const SWIPE_MAX_OFF_AXIS_PX = 60;

interface SideDrawerProps {
  title?: string;
  onDismiss: () => void;
  children: ReactNode;
}

export function SideDrawer({ title, onDismiss, children }: SideDrawerProps) {
  const rootRef = useRef<HTMLElement>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startRef.current = { x: t.clientX, y: t.clientY };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!startRef.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startRef.current.x;
      const dy = t.clientY - startRef.current.y;
      startRef.current = null;
      if (dx < -SWIPE_THRESHOLD_PX && Math.abs(dy) < SWIPE_MAX_OFF_AXIS_PX) {
        onDismiss();
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onDismiss]);

  return (
    <DrawerRoot ref={rootRef} role="dialog" aria-modal="true" aria-label={title ?? 'Navigation'}>
      <Header>
        <HeaderTitle>{title ?? 'Navigation'}</HeaderTitle>
        <CloseButton onClick={onDismiss} aria-label="Close navigation">
          <XIcon size={18} />
        </CloseButton>
      </Header>
      <Body>{children}</Body>
    </DrawerRoot>
  );
}
