import { useEffect, useRef, useState } from 'react';
import { ListItem, ChevronDownIcon, ChevronRightIcon, SearchField } from 'alloy-design-system';
import type {
  SecondaryNavMenuEntry,
  SecondaryNavMenuItem,
  SecondaryNavMenuGroup,
  SecondaryNavPageEntry,
} from '../../types/nav';
import {
  SecondaryNavRoot,
  NavTop, HeadingRow, NavHeading,
  SearchRow, FilterBtn,
  NavMiddle,
  GroupRow, GroupLabel, GroupChevron, GroupChildren, ShowMoreRow, MenuGroupWrapper,
  MenuSectionLabel,
  SecNavIconSlot,
  NavBottom, BottomDivider, MenuDivider, BottomItemIcon,
  ResizeHandle,
  SECONDARY_NAV_WIDTH,
} from './SecondaryNav.styles';

// ── Inline icons ───────────────────────────────────────────────────────────

function AsteriskIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 2v12M2 8h12M3.515 3.515l8.97 8.97M12.485 3.515l-8.97 8.97" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function FilterLinesIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.75 3.5h10.5M3.5 7h7M5.25 10.5h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// Shared CSS vars for 32px list item height. The 4px horizontal inset (--li-px)
// gives the hover/selected background symmetric left-right breathing room and
// keeps the icon column aligned with the group chevron column. --li-gap is the
// space between the leading icon slot and the row label (kept in sync with the
// group header chevron→label gap so labels share one indentation).
const LIST_ITEM_SIZE_STYLE = {
  '--li-min-height': '32px',
  '--li-py': '0px',
  '--li-px': '4px',
  '--li-gap': '12px',
  borderRadius: '6px',
  borderBottom: 'none',
} as React.CSSProperties;

// ── Menu sub-components ────────────────────────────────────────────────────

function MenuSingleItem({ item }: { item: SecondaryNavMenuItem }) {
  return (
    <ListItem
      label={
        <span style={{
          // Active (currently-viewed) item reads as primary + medium weight so
          // the selection is obvious; inactive rows stay quiet/tertiary.
          color: item.isActive ? 'var(--color-content-primary, #151515)' : 'var(--color-content-tertiary, #475569)',
          fontWeight: item.isActive ? 500 : undefined,
          letterSpacing: '-0.084px',
        }}>
          {item.label}
        </span>
      }
      leadingSlot={
        <SecNavIconSlot>
          {item.icon ?? <AsteriskIcon />}
        </SecNavIconSlot>
      }
      selected={item.isActive}
      onClick={item.onClick}
      divider={false}
      size="md"
      aria-current={item.isActive ? 'page' : undefined}
      style={LIST_ITEM_SIZE_STYLE}
    />
  );
}

