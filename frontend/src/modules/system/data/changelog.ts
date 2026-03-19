/**
 * Changelog Data
 * 
 * This file is the build-time representation of docs/changelog.md.
 * When updating the changelog, edit docs/changelog.md first, then update this file to match.
 * 
 * Source of truth: /docs/changelog.md
 */

export type ChangelogSection = 'added' | 'changed' | 'deprecated' | 'removed' | 'fixed' | 'security' | 'notes';

export interface ChangelogEntry {
  version: string;
  date: string;
  sections: Partial<Record<ChangelogSection, string[]>>;
}

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: '1.0.1',
    date: '2026-01-10',
    sections: {
      added: [
        'Added full localization support for Portuguese (Brazil) (pt-BR), enabling seamless language switching across the entire platform.',
        'Introduced the Inbox application (`modules/apps/inbox`), a robust system for managing in-app notifications and messages with filtering, search, and master-detail layouts.',
        'Significantly expanded the Component Showcase with new demos for advanced UI patterns, covering Lists, Grids, and interactive elements to serve as a comprehensive reference.',
        'Shipment Tracking Dashboard: A complete solution for real-time logistics monitoring with map integration.'
      ],
      fixed: [
        'Refined TypeScript configuration to better support decorator usage patterns.',
        'Optimized component ref handling and state initialization for improved stability.',
        'Enhanced type definitions to ensure smoother startup across different development environments.',
        'General code quality adjustments and linting refinements.'
      ],
      notes: [
        'The template now runs cleanly out of the box with modern Node.js and npm versions, including Apple Silicon (ARM64).',
        'Lint messages for Shadcn UI components were explicitly suppressed to preserve the original code structure.'
      ]
    }
  },
  {
    version: '1.0.0',
    date: '2024-12-17',
    sections: {
      added: [
        'Initial release of the Katalyst Admin Template',
        'Core layout system with vertical navigation, topbar, and theming',
        'Multiple dashboard modules: E-commerce, Projects, Sales, and Executive',
        'Apps suite: Calendar, Email, Chat, Kanban, and Invoicing',
        'Management modules: Users, Teams, and Notifications',
        'Metrics and Stats Cards system with multiple layout and appearance variants',
        'Showcase module with comprehensive UI component documentation',
        'Form components with validation and accessibility support',
        'Data tables with sorting, filtering, and pagination',
        'Chart components powered by Recharts',
        'Authentication flows: Login, Register, Forgot Password, MFA, and more',
        'Internationalization (i18n) with English and Spanish locales',
        'Light and dark theme support with system preference detection',
        'Settings module with user preferences management',
        'Documentation foundation',
      ],
      notes: [
        'This is the first public release of Katalyst Admin Template.',
        'Built with React 19, TypeScript, Vite, and Tailwind CSS.',
      ],
    },
  },
];

export const CHANGELOG_SECTION_LABELS: Record<ChangelogSection, string> = {
  added: 'Added',
  changed: 'Changed',
  deprecated: 'Deprecated',
  removed: 'Removed',
  fixed: 'Fixed',
  security: 'Security',
  notes: 'Notes',
};

export const CHANGELOG_SECTION_COLORS: Record<ChangelogSection, string> = {
  added: 'text-green-600 dark:text-green-400',
  changed: 'text-blue-600 dark:text-blue-400',
  deprecated: 'text-yellow-600 dark:text-yellow-400',
  removed: 'text-red-600 dark:text-red-400',
  fixed: 'text-purple-600 dark:text-purple-400',
  security: 'text-orange-600 dark:text-orange-400',
  notes: 'text-gray-600 dark:text-gray-400',
};

export const CHANGELOG_SECTION_ICONS: Record<ChangelogSection, string> = {
  added: 'plus-circle',
  changed: 'refresh-cw',
  deprecated: 'alert-triangle',
  removed: 'minus-circle',
  fixed: 'check-circle',
  security: 'shield',
  notes: 'info',
};
