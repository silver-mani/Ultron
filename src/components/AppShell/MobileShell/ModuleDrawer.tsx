// Hamburger drawer — the escape hatch from the bottom sheets. Shows
// every module grouped like the desktop PrimaryNav and expands the
// active module inline with its sub-items. Any child row tap closes
// the drawer.

import { SideDrawer } from './SideDrawer';
import { List, GroupLabel, Row, RowIcon, RowLabel, RowCheck, CheckIcon } from './sheetStyles';
import type { PrimaryNavItem, SecondaryNavMenuEntry } from '../../../types/nav';

interface ModuleDrawerProps {
  activeId: string;
  groups: Array<{ id: string; label: string; items: PrimaryNavItem[] }>;
  currentMenuEntries: SecondaryNavMenuEntry[];
  onSelectModule: (moduleId: string) => void;
  onDismiss: () => void;
}

export function ModuleDrawer({
  activeId,
  groups,
  currentMenuEntries,
  onSelectModule,
  onDismiss,
}: ModuleDrawerProps) {
  return (
    <SideDrawer title="Navigation" onDismiss={onDismiss}>
      <List>
        {groups.map(group => (
          <div key={group.id}>
            <GroupLabel>{group.label}</GroupLabel>
            {group.items.map(item => {
              const isActive = item.id === activeId;
              return (
                <div key={item.id}>
                  <Row
                    $active={isActive}
                    onClick={() => {
                      onSelectModule(item.id);
                      onDismiss();
                    }}
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
                  {isActive && currentMenuEntries.length > 0 && (
                    <div>
                      {currentMenuEntries.map(entry => {
                        if (entry.type === 'single') {
                          const child = entry.item;
                          return (
                            <Row
                              key={child.id}
                              $active={child.isActive}
                              $indent
                              onClick={() => {
                                child.onClick?.();
                                onDismiss();
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
                          );
                        }
                        if (entry.type !== 'group') return null;   // label / divider: not shown in the drawer
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
                                  onDismiss();
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
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </List>
    </SideDrawer>
  );
}
