// Third-slot persona sheet — only shown when a persona detail page is
// open. Lists every persona with its role as supporting text. Tap
// picks a different persona without leaving the detail view.

import { BottomSheet } from './BottomSheet';
import { List, Row, RowLabel, RowCheck, CheckIcon } from './sheetStyles';
import type { Persona } from '../../../data/mockPersonas';
import styled from 'styled-components';

const PersonaLabelStack = styled.span`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1 1 auto;
  min-width: 0;
`;

const PrimaryText = styled.span`
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SecondaryText = styled.span`
  font-size: 12px;
  color: var(--color-content-tertiary, #87919f);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

interface PersonaSheetProps {
  personas: Persona[];
  activeId: string | null;
  onSelect: (personaId: string) => void;
}

export function PersonaSheet({ personas, activeId, onSelect }: PersonaSheetProps) {
  return (
    <BottomSheet title="Personas" ariaLabel="Choose a persona">
      <List>
        {personas.map(p => {
          const isActive = p.id === activeId;
          return (
            <Row
              key={p.id}
              $active={isActive}
              onClick={() => onSelect(p.id)}
              aria-pressed={isActive}
            >
              <RowLabel as="span">
                <PersonaLabelStack>
                  <PrimaryText>{p.name}</PrimaryText>
                  <SecondaryText>{p.role}</SecondaryText>
                </PersonaLabelStack>
              </RowLabel>
              {isActive && (
                <RowCheck aria-hidden="true">
                  <CheckIcon size={16} />
                </RowCheck>
              )}
            </Row>
          );
        })}
      </List>
    </BottomSheet>
  );
}
