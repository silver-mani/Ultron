// AppShell — responsive chooser between the desktop layout (today's
// three-pane shell) and the mobile layout (48px header + sheet-based
// nav). Below 768px we render MobileShell; at and above we render
// DesktopShell. The prop surface is unchanged for desktop-only
// callers; mobile adds an optional `mobileNav` bag that MobileShell
// needs (module groups + on-navigate callback).

import type { ReactNode } from 'react';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { DesktopShell } from './DesktopShell';
import { MobileShell, type MobileModuleGroup } from './MobileShell';
import type { PrimaryNavProps } from '../PrimaryNav';
import type { SecondaryNavProps } from '../SecondaryNav';
import type { TopNavProps } from '../TopNav';

export interface AppShellProps
  extends PrimaryNavProps,
    Omit<SecondaryNavProps, 'isVisible' | 'heading'>,
    Omit<TopNavProps, never> {
  children: ReactNode;
  secNavHeading: string;
  showSecondaryNav?: boolean;
  /** Hide the top nav bar (heading + actions). @default true (shown) */
  showTopNav?: boolean;

  /** Mobile-only extras. When present, viewports below the mobile
   *  breakpoint render the MobileShell chrome instead of DesktopShell. */
  mobileNav?: {
    activeId: string;
    secActiveId: string;
    activePageId: string | null;
    selectedPersonaId: string | null;
    moduleGroups: MobileModuleGroup[];
    primaryLabel: string;
    secondaryLabel?: string;
    onMobileNavigate: (moduleId: string) => void;
    onSelectPersona: (personaId: string) => void;
  };
}

export function AppShell(props: AppShellProps) {
  const isMobile = useIsMobile();

  if (isMobile && props.mobileNav) {
    const nav = props.mobileNav;
    return (
      <MobileShell
        activeId={nav.activeId}
        secActiveId={nav.secActiveId}
        activePageId={nav.activePageId}
        selectedPersonaId={nav.selectedPersonaId}
        moduleGroups={nav.moduleGroups}
        primaryLabel={nav.primaryLabel}
        secondaryLabel={nav.secondaryLabel}
        menuEntries={props.menuEntries ?? []}
        user={props.user}
        onUserClick={props.onUserClick}
        onMobileNavigate={nav.onMobileNavigate}
        onSelectPersona={nav.onSelectPersona}
      >
        {props.children}
      </MobileShell>
    );
  }

  return <DesktopShell {...props} />;
}
