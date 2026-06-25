// Shared backdrop used by every mobile overlay (sheets + drawer). Sits
// at 45% opacity over the content, dismisses on tap or ESC, and locks
// body scroll while visible so the sheet isn't driving the page under
// it.

import { useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Scrim = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(21, 21, 21, 0.45);
  z-index: 900;
  animation: ${fadeIn} 160ms ease-out;
`;

interface OverlayScrimProps {
  onDismiss: () => void;
}

export function OverlayScrim({ onDismiss }: OverlayScrimProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onDismiss]);

  return <Scrim onClick={onDismiss} aria-hidden="true" />;
}
