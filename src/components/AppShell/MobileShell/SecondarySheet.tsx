// Secondary sub-section sheet. Renders the current module's
// menuEntries (the same structure SecondaryNav gets on desktop),
// flattening groups into a list with a group-label row above their
// children. Tap fires the entry's onClick (which already updates
// secActiveId and the URL hash).

import { BottomSheet } from './BottomSheet';
import { List, GroupLabel, Row, RowIcon, RowLabel, RowCheck, CheckIcon } from './sheetStyles';
import type { SecondaryNavMenuEntry } from '../../../types/nav';

interface SecondarySheetProps {
  moduleLabel: string;
  entries: SecondaryNavMenuEntry[];
  onSelect: () => void;
}

export function SecondarySheet({ moduleLabel, entries, onSelect }: SecondarySheetProps) {
  return (
    <BottomSheet title={moduleLabel} ariaLabel={`${moduleLabel} sections`}>
      <List>
        {entries.map((entry) => {
          if (entry.type === 'single') {
            const item = entry.item;
            return (
              <Row
                key={item.id}
                $active={item.isActive}
                onClick={() => {
                  item.onClick?.();
                  onSelect();
                }}
                aria-pressed={!!item.isActive}
              >
                <RowIcon>{item.icon}</RowIcon>
                <RowLabel>{item.label}</RowLabel>
                {item.isActive && (
                  <RowCheck aria-hidden="true">
                    <CheckIcon size={16} />
                  </RowCheck>
                )}
              </Row>
            );
          }
          if (entry.type !== 'group') return null;   // label / divider: not shown in the sheet
          const group = entry.group;
          return (
            <div key={group.id}>
              <GroupLabel>{group.label}</GroupLabel>
              {group.children.map(child => (
                <Row
                  key={child.id}
                  $active={child.isActive}
                  $indent
                  onClick={() => {
                    child.onClick?.();
                    onSelect();
                  }}
                  aria-pressed={!!child.isActive}
                >
                  <RowIcon>{child.icon}</RowIcon>
                  <RowLabel>{child.label}</RowLabel>
                  {child.isActive && (
                    <RowCheck aria-hidden="true">
                      <CheckIcon size={16} />
                    </RowCheck>
                  )}
                </Row>
              ))}
            </div>
          );
        })}
      </List>
    </BottomSheet>
  );
}
