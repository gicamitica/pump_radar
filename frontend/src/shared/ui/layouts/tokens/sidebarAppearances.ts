/**
 * Sidebar Appearance Tokens
 * 
 * CSS custom properties for sidebar theming
 * Applied on <aside> element by layout variants
 */

import type React from "react";

export type SidebarAppearance = 'light' | 'dark' | 'gradient';

export const sidebarAppearances: Record<
  SidebarAppearance,
  Record<string, string>
> = {
  light: {
    '--sidebar': 'var(--sidebar-light-surface)',
    '--sidebar-bg-paint': 'var(--sidebar-light-surface)',
    '--sidebar-foreground': 'var(--sidebar-light-foreground)',
    '--sidebar-muted': 'var(--sidebar-light-muted)',
    '--sidebar-border': 'var(--sidebar-light-border)',
    '--sidebar-icon': 'var(--sidebar-light-icon)',
    '--sidebar-icon-muted': 'var(--sidebar-light-icon-muted)',
    '--sidebar-icon-active': 'var(--sidebar-light-icon-active)',
    '--sidebar-hover': 'var(--sidebar-light-surface-muted)',
    '--sidebar-active': 'var(--sidebar-light-surface-active)',
  },

  dark: {
    '--sidebar': 'var(--sidebar-dark-surface)',
    '--sidebar-bg-paint': 'var(--sidebar-dark-surface)',
    '--sidebar-foreground': 'var(--sidebar-dark-foreground)',
    '--sidebar-muted': 'var(--sidebar-dark-muted)',
    '--sidebar-border': 'var(--sidebar-dark-border)',
    '--sidebar-icon': 'var(--sidebar-dark-icon)',
    '--sidebar-icon-muted': 'var(--sidebar-dark-icon-muted)',
    '--sidebar-icon-active': 'var(--sidebar-dark-icon-active)',
    '--sidebar-hover': 'var(--sidebar-dark-surface-muted)',
    '--sidebar-active': 'var(--sidebar-dark-surface-active)',
  },

  gradient: {
    '--sidebar-bg-paint': 'linear-gradient(180deg, var(--sidebar-gradient-from), var(--sidebar-gradient-mid), var(--sidebar-gradient-to))',
    '--sidebar-foreground': 'var(--sidebar-gradient-foreground)',
    '--sidebar-muted': 'var(--sidebar-gradient-muted)',
    '--sidebar-border': 'var(--sidebar-gradient-border)',
    '--sidebar-icon': 'var(--sidebar-gradient-icon)',
    '--sidebar-icon-muted': 'var(--sidebar-gradient-icon-muted)',
    '--sidebar-icon-active': 'var(--sidebar-gradient-icon-active)',
    '--sidebar-hover': 'rgba(255,255,255,0.06)',
    '--sidebar-active': 'rgba(255,255,255,0.12)',
  },
};

/**
 * Get CSS style object for sidebar appearance
 */
export function getSidebarAppearance(appearance: SidebarAppearance): React.CSSProperties {
  const vars = sidebarAppearances[appearance];
  return vars as unknown as React.CSSProperties;
}
