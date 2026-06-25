import { useState } from 'react';
import { Badge } from 'alloy-design-system';
import type { PrimaryNavItem, UserProfile, Workspace } from '../../types/nav';
import {
  NavRoot, NavInner, NavTop, NavBottom,
  WorkspaceSelector, WorkspaceLogo, WorkspaceName, ChevronWrap,
  NavGroup, NavItemWrapper, NavItemBtn, NavItemLeadingIcon, NavItemLabelText,
  UnreadDot, NavDivider,
  UserRow, UserAvatar, UserName,
} from './PrimaryNav.styles';
import { ChevronDownIcon, SettingsIcon } from './NavIcons';

// ── NavItem sub-component ───────────────────────────────────────────────────
// Uses a single NavItemBtn (height always 32px) in both collapsed and expanded
// states to prevent any reflow / height change during the transition.

function NavItem({
  item,
  isExpanded,
  showNewBadge,
  isAi,
}: {
  item: PrimaryNavItem;
  isExpanded: boolean;
  showNewBadge?: boolean;
  isAi?: boolean;
}) {
  const isActive = item.isActive ?? false;

  return (
    <NavItemWrapper $isActive={isActive} $isAi={isAi}>
      <NavItemBtn
        $isActive={isActive}
        $isAiActive={isActive && !!isAi}
        onClick={item.onClick}
        aria-current={isActive ? 'page' : undefined}
        title={!isExpanded ? item.label : undefined}
      >
        <NavItemLeadingIcon>
          {item.hasUnread && <UnreadDot />}
          {(isActive && item.activeIcon) ? item.activeIcon : item.icon}
        </NavItemLeadingIcon>
        {isExpanded && (
          <NavItemLabelText>{item.label}</NavItemLabelText>
        )}
        {isExpanded && showNewBadge && <Badge variant="primary">New</Badge>}
      </NavItemBtn>
    </NavItemWrapper>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

export interface PrimaryNavProps {
  /** Primary navigation items (top group) */
  items: PrimaryNavItem[];
  /** Tools / apps group (shown after divider) */
  toolItems?: PrimaryNavItem[];
  /** Bottom apps group (Document Studio, Form, etc.) */
  bottomItems?: PrimaryNavItem[];
  /** Workspace / company info */
  workspace: Workspace;
  /** Current user */
  user: UserProfile;
  onWorkspaceClick?: () => void;
  onUserClick?: () => void;
  onSettingsClick?: () => void;
  /** ID of a tool item that should display the "New" badge */
  newItemId?: string;
  /** ID of the item that should use the AI gradient for its active state */
  aiItemId?: string;
}

// ── Component ──────────────────────────────────────────────────────────────

export function PrimaryNav({
  items,
  toolItems = [],
  bottomItems = [],
  workspace,
  user,
  onWorkspaceClick,
  onUserClick,
  onSettingsClick,
  newItemId,
  aiItemId,
}: PrimaryNavProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <NavRoot
      $isExpanded={isExpanded}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      aria-label="Primary navigation"
    >
      <NavInner $isExpanded={isExpanded}>
        <NavTop>
          {/* Workspace selector */}
          <WorkspaceSelector
            $isExpanded={isExpanded}
            onClick={onWorkspaceClick}
            aria-label={`Workspace: ${workspace.name}`}
            title={!isExpanded ? workspace.name : undefined}
          >
            <WorkspaceLogo>
              {workspace.logoUrl
                ? <img src={workspace.logoUrl} alt={workspace.name} />
                : (workspace.initial ?? workspace.name.charAt(0).toUpperCase())}
            </WorkspaceLogo>
            {isExpanded && (
              <>
                <WorkspaceName>{workspace.name}</WorkspaceName>
                <ChevronWrap><ChevronDownIcon /></ChevronWrap>
              </>
            )}
          </WorkspaceSelector>

          {/* Primary nav items */}
          <NavGroup>
            {items.map(item => (
              <NavItem
                key={item.id}
                item={item}
                isExpanded={isExpanded}
                isAi={item.id === aiItemId}
              />
            ))}
          </NavGroup>

          {/* Divider + Tools group */}
          {toolItems.length > 0 && (
            <>
              <NavDivider />
              <NavGroup>
                {toolItems.map(item => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isExpanded={isExpanded}
                    showNewBadge={item.id === newItemId}
                    isAi={item.id === aiItemId}
                  />
                ))}
              </NavGroup>
            </>
          )}
        </NavTop>

        <NavBottom>
          {/* Bottom apps group */}
          {bottomItems.length > 0 && (
            <>
              <NavDivider />
              <NavGroup>
                {bottomItems.map(item => (
                  <NavItem key={item.id} item={item} isExpanded={isExpanded} isAi={item.id === aiItemId} />
                ))}
              </NavGroup>
            </>
          )}

          <NavDivider />

          {/* Settings */}
          <NavItemWrapper $isActive={false}>
            <NavItemBtn
              $isActive={false}
              onClick={onSettingsClick}
              aria-label="Settings"
              title={!isExpanded ? 'Settings' : undefined}
            >
              <NavItemLeadingIcon>
                <SettingsIcon />
              </NavItemLeadingIcon>
              {isExpanded && (
                <NavItemLabelText>Settings</NavItemLabelText>
              )}
            </NavItemBtn>
          </NavItemWrapper>

          {/* User row */}
          <UserRow
            $isExpanded={isExpanded}
            onClick={onUserClick}
            aria-label={`User: ${user.name}`}
            title={!isExpanded ? user.name : undefined}
          >
            <UserAvatar $color={user.avatarColor}>{user.initials}</UserAvatar>
            {isExpanded && (
              <>
                <UserName>{user.name}</UserName>
                <ChevronWrap><ChevronDownIcon /></ChevronWrap>
              </>
            )}
          </UserRow>
        </NavBottom>
      </NavInner>
    </NavRoot>
  );
}
