// Primary module sheet — lists all modules in their three desktop
// groupings (main / tools / bottom). Tapping a module delegates to the
// parent, which also restores the module's last-visited sub-section.

import { BottomSheet } from './BottomSheet';
import { List, GroupLabel, Row, RowIcon, RowLabel, RowCheck, CheckIcon } from './sheetStyles';
import type { PrimaryNavItem } from '../../../types/nav';

interface PrimarySheetProps {
  activeId: string;
  groups: Array<{ id: string; label: string; items: PrimaryNavItem[] }>;
  onSelect: (moduleId: string) => void;
}

export function PrimarySheet({ activeId, groups, onSelect }: PrimarySheetProps) {
  return (
    <BottomSheet title="Modules" ariaLabel="Choose a module">
      <List>
        {groups.map((group, gi) => (
          <div key={group.id}>
            {gi > 0 && <GroupLabel>{group.label}</GroupLabel>}
            {gi === 0 && <GroupLabel>{group.label}</GroupLabel>}
            {group.items.map(item => {
              const isActive = item.id === activeId;
              return (
                <Row
                  key={item.id}
                  $active={isActive}
                  onClick={() => onSelect(item.id)}
                  aria-pressed={isActive}
                >
                  <RowIcon>{item.icon}</RowIcon>
                  <RowLabel>{item.label}</RowLabel>
                  {isActive && (
                    <RowCheck aria-hidden="true">
                      <CheckIcon size={16} />
                    </RowCheck>
                  )}
                </Row>
              );
            })}
          </div>
        ))}
      </List>
    </BottomSheet>
  );
}
