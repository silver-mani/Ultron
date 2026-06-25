import styled, { css } from 'styled-components';

export const COLLAPSED_WIDTH = '48px';
export const EXPANDED_WIDTH = '240px';

// Shadow from Figma active item spec
const ITEM_ACTIVE_SHADOW = '0px 2px 4px rgba(0,0,0,0.03), 0px 12px 32px rgba(0,0,0,0.06)';

export const NavRoot = styled.nav<{ $isExpanded: boolean }>`
  position: absolute;
  left: 0;
  top: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: ${p => (p.$isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH)};
  /* Collapsed: inset shadow keeps the 32px content area intact (border-right would consume 1px).
     Expanded: real border-right, painted on top of NavInner's background so it's always visible. */
  ${p => p.$isExpanded
    ? css`border-right: 1px solid var(--color-border-opaque, #e8eaee);`
    : css`box-shadow: inset -1px 0 0 var(--color-border-opaque, #e8eaee);`
  }
  background: ${p => (p.$isExpanded ? 'var(--color-bg-primary, white)' : 'var(--color-bg-secondary, #f6f7f9)')};
  overflow: hidden;
  transition: width 200ms ease;
`;

// Inner container (bg-secondary inside white outer when expanded)
export const NavInner = styled.div<{ $isExpanded: boolean }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 8px;
  background: ${p => (p.$isExpanded ? 'var(--color-bg-secondary, #f6f7f9)' : 'transparent')};
  border-radius: ${p => (p.$isExpanded ? '0 6px 6px 0' : '0')};
  overflow: hidden;
`;

export const NavTop = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

export const NavBottom = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
`;

// Workspace / company logo selector
export const WorkspaceSelector = styled.button<{ $isExpanded: boolean }>`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0;
  width: 100%;
  height: 32px;
  background: var(--color-bg-primary, white);
  border: 0.5px solid var(--color-border-transparent, rgba(21, 21, 21, 0.05));
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  flex-shrink: 0;
  transition: background 150ms ease-in-out;

  &:hover {
    background: var(--color-bg-secondary, #f6f7f9);
  }

  &:focus-visible {
    outline: 2px solid var(--color-border-focus, #1969fe);
    outline-offset: 1px;
  }
`;

export const WorkspaceLogo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  font-family: var(--font-sans, 'Geist', sans-serif);
  font-size: 16px;
  font-weight: 500;
  color: var(--color-content-primary, #151515);

  img {
    width: 17px;
    height: 14px;
    object-fit: contain;
  }
`;

export const WorkspaceName = styled.span`
  flex: 1;
  min-width: 0;
  font-family: var(--font-sans, 'Geist', sans-serif);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.084px;
  color: var(--color-content-primary, #151515);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ChevronWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  color: var(--color-content-secondary, #1c222a);
  opacity: 0.6;

  svg {
    width: 16px;
    height: 16px;
  }
`;

// Nav item groups
export const NavGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

// AI gradient token from Alloy design system
const AI_GRADIENT = 'var(--gradient-ai)';

// Wraps each nav item — owns the active bg/shadow; not itself interactive.
// Uses inset box-shadow for the hairline border so it never affects inner dimensions.
export const NavItemWrapper = styled.div<{ $isActive: boolean; $isAi?: boolean }>`
  border-radius: 6px;
  transition: background 150ms ease-in-out, box-shadow 150ms ease-in-out;
  ${p =>
    p.$isActive &&
    !p.$isAi &&
    css`
      background: var(--color-bg-primary, white);
      box-shadow: ${ITEM_ACTIVE_SHADOW}, inset 0 0 0 0.5px var(--color-border-transparent, rgba(21, 21, 21, 0.05));
    `}
  ${p =>
    p.$isActive &&
    p.$isAi &&
    css`
      background: ${AI_GRADIENT};
      box-shadow: ${ITEM_ACTIVE_SHADOW}, inset 0 0 0 0.5px rgba(140, 79, 226, 0.25);
    `}
`;

// Unified nav item button — used in both collapsed and expanded states.
// Height is always exactly 32px so there is no reflow when toggling.
// $isAiActive suppresses the hover overlay so the AI gradient shows cleanly.
export const NavItemBtn = styled.button<{ $isActive: boolean; $isAiActive?: boolean }>`
  all: unset;
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  /* Color cascades to icon (currentColor) and label (inherit) */
  color: ${p => p.$isAiActive
    ? 'var(--color-content-inverse, white)'
    : 'var(--color-content-primary, #151515)'};
  opacity: ${p => (p.$isActive ? 1 : 0.6)};
  transition: background 150ms ease-in-out, opacity 150ms ease-in-out, color 150ms ease-in-out;

  &:hover {
    background: ${p => p.$isAiActive ? 'transparent' : 'var(--color-bg-transparent, rgba(21, 21, 21, 0.05))'};
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid var(--color-border-focus, #1969fe);
    outline-offset: 1px;
  }
`;

// Text label shown only when expanded — inherits color from NavItemBtn
export const NavItemLabelText = styled.span`
  flex: 1;
  min-width: 0;
  font-family: var(--font-sans, 'Geist', sans-serif);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.084px;
  color: inherit;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Icon container — sits at the leading edge of every nav item button
export const NavItemLeadingIcon = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;

  svg, img {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

export const UnreadDot = styled.div`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-content-link, #1969fe);
  pointer-events: none;
`;

export const NavDivider = styled.hr`
  all: unset;
  display: block;
  width: 100%;
  height: 1px;
  background: var(--color-border-opaque, #e8eaee);
  flex-shrink: 0;
`;

// "New" gradient badge
export const NewBadge = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 12px 2px 8px;
  border-radius: 16px;
  background: linear-gradient(
    to bottom,
    rgba(227, 25, 254, 0.18),
    rgba(255, 46, 146, 0.18)
  );
  box-shadow: 0px 12px 32px rgba(0, 0, 0, 0.03);
  font-family: var(--font-sans, 'Geist', sans-serif);
  font-size: 10px;
  font-weight: 600;
  line-height: 14px;
  letter-spacing: 0.02em;
  color: #B01786;
  white-space: nowrap;
  flex-shrink: 0;
`;

// User row at the bottom
export const UserRow = styled.button<{ $isExpanded: boolean }>`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  padding: ${p => (p.$isExpanded ? '6px 0' : '0')};
  transition: background 150ms ease-in-out;

  &:hover {
    background: var(--color-bg-transparent, rgba(21, 21, 21, 0.05));
  }

  &:focus-visible {
    outline: 2px solid var(--color-border-focus, #1969fe);
    outline-offset: 1px;
  }
`;

export const UserAvatar = styled.div<{ $color?: string }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: ${p => p.$color || '#ee9c2d'};
  font-family: var(--font-sans, 'Geist', sans-serif);
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: var(--color-content-secondary, #1c222a);
  flex-shrink: 0;
  margin: 0 4px;
`;

export const UserName = styled.span`
  flex: 1;
  min-width: 0;
  font-family: var(--font-sans, 'Geist', sans-serif);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.084px;
  color: var(--color-content-secondary, #1c222a);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Nav item label
export const NavItemLabel = styled.span`
  flex: 1;
  min-width: 0;
  font-family: var(--font-sans, 'Geist', sans-serif);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.084px;
  color: var(--color-content-primary, #151515);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

// Icon container
export const NavItemIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
`;
