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
      { id: 'dashboard', icon: 'bar-chart', to: '/dashboard', navRole: 'primary' },
      { id: 'pump-signals', icon: 'zap', to: '/dashboard/pump', navRole: 'primary' },
      { id: 'dump-signals', icon: 'alert-triangle', to: '/dashboard/dump', navRole: 'primary' },
      { id: 'subscription', icon: 'layers', to: '/subscription', navRole: 'primary' },
    ],
  },

  /* ───────── Home ───────── */
  {
    id: 'home',
    items: [
      { id: 'admin-control', icon: 'home', to: '/', navRole: 'primary' },
    ],
  },

  /* ───────── Pages ───────── */
  {
    id: 'pages',
    items: [
      { id: 'pricing', icon: 'file-text', to: '/pages/pricing', navRole: 'secondary' },
      {
        id: 'errorPages',
        icon: 'alert-triangle',
        navRole: 'secondary',
        children: [
          { id: '404', to: '/pages/errors/404' },
          { id: '500', to: '/pages/errors/500' },
        ],
      },
    ],
  },

  /* ───────── Authentication (FULL) ───────── */
  {
    id: 'auth',
    presentation: {
      layout: 'columns',
    },
    items: [
      {
        id: 'authMinimal',
        icon: 'lock',
        target: '_blank',
        navRole: 'secondary',
        children: [
          { id: 'login', icon: 'lock', to: '/auth/login', target: '_blank' },
          { id: 'register', icon: 'users', to: '/auth/register', target: '_blank' },
          { id: 'forgot', icon: 'lock', to: '/auth/forgot-password', target: '_blank' },
          { id: 'reset', icon: 'lock', to: '/auth/reset-password', target: '_blank' },
          { id: 'twofactor', icon: 'shield-check', to: '/auth/mfa-verify', target: '_blank' },
          { id: 'verify', icon: 'mail', to: '/auth/verify-email', target: '_blank' },
          { id: 'lock', icon: 'lock', to: '/auth/lock', target: '_blank' },
        ],
      },
      {
        id: 'authHero',
        icon: 'shield-check',
        target: '_blank',
        navRole: 'secondary',
        children: [
          { id: 'loginHero', icon: 'lock', to: '/auth/hero/login', target: '_blank' },
          { id: 'registerHero', icon: 'users', to: '/auth/hero/register', target: '_blank' },
          { id: 'forgotHero', icon: 'lock', to: '/auth/hero/forgot-password', target: '_blank' },
          { id: 'resetHero', icon: 'lock', to: '/auth/hero/reset-password', target: '_blank' },
          { id: 'twofactorHero', icon: 'shield-check', to: '/auth/hero/mfa-verify', target: '_blank' },
          { id: 'verifyHero', icon: 'mail', to: '/auth/hero/verify-email', target: '_blank' },
          { id: 'lockHero', icon: 'lock', to: '/auth/lock', target: '_blank' },
        ],
      },
    ],
  },

  /* ───────── System ───────── */
  {
    id: 'system',
    items: [
      { id: 'docs', icon: 'book-open', to: 'https://docs.5studios.net/katalyst', target: '_blank', navRole: 'utility' },
      { id: 'changelog', icon: 'git-commit', to: '/system/changelog', navRole: 'utility' },
      { id: 'layout-builder', icon: 'palette', to: '/playground/layout-builder', navRole: 'utility' },
    ],
  },
];
