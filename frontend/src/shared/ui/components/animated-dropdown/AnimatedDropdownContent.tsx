import React from 'react';
import { FloatingPortal } from '@floating-ui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useAnimatedDropdown } from './useAnimatedDropdown';

export interface AnimatedDropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  roleType?: 'menu' | 'dialog';
}

const AnimatedDropdownContent: React.FC<React.PropsWithChildren<AnimatedDropdownContentProps>> = ({ className, children, roleType = 'menu' }) => {
  const { open, refs, floatingStyles, getFloatingProps, id, update, controlledBy } = useAnimatedDropdown();
  const reduce = useReducedMotion();

  React.useLayoutEffect(() => {
    if (open) update();
  }, [open, update]);

  const variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 6, scale: 0.98 },
        show: { opacity: 1, y: 0, scale: 1 },
      };

  return (
    <FloatingPortal>
      <AnimatePresence initial={false}>
        {open && (
          (() => {
            const floatingProps = getFloatingProps({ role: roleType, tabIndex: -1 }) as Record<string, unknown>;
            return (
              <motion.div
                id={`${id}-content`}
                ref={refs.floating}
                {...floatingProps}
                style={floatingStyles}
                initial="hidden"
                animate="show"
                exit="hidden"
                transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.25, duration: open ? 0.18 : 0.14 }}
                className={[
                  'z-[60] max-h-[70vh] overflow-auto rounded-2xl border bg-white dark:bg-neutral-800 shadow-xl backdrop-blur-md p-2',
                  className ?? ''
                ].join(' ')}
                variants={variants}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Escape') {
                    (document.getElementById(id + '-trigger') as HTMLElement | null)?.focus();
                  }
                }}
                onAnimationComplete={() => {
                  if (open) {
                    if (controlledBy === 'click') {
                      const first = ((refs.floating as unknown) as { current?: HTMLElement }).current?.querySelector('[data-autofocus], button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') as HTMLElement | null;
                      first?.focus?.();
                    }
                  } else {
                    if (controlledBy === 'click') {
                      (document.getElementById(id + '-trigger') as HTMLElement | null)?.focus();
                    }
                  }
                }}
              >
                {children}
              </motion.div>
            );
          })()
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
};

export default AnimatedDropdownContent;
