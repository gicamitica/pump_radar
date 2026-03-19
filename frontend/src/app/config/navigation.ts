/**
 * Navigation Data – Identity Only
 *
 * RULES:
 * - Structure only (NO layout, NO styling)
 * - If `children` exists → item is hierarchical
 * - Parents with children MUST NOT define `to`
 * - Icons are OPTIONAL
 * - Widgets are declared via navRole = 'widget'
 */

export type SidebarIconKey =
  | 'home'
  | 'layout-dashboard'
  | 'bar-chart'
  | 'pie-chart'
  | 'calendar'
  | 'mail'
  | 'message-circle'
  | 'kanban'
  | 'file-text'
  | 'users'
  | 'settings'
  | 'plug'
  | 'bell'
  | 'palette'
  | 'type'
  | 'component'
  | 'table'
  | 'layout-grid'
  | 'layers'
  | 'alert-triangle'
  | 'sparkles'
  | 'zap'
  | 'command'
  | 'badge'
  | 'keyboard'
  | 'lock'
  | 'shield-check'
  | 'book-open'
  | 'loader'
  | 'search'
  | 'columns'
  | 'git-commit'
  | 'truck'
  // New icons
  | 'pencil'
  | 'mouse-pointer'
  | 'chevron-down-square'
  | 'accessibility'
  | 'move'
  | 'align-left'
  | 'boxes'
  | 'combine'
  | 'sliders'
  | 'toggle'
  | 'eye'
  | 'list-ordered'
  | 'shopping-cart'
  | 'briefcase'
  | 'graduation-cap'
  | 'contact'
  | 'brain'
  | 'hard-drive'
  | 'sticky-note'
  | 'map'
  | 'check-square'
  | 'heart-pulse'
  | 'headphones'
  | 'video'
  | 'clock';

export type NavBadge = {
  type: 'count' | 'dot' | 'label' | 'icon' | 'emoji';
  value?: number | string;
  label?: 'popular' | 'featured' | 'new' | 'premium' | 'upcoming';
  icon?: SidebarIconKey;
  color?: 'blue' | 'purple' | 'amber' | 'emerald' | 'rose' | 'slate' | 'orange';
};

export type NavRole = 'main' | 'primary' | 'secondary' | 'utility' | 'widget';

/**
 * Visual accent colors for enhanced navigation items
 * Used by megamenu to apply theme-aware color styling
 */
export type NavAccentColor = 'blue' | 'purple' | 'amber' | 'emerald' | 'rose' | 'slate';

/**
 * Icon color for sidebar items
 * Maps to Tailwind color classes
 */
export type NavIconColor = 'blue' | 'purple' | 'amber' | 'emerald' | 'rose' | 'slate' | 'cyan' | 'orange';

export type NavAction = {
  id: string;
  icon: SidebarIconKey;
  label?: string;
  onClick: (e: React.MouseEvent) => void;
};

export type NavItem = {
  id: string;
  icon?: SidebarIconKey;
  iconColor?: NavIconColor;
  to?: string;
  target?: React.HTMLAttributeAnchorTarget;
  badge?: NavBadge;
  navRole?: NavRole;
  defaultOpen?: boolean;
  exact?: boolean;
  children?: NavItem[];
  
  // Visual enhancement flags (text comes from i18n)
  // If true, renderer will look up `descriptions.{parentId}.{id}` or `descriptions.{id}`
  hasDescription?: boolean;
  // Thumbnail image path for featured items (optional)
  thumbnail?: string;
  // Accent color for visual styling
  accent?: NavAccentColor;
  // Mark as featured item (displayed prominently in megamenu)
  featured?: boolean;
  // If true, renders a visual separator after this item in sidebar
  hasSeparatorAfter?: boolean;

  // Contextual actions for the item (e.g. dotted menu)
  actions?: NavAction[];
};

/**
 * Megamenu-specific presentation configuration
 */
export interface MegaPresentation {
  // Layout component to use (e.g., 'showcase', 'tabbed', 'columns', 'default')
  component?: string;
  // Item IDs to display in featured zone (hero cards with images)
  featuredItems?: string[];
  // Item IDs for quick links bar
  quickLinks?: string[];
  // Number of columns for main grid (default: 5)
  columns?: number;
  // Show descriptions for items (requires hasDescription on items)
  showDescriptions?: boolean;
  // CTA button config (label comes from i18n: `mega.{groupId}.cta`)
  cta?: {
    to: string;
    accent?: NavAccentColor;
  };
}

export type NavGroup = {
  id: string;
  presentation?: NavPresentation;
  items: NavItem[];

  // Optional action next to group title (e.g. "+" button)
  headerAction?: NavAction;
};

export interface NavPresentation {
  layout?: 'list' | 'columns' | 'mega';
  // Mega-specific configuration
  mega?: MegaPresentation;
}

export const navigationSections: NavGroup[] = [
  /* ───────── PumpRadar ───────── */
  {
    id: 'pumpradar',
    items: [
      { id: 'dashboard', icon: 'bar-chart', iconColor: 'blue', to: '/dashboard', navRole: 'primary' },
      { id: 'pump-signals', icon: 'zap', iconColor: 'emerald', to: '/dashboard/pump', navRole: 'primary' },
      { id: 'dump-signals', icon: 'alert-triangle', iconColor: 'rose', to: '/dashboard/dump', navRole: 'primary' },
      { id: 'ai-chat', icon: 'message-circle', iconColor: 'purple', to: '/ai-chat', navRole: 'primary' },
      { id: 'subscription', icon: 'layers', iconColor: 'amber', to: '/subscription', navRole: 'primary' },
      { id: 'admin', icon: 'shield-check', iconColor: 'slate', to: '/admin', navRole: 'utility' },
    ],
  },
];