function MenuGroupItem({ group }: { group: SecondaryNavMenuGroup }) {
  const [expanded, setExpanded] = useState(group.defaultExpanded ?? true);
  // "Show N more" truncation: when maxVisible is set and there are extra
  // children, only the first maxVisible show until the user reveals the rest.
  const [showAll, setShowAll] = useState(false);
  const max = group.maxVisible;
  const truncated = max != null && !showAll && group.children.length > max;
  const visibleChildren = truncated ? group.children.slice(0, max) : group.children;
  const hiddenCount = group.children.length - visibleChildren.length;

  return (
    <MenuGroupWrapper $outlined={group.outlined}>
      <GroupRow onClick={() => setExpanded(e => !e)} aria-expanded={expanded}>
        <GroupChevron>
          {expanded ? <ChevronDownIcon size={16} /> : <ChevronRightIcon size={16} />}
        </GroupChevron>
        <GroupLabel>{group.label}</GroupLabel>
        {group.trailingBadge && (
          <span style={{ display: 'inline-flex', flexShrink: 0, marginRight: 4 }}>
            {group.trailingBadge}
          </span>
        )}
      </GroupRow>

      {expanded && (
        <GroupChildren>
          {visibleChildren.map(child => (
            <ListItem
              key={child.id}
              label={
                <span style={{
                  // Active (currently-viewed) case reads as primary + medium
                  // weight so the highlighted row stands out from its siblings.
                  color: child.isActive ? 'var(--color-content-primary, #151515)' : 'var(--color-content-tertiary, #475569)',
                  fontWeight: child.isActive ? 500 : undefined,
                  letterSpacing: '-0.084px',
                }}>
                  {child.label}
                </span>
              }
              leadingSlot={
                <SecNavIconSlot>{child.icon ?? null}</SecNavIconSlot>
              }
              trailingSlot={child.trailingSlot}
              selected={child.isActive}
              onClick={child.onClick}
              divider={false}
              size="md"
              aria-current={child.isActive ? 'page' : undefined}
              style={LIST_ITEM_SIZE_STYLE}
            />
          ))}
          {hiddenCount > 0 && (
            <ShowMoreRow type="button" onClick={() => setShowAll(true)}>
              Show {hiddenCount} more
            </ShowMoreRow>
          )}
          {max != null && showAll && group.children.length > max && (
            <ShowMoreRow type="button" onClick={() => setShowAll(false)}>
              Show less
            </ShowMoreRow>
          )}
        </GroupChildren>
      )}
    </MenuGroupWrapper>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export interface SecondaryNavProps {
  /** Section heading */
  heading: string;
  /** Whether the panel is visible (width animates to 0 when false) */
  isVisible: boolean;
  /** Part 2: menu entries (single items or accordion groups) */
  menuEntries?: SecondaryNavMenuEntry[];
  /** Optional content pinned to the top of the menu body, above the entries. */
  menuHeader?: React.ReactNode;
  /** Part 3: bottom page entries (static, no active state) */
  pageEntries?: SecondaryNavPageEntry[];
  /** Show the search + filter bar */
  showSearch?: boolean;
  /** Search value (controlled) */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onFilterClick?: () => void;
  /**
   * Optional content rendered to the right of the heading. Used by AI Home
   * to slot in a view toggle plus a kebab menu.
   */
  headerSlot?: React.ReactNode;
  /**
   * When provided, replaces the menu body (NavMiddle) and hides the search
   * row. NavBottom (Usage / Settings) always renders.
   */
  bodyContent?: React.ReactNode;
  /**
   * Pixel width of the panel. Defaults to 270 (the original fixed value).
   * Pass a controlled value alongside `onWidthChange` for drag-to-resize.
   */
  width?: number;
  /**
   * Called while the user drags the resize handle. Receives the proposed
   * new width in pixels (already clamped to the configured min/max).
   */
  onWidthChange?: (next: number) => void;
  /** Min width in pixels. @default 220 */
  minWidth?: number;
  /** Max width in pixels. @default 520 */
  maxWidth?: number;
}

export function SecondaryNav({
  heading,
  isVisible,
  menuEntries = [],
  menuHeader,
  pageEntries = [],
  showSearch = true,
  searchValue = '',
  onSearchChange,
  onFilterClick,
  headerSlot,
  bodyContent,
  width = SECONDARY_NAV_WIDTH,
  onWidthChange,
  minWidth = 220,
  maxWidth = 520,
}: SecondaryNavProps) {
  const hasCustomBody = bodyContent !== undefined;
  const rootRef = useRef<HTMLElement | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Drag-to-resize: track the initial cursor position + width on
  // mousedown, then translate cursor delta into a clamped new width on
  // every mousemove. Mouse events are bound to window so the drag keeps
  // updating even when the cursor leaves the handle.
  useEffect(() => {
    if (!isResizing || !onWidthChange) return;
    const root = rootRef.current;
    if (!root) return;

    const startLeft = root.getBoundingClientRect().left;

    const handleMove = (e: MouseEvent) => {
      const next = Math.min(maxWidth, Math.max(minWidth, e.clientX - startLeft));
      onWidthChange(next);
    };
    const handleUp = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    // Block text selection while dragging so the cursor stays as col-resize.
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = '';
    };
  }, [isResizing, onWidthChange, minWidth, maxWidth]);

  return (
    <SecondaryNavRoot
      ref={rootRef}
      $isVisible={isVisible}
      $width={width}
      $isResizing={isResizing}
      aria-label="Secondary navigation"
    >

      {/* Part 1: Top — heading + optional trailing slot + search/filter.
          The heading row is omitted entirely when there's no heading or
          header slot, so callers can render a headerless sidebar. */}
      <NavTop>
        {(heading || headerSlot) && (
          <HeadingRow>
            <NavHeading>{heading}</NavHeading>
            {headerSlot}
          </HeadingRow>
        )}

        {showSearch && !hasCustomBody && (
          <SearchRow>
            <SearchField
              size="sm"
              placeholder="Search..."
              value={searchValue}
              onChange={e => onSearchChange?.(e.target.value)}
            />
            <FilterBtn onClick={onFilterClick} aria-label="Filter">
              <FilterLinesIcon />
            </FilterBtn>
          </SearchRow>
        )}
      </NavTop>

      {/* Part 2: Middle — either the menu body or caller-supplied content */}
      {hasCustomBody ? (
        bodyContent
      ) : (
        <NavMiddle>
          {menuHeader}
          {menuEntries.map(entry => {
            if (entry.type === 'single') {
              return <MenuSingleItem key={entry.item.id} item={entry.item} />;
            }
            if (entry.type === 'group') {
              return <MenuGroupItem key={entry.group.id} group={entry.group} />;
            }
            if (entry.type === 'divider') {
              return <MenuDivider key={entry.id} />;
            }
            return <MenuSectionLabel key={entry.label.id}>{entry.label.label}</MenuSectionLabel>;
          })}
        </NavMiddle>
      )}

      {/* Part 3: Bottom — page entries (static, no active state) */}
      {pageEntries.length > 0 && (
        <NavBottom>
          <BottomDivider />
          {pageEntries.map(entry => (
            <ListItem
              key={entry.id}
              label={
                <span style={{ color: 'var(--color-content-inverse-tertiary, #87919f)', letterSpacing: '-0.084px' }}>
                  {entry.label}
                </span>
              }
              leadingSlot={
                <BottomItemIcon>
                  {entry.icon ?? <AsteriskIcon />}
                </BottomItemIcon>
              }
              onClick={entry.onClick}
              selected={entry.isActive ?? false}
              divider={false}
              size="md"
              aria-current={entry.isActive ? 'page' : undefined}
              style={LIST_ITEM_SIZE_STYLE}
            />
          ))}
        </NavBottom>
      )}

      {onWidthChange && isVisible && (
        <ResizeHandle
          $isResizing={isResizing}
          onMouseDown={e => {
            e.preventDefault();
            setIsResizing(true);
          }}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize secondary navigation"
        />
      )}

    </SecondaryNavRoot>
  );
}
