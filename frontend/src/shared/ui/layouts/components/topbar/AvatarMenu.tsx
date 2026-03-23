import React from 'react';
import AnimatedDropdown from '@/shared/ui/components/animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '@/shared/ui/components/animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '@/shared/ui/components/animated-dropdown/AnimatedDropdownContent';
import { LogOut, LayoutDashboard, CreditCard, MessageCircle } from 'lucide-react';
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

type MenuEntry =
  | { type: 'item'; key: string; label: string; icon: LucideIcon; onClick?: () => void; variant?: 'default' | 'danger' }
  | { type: 'separator'; key: string };

const AvatarMenu: React.FC = () => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const { rect, bind, clear } = useHoverBackground<HTMLDivElement>(containerRef);

  const authService = useService<IAuthService>(AUTH_SYMBOLS.IAuthService);
  const logger = useService<ILogger>(CORE_SYMBOLS.ILogger);
  const currentUser = authService.getCurrentUser() as any;
  const navigate = useNavigate();

  const handleLogout = React.useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      logger.error('Logout failed', error);
    }
  }, [authService, logger]);

  const menuEntries = React.useMemo<MenuEntry[]>(() => [
    { type: 'item', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, onClick: () => navigate('/dashboard') },
    { type: 'item', key: 'subscription', label: 'Subscription', icon: CreditCard, onClick: () => navigate('/subscription') },
    { type: 'item', key: 'ai-chat', label: 'AI Assistant', icon: MessageCircle, onClick: () => navigate('/ai-chat') },
    { type: 'separator', key: 'sep' },
    { type: 'item', key: 'logout', label: 'Sign Out', icon: LogOut, onClick: handleLogout, variant: 'danger' as const },
  ], [navigate, handleLogout]);

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const sub = (currentUser as any)?.subscription || 'trial';
  const subColor = sub === 'monthly' || sub === 'annual' ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <AnimatedDropdown placement="bottom-end" openOn="click">
      <AnimatedDropdownTrigger asChild>
        <button
          className="relative inline-flex size-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 border border-gray-200/70 dark:border-neutral-800"
          aria-label="Account"
          data-testid="avatar-menu-btn"
        >
          <span className="inline-flex items-center justify-center size-7 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold overflow-hidden">
            {initials}
          </span>
          <span className={`absolute -bottom-0.5 -right-0.5 inline-flex size-2.5 rounded-full ${subColor} border-2 border-background`} />
        </button>
      </AnimatedDropdownTrigger>
      <AnimatedDropdownContent className="z-[60] w-[260px]">
        <div className="px-3 pt-3 pb-2">
          <div className="text-sm font-semibold leading-tight">{currentUser?.name || 'User'}</div>
          <div className="text-xs text-muted-foreground">{currentUser?.email || ''}</div>
          <div className={`mt-1.5 inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${sub === 'monthly' || sub === 'annual' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'}`}>
            {sub === 'monthly' ? 'Pro Monthly' : sub === 'annual' ? 'Pro Annual' : 'Free Trial'}
          </div>
        </div>

        <ThemeToggler size="sm" />

        <div ref={containerRef} className="relative p-1" onMouseLeave={clear}>
          <FloatingHover rect={rect} />
          {menuEntries.map((entry) =>
            entry.type === 'separator' ? (
              <div key={entry.key} className="my-1 h-px bg-border" />
            ) : (
              <button
                key={entry.key}
                onClick={entry.onClick}
                className={`relative w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors ${entry.variant === 'danger' ? 'text-red-600 dark:text-red-400' : ''}`}
                data-testid={`menu-item-${entry.key}`}
                {...bind}
              >
                <entry.icon className="size-4 flex-shrink-0" /> {entry.label}
              </button>
            )
          )}
        </div>
      </AnimatedDropdownContent>
    </AnimatedDropdown>
  );
};

export default AvatarMenu;
