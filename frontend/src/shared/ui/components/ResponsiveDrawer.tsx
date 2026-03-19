import React from 'react';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from '@/shared/ui/shadcn/components/ui/drawer';
import { cn } from '@/shadcn/lib/utils';

type DrawerSize = 'md' | 'lg' | 'xl';

interface ResponsiveDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  size?: DrawerSize;
}

const SIZE_CLASSES: Record<DrawerSize, string> = {
  md: 'data-[vaul-drawer-direction=right]:sm:max-w-[40%]',
  lg: 'data-[vaul-drawer-direction=right]:sm:max-w-[50%]',
  xl: 'data-[vaul-drawer-direction=right]:sm:max-w-[60%]',
};

/**
 * A responsive drawer that appears as a side panel on desktop (right)
 * and a bottom sheet on mobile.
 */
export const ResponsiveDrawer: React.FC<ResponsiveDrawerProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
  size = 'md',
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction={isDesktop ? "right" : "bottom"}
    >
      <DrawerContent className={cn(
        isDesktop ? `h-full w-full ${SIZE_CLASSES[size]}` : "max-h-[92vh]",
        className
      )}>
        {(title || description) && (
          <DrawerHeader className="border-b bg-muted/20 px-6 py-4">
            {title && <DrawerTitle>{title}</DrawerTitle>}
            {description && <DrawerDescription>{description}</DrawerDescription>}
          </DrawerHeader>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          {children}
        </div>

        {footer && (
          <DrawerFooter className="border-t bg-muted/10 px-6 py-4">
            {footer}
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default ResponsiveDrawer;
