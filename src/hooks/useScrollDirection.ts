// Scroll-direction hook with a dead zone so small deltas (iOS rubber-band,
// trackpad noise) don't toggle the mobile header. Returns:
//   - 'up'   after scrolling up with |delta| > deadZonePx
//   - 'down' after scrolling down with |delta| > deadZonePx *and*
//            scrollY > topThresholdPx (so the header never hides while
//            the user is still near the top)
//   - null until the first meaningful scroll event (initial render state)

import { useEffect, useRef, useState } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

export interface UseScrollDirectionOptions {
  /** Minimum |delta| in px before a direction change fires. Default 8. */
  deadZonePx?: number;
  /** Don't return 'down' until scrollY exceeds this. Default 20. */
  topThresholdPx?: number;
  /** Element to observe. Default: window. */
  target?: HTMLElement | null;
}

export function useScrollDirection({
  deadZonePx = 8,
  topThresholdPx = 20,
  target,
}: UseScrollDirectionOptions = {}): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>(null);
  const lastYRef = useRef<number>(0);

  useEffect(() => {
    const getY = () =>
      target
        ? target.scrollTop
        : typeof window !== 'undefined'
          ? window.scrollY
          : 0;

    lastYRef.current = getY();

    const onScroll = () => {
      const y = getY();
      const delta = y - lastYRef.current;

      if (Math.abs(delta) < deadZonePx) return;

      if (delta > 0 && y > topThresholdPx) {
        setDirection('down');
      } else if (delta < 0) {
        setDirection('up');
      }
      lastYRef.current = y;
    };

    const listenerTarget: EventTarget =
      target ?? (typeof window !== 'undefined' ? window : ({} as EventTarget));

    listenerTarget.addEventListener?.('scroll', onScroll, { passive: true });
    return () => {
      listenerTarget.removeEventListener?.('scroll', onScroll);
    };
  }, [deadZonePx, topThresholdPx, target]);

  return direction;
}
