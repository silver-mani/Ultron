// DesktopShell — the >=768px layout. This is the verbatim body of the
// original AppShell, extracted so AppShell can branch between desktop
// and mobile chromes without changing either.

import { useEffect, useState } from 'react';
import { PrimaryNav } from '../PrimaryNav';
import { SecondaryNav } from '../SecondaryNav';
import { TopNav } from '../TopNav';
import { AppShellRoot, MainArea, ContentArea, ContentMain } from './AppShell.styles';
import type { AppShellProps } from './AppShell';

const SEC_NAV_WIDTH_STORAGE_KEY = 'tb:secondary-nav-width';
const SEC_NAV_DEFAULT_WIDTH = 270;
const SEC_NAV_MIN_WIDTH = 220;
const SEC_NAV_MAX_WIDTH = 520;

export function DesktopShell({
  // PrimaryNav props
  items,
  toolItems,
  bottomItems,
  workspace,
  user,
  onWorkspaceClick,
  onUserClick,
  onSettingsClick,
  newItemId,
  aiItemId,
  // SecondaryNav props (heading separated)
  secNavHeading,
  menuEntries,
  menuHeader,
  pageEntries,
  showSearch,
  searchValue,
  onSearchChange,
  onFilterClick,
  headerSlot,
  bodyContent,
  // TopNav props
  heading,
  actions,
  showActivityButton,
  showPonderButton,
  noBorder,
  onActivityClick,
  onPonderClick,
  onDotsClick,
  // AppShell own
  children,
  showSecondaryNav = true,
  showTopNav = true,
}: AppShellProps) {
  // Drag-resizable secondary nav width. Persisted across reloads via
  // localStorage so the user's choice sticks.
  const [secNavWidth, setSecNavWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return SEC_NAV_DEFAULT_WIDTH;
    const stored = window.localStorage.getItem(SEC_NAV_WIDTH_STORAGE_KEY);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    if (Number.isFinite(parsed)) {
      return Math.min(SEC_NAV_MAX_WIDTH, Math.max(SEC_NAV_MIN_WIDTH, parsed));
    }
    return SEC_NAV_DEFAULT_WIDTH;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SEC_NAV_WIDTH_STORAGE_KEY, String(secNavWidth));
  }, [secNavWidth]);

  return (
    <AppShellRoot>
      <PrimaryNav
        items={items}
        toolItems={toolItems}
        bottomItems={bottomItems}
        workspace={workspace}
        user={user}
        onWorkspaceClick={onWorkspaceClick}
        onUserClick={onUserClick}
        onSettingsClick={onSettingsClick}
        newItemId={newItemId}
        aiItemId={aiItemId}
      />

      <MainArea>
        {showSecondaryNav && (
          <SecondaryNav
            heading={secNavHeading}
            menuEntries={menuEntries}
            menuHeader={menuHeader}
            pageEntries={pageEntries}
            isVisible={true}
            showSearch={showSearch}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            onFilterClick={onFilterClick}
            headerSlot={headerSlot}
            bodyContent={bodyContent}
            width={secNavWidth}
            onWidthChange={setSecNavWidth}
            minWidth={SEC_NAV_MIN_WIDTH}
            maxWidth={SEC_NAV_MAX_WIDTH}
          />
        )}

        <ContentArea>
          {showTopNav && (
            <TopNav
              heading={heading}
              actions={actions}
              showActivityButton={showActivityButton}
              showPonderButton={showPonderButton}
              noBorder={noBorder}
              onActivityClick={onActivityClick}
              onPonderClick={onPonderClick}
              onDotsClick={onDotsClick}
            />
          )}
          <ContentMain>
            {children}
          </ContentMain>
        </ContentArea>
      </MainArea>
    </AppShellRoot>
  );
}
