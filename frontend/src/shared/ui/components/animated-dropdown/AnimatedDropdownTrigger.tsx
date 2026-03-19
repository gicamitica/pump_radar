import React from 'react';
import { useAnimatedDropdown } from './useAnimatedDropdown';

export interface AnimatedDropdownTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

const AnimatedDropdownTrigger: React.FC<React.PropsWithChildren<AnimatedDropdownTriggerProps>> = ({ asChild, children, ...rest }) => {
  const { refs, getReferenceProps, open, setOpen, id } = useAnimatedDropdown();

  const child = React.isValidElement(children) ? children : <button type="button">{children}</button>;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(!open);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
    }
    ((child.props as unknown) as { onKeyDown?: (e: React.KeyboardEvent) => void })?.onKeyDown?.(e);
  };

  const common = getReferenceProps({
    ref: refs.reference,
    id: `${id}-trigger`,
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': `${id}-content`,
    onKeyDown,
    ...rest,
  });

  return asChild && React.isValidElement(children)
    ? React.cloneElement(children, common)
    : React.cloneElement(child, common);
};

export default AnimatedDropdownTrigger;
