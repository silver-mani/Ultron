// Breadcrumb dropdown trigger used in the mobile header. Each button
// takes flex: 1 of the breadcrumb row, truncates with ellipsis, and
// shows a small chevron so it reads as a dropdown rather than static
// text. Buttons in the same row match on font size / weight / color
// for a balanced look.

import type { MouseEvent, ReactNode } from 'react';
import styled from 'styled-components';
import { ChevronDownIcon } from 'alloy-design-system';

const TriggerButton = styled.button<{ $active?: boolean }>`
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  flex: 1 1 0;
  min-width: 0;
  padding: 0 var(--space-1, 4px);
  font-family: var(--font-sans, Geist, sans-serif);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  color: var(--color-content-primary, #151515);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  height: 32px;
  box-sizing: border-box;

  background: ${p => (p.$active ? 'var(--color-bg-tertiary, #eceef1)' : 'transparent')};

  &:hover {
    background: var(--color-bg-tertiary, #eceef1);
  }
  &:focus-visible {
    outline: 2px solid var(--color-border-focus, #446cff);
    outline-offset: 2px;
  }
`;

const Label = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
`;

const Caret = styled.span`
  display: inline-flex;
  align-items: center;
  color: var(--color-content-tertiary, #87919f);
  flex: 0 0 auto;
`;

interface BreadcrumbButtonProps {
  label: ReactNode;
  isOpen?: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  ariaLabel?: string;
}

export function BreadcrumbButton({ label, isOpen, onClick, ariaLabel }: BreadcrumbButtonProps) {
  return (
    <TriggerButton
      type="button"
      $active={isOpen}
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={!!isOpen}
      aria-label={ariaLabel}
    >
      <Label>{label}</Label>
      <Caret>
        <ChevronDownIcon size={14} />
      </Caret>
    </TriggerButton>
  );
}
