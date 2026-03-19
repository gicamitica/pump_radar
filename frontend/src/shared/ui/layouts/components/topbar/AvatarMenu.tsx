import React from 'react';
import AnimatedDropdown from '@/shared/ui/components/animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '@/shared/ui/components/animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '@/shared/ui/components/animated-dropdown/AnimatedDropdownContent';
import { User, LogOut, Settings as SettingsIcon, BookText, Store, BadgePercent } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FloatingHover } from '@/shared/ui/components/FloatingHover';
import { useHoverBackground } from '@/shared/hooks/useHoverBackground';
import ThemeToggler from '@/shared/ui/components/ThemeToggler';
import { useService } from '@/app/providers/useDI';
import { AUTH_SYMBOLS } from '@/modules/auth/di/symbols';
import { CORE_SYMBOLS } from '@/core/di/symbols';
import type { IAuthService } from '@/modules/auth/application/ports/IAuthService';
import type { ILogger } from '@/shared/utils/Logger';
import type { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type MenuEntry = {
    type: 'item';
    key: string;
    label: string;
    icon: LucideIcon;
    onClick?: () => void;
    variant?: 'default' | 'danger';
  } | { type: 'separator'; key: string };

const AvatarMenu: React.FC = () => {
  const { t } = useTranslation('common');
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { rect, bind, clear } = useHoverBackground<HTMLDivElement>(containerRef);
  
  // Auth service for logout
  const authService = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const logger = useService<ILogger>(CORE_SYMBOLS.ILogger);
  const currentUser = authService.getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = React.useCallback(async () => {
    try {
      logger.info('Logout initiated from AvatarMenu');
      await authService.logout();
      // Navigation is handled by AuthEventHandler
    } catch (error) {
      logger.error('Logout failed', error);
    }
  }, [authService, logger]);

  const menuEntries = React.useMemo<MenuEntry[]>(() => [
    {
      type: 'item',
      key: 'your-shop',
      label: t('topbar.yourShop', { defaultValue: 'Your Shop' }),
      icon: Store,
    },
    {
      type: 'item',
      key: 'affiliate',
      label: t('topbar.affiliate', { defaultValue: 'Affiliate' }),
      icon: BadgePercent,
    },
    {
      type: 'item',
      key: 'documentation',
      label: t('topbar.docs', { defaultValue: 'Documentation' }),
      icon: BookText,
      onClick: () => window.open('https://docs.5studios.net/katalyst', '_blank', 'noopener,noreferrer'),
    },
    {
      type: 'item',
      key: 'settings',
      label: t('topbar.settings', { defaultValue: 'Settings' }),
      icon: SettingsIcon,
      onClick: () => navigate('/settings'),
    },
    { type: 'separator', key: 'sep-3' },
    {
      type: 'item',
      key: 'logout',
      label: t('topbar.logout', { defaultValue: 'Log out' }),
      icon: LogOut,
      onClick: handleLogout,
      variant: 'danger',
    },
  ], [t, navigate, handleLogout]);

  return (
    <AnimatedDropdown placement="bottom-end" openOn="hover">
      <AnimatedDropdownTrigger asChild>
        <button
          className="relative inline-flex size-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 border border-gray-200/70 dark:border-neutral-800"
          aria-label={t('topbar.account', { defaultValue: 'Account' })}
        >
          <span className="inline-flex items-center justify-center size-7 rounded-full bg-gray-200 dark:bg-neutral-700 overflow-hidden">
            <User className="size-4" />
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 inline-flex size-2 rounded-full bg-green-500" />
        </button>
      </AnimatedDropdownTrigger>
      <AnimatedDropdownContent className="z-[60] w-[280px]">
          <div className="px-3 pt-2 pb-3">
            <div className="text-sm font-semibold leading-tight">
              {currentUser?.name || 'Guest User'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {currentUser?.email || 'Not logged in'}
            </div>
          </div>

          {/* Theme toggler */}
          <ThemeToggler size="sm" />

          <div ref={containerRef} className="relative p-1" onMouseLeave={clear}>
            <FloatingHover rect={rect} />
            {menuEntries.map((entry) =>
              entry.type === 'separator' ? (
                <div key={entry.key} className="my-1 h-px bg-gray-200/70 dark:bg-neutral-800" />
              ) : (
                <button
                  key={entry.key}
                  onClick={entry.onClick}
                  className={`relative w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                    entry.variant === 'danger' ? 'text-red-600 dark:text-red-400' : ''
                  }`}
                  {...bind}
                >
                  <entry.icon className="size-4" /> {entry.label}
                </button>
              )
            )}
          </div>
      </AnimatedDropdownContent>
    </AnimatedDropdown>
  );
};

export default AvatarMenu;
