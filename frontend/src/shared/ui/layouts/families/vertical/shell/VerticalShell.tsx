import type { ReactNode, FC } from 'react';
import { cn } from '@/shadcn/lib/utils';
import { AnimatePresence } from 'framer-motion';
import { applyLayoutBehavior } from '../../../behaviors';
import type { LayoutBehavior } from '../../../behaviors';
import { useLayout } from '../../../app';
import { QuickActionRail, ActivityPanel } from '@/shared/ui/layouts/components/panels';

interface VerticalShellProps {
  behavior: LayoutBehavior;
  children: ReactNode;
  rightSlot?: ReactNode;
}

export const VerticalShell: FC<VerticalShellProps> = ({ behavior, children, rightSlot: explicitRightSlot }) => {
  const { settings } = useLayout();

  const rightSlot = explicitRightSlot || (
    <>
      <AnimatePresence mode="wait">
        {settings.rightPanel === 'dual' && <ActivityPanel key="activity-panel" />}
      </AnimatePresence>
      {(settings.rightPanel === 'rail' || settings.rightPanel === 'dual') && <QuickActionRail />}
    </>
  );

  return (
    <div className={cn(
      'flex w-full',
      applyLayoutBehavior(behavior)
    )}>
      {children}
      {settings.rightPanel !== 'none' && rightSlot}
    </div>
  );
};
