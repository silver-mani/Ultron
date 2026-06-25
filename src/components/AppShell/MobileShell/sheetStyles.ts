// Shared styled primitives for the mobile sheets + drawer contents.
// Kept here so PrimarySheet, SecondarySheet, PersonaSheet, and
// ModuleDrawer can render consistent rows without duplicating CSS.

import styled from 'styled-components';
import { CheckIcon } from 'alloy-design-system';

export const List = styled.div`
  display: flex;
  flex-direction: column;
  padding: var(--space-1, 4px) 0;
`;

export const GroupLabel = styled.div`
  padding: var(--space-3, 12px) var(--space-5, 20px) var(--space-2, 8px);
  font-family: var(--font-sans, Geist, sans-serif);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-content-tertiary, #87919f);
`;

export const Row = styled.button<{ $active?: boolean; $indent?: boolean }>`
  all: unset;
  display: flex;
  align-items: center;
  gap: var(--space-3, 12px);
  padding: var(--space-3, 12px) var(--space-5, 20px);
  padding-left: ${p => (p.$indent ? 'calc(var(--space-5, 20px) + 24px)' : 'var(--space-5, 20px)')};
  font-family: var(--font-sans, Geist, sans-serif);
  font-size: 15px;
  line-height: 1.3;
  color: var(--color-content-primary, #151515);
  cursor: pointer;
  min-height: 44px;
  box-sizing: border-box;

  font-weight: ${p => (p.$active ? 600 : 400)};
  background: ${p => (p.$active ? 'var(--color-bg-secondary, #f6f7f9)' : 'transparent')};

  &:hover {
    background: var(--color-bg-tertiary, #eceef1);
  }
  &:focus-visible {
    outline: 2px solid var(--color-border-focus, #446cff);
    outline-offset: -2px;
  }
`;

export const RowIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: var(--color-content-secondary, #475569);
  flex: 0 0 auto;
`;

export const RowLabel = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RowCheck = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-content-link, #446cff);
  flex: 0 0 auto;
  width: 20px;
  height: 20px;
`;

export { CheckIcon };
