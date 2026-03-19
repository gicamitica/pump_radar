import React, { type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/shadcn/lib/utils';
import { Button } from '@/shadcn/components/ui/button';

export interface PageHeaderProps {
  /**
   * Main title of the page
   */
  title?: string | ReactNode;

  /**
   * Optional subtitle or description text
   */
  subtitle?: string | ReactNode;

  /**
   * Optional content to display above the title (e.g., category, greeting)
   */
  upperTitle?: ReactNode;

  /**
   * Optional back button configuration
   */
  backButton?: {
    /**
     * URL to navigate to when back button is clicked
     */
    to?: string;

    /**
     * Custom label for back button (defaults to "Regresar")
     */
    label?: string;

    /**
     * Custom onClick handler (if not provided, will navigate to "to" prop)
     */
    onClick?: () => void;
  };

  /**
   * Optional additional content to render in the right side of the header
   */
  actions?: ReactNode;

  /**
   * Layout variant
   * @default 'breadcrumb'
   */
  variant?: 'breadcrumb' | 'classic' | 'compact' | 'surface' | 'immersive';

  /**
   * Heading size variation
   * @default 'lg'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';

  /**
   * Optional additional className for the container
   */
  className?: string;

  /**
   * Optional additional className for the title
   */
  titleClassName?: string;

  /**
   * Optional additional className for the subtitle
   */
  subtitleClassName?: string;
}

/**
 * PageHeader component for consistent page headers across the application
 * Includes title, optional description, back button, and action buttons
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title = '',
  subtitle,
  upperTitle,
  backButton,
  actions,
  variant = 'breadcrumb',
  size = 'lg',
  className = '',
  titleClassName = '',
  subtitleClassName = '',
}) => {
  const navigate = useNavigate();
  const handleBackClick = () => {
    if (backButton?.onClick) {
      backButton.onClick();
    } else if (backButton?.to) {
      navigate(backButton.to);
    }
  };

  const titleSizeClasses = {
    sm: 'text-sm font-bold tracking-tight',
    md: 'text-base md:text-xl font-bold tracking-tight',
    lg: 'text-2xl md:text-3xl font-bold tracking-tight',
    xl: 'text-2xl md:text-4xl font-extrabold tracking-tight',
    '2xl': 'text-5xl lg:text-6xl font-bold tracking-tighter',
  };

  const subtitleSizeClasses = {
    sm: 'text-[11px] opacity-60',
    md: 'text-xs md:text-sm opacity-80',
    lg: 'text-sm md:text-base opacity-80',
    xl: 'text-sm md:text-lg opacity-80',
    '2xl': 'text-lg md:text-xl opacity-80',
  };

  const RenderUpperTitle = ({ className }: { className?: string }) => {
    if (!upperTitle) return null;
    return (
      <div className={cn("flex items-center gap-2 text-primary", className)}>
        {upperTitle}
      </div>
    );
  };

  const RenderTitle = ({ className }: { className?: string }) => {
    if (!title) return null;
    if (typeof title !== 'string') return <>{title}</>;
    return (
      <h1 className={cn(titleSizeClasses[size], "text-foreground leading-tight", titleClassName, className)}>
        {title}
      </h1>
    );
  };

  const RenderSubtitle = ({ className }: { className?: string }) => {
    if (!subtitle) return null;
    if (typeof subtitle !== 'string') return <>{subtitle}</>;
    return (
      <div className={cn(subtitleSizeClasses[size], "text-muted-foreground font-medium", subtitleClassName, className)}>
        {subtitle}
      </div>
    );
  };

  const RenderActions = ({ className }: { className?: string }) => {
    if (!actions) return null;
    return (
      <div className={cn("flex flex-wrap gap-3 items-center shrink-0", className)}>
        {actions}
      </div>
    );
  };

  // Shared title group to reduce boilerplate
  const TitleGroup = ({ className }: { className?: string }) => (
    <div className={cn("flex flex-col gap-1 min-w-0", className)}>
      <RenderUpperTitle />
      <RenderTitle />
      <RenderSubtitle />
    </div>
  );

  // Render based on variant
  if (variant === 'breadcrumb') {
    return (
      <div className={cn('flex flex-col page-header', className)}>
        {backButton && (
          <Button
            onClick={handleBackClick}
            variant="ghost"
            className="-ml-3 h-auto p-0 px-3 py-1 text-muted-foreground hover:text-foreground hover:bg-transparent items-center gap-1.5 transition-all group w-fit"
            size="sm"
            aria-label={backButton.label || "Regresar"}
          >
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] leading-none pb-px">
              {backButton.label || "Back"}
            </span>
          </Button>
        )}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <TitleGroup />
          <RenderActions />
        </div>
      </div>
    );
  }

  if (variant === 'classic') {
    return (
      <div className={cn(
        'flex flex-col lg:flex-row lg:items-center justify-start md:justify-between gap-2 page-header',
        className
      )}>
        <div className="flex flex-row items-center gap-3">
          {backButton && (
            <Button
              onClick={handleBackClick}
              variant="ghost"
              className="h-10 w-10 rounded-xl hover:bg-muted transition-colors shrink-0"
              size="icon"
              aria-label={backButton.label || "Regresar"}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}

          <div className='flex flex-col items-start'>
            <RenderUpperTitle className="text-[10px] uppercase font-bold tracking-widest mb-1" />
            <RenderTitle />
            <RenderSubtitle />
          </div>
        </div>

        <RenderActions />
      </div>
    );
  }

  if (variant === 'surface') {
    return (
      <div className={cn(
        'p-6 bg-muted/30 border border-border/40 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 page-header',
        className
      )}>
        <div className="flex items-start md:items-center gap-4">
          {backButton && (
            <Button
              onClick={handleBackClick}
              variant="outline"
              className="h-11 w-11 rounded-2xl bg-background shadow-sm hover:shadow-md transition-all shrink-0"
              size="icon"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex flex-col min-w-0">
            <RenderUpperTitle className="mb-1" />
            <RenderTitle className="truncate" />
            <RenderSubtitle className="opacity-60 truncate" />
          </div>
        </div>

        <RenderActions />
      </div>
    );
  }

  if (variant === 'immersive') {
    return (
      <div className={cn('relative flex flex-col gap-6 py-4 page-header', className)}>
        {/* Ambient Glow */}
        <div className="absolute -top-24 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="flex flex-col">
          {backButton && (
            <Button
              onClick={handleBackClick}
              variant="ghost"
              className="w-fit p-2 h-auto text-muted-foreground hover:text-foreground hover:bg-transparent flex items-center gap-2 group transition-colors cursor-pointer"
            >
              <div className="relative flex items-center">
                <div className="absolute left-0 h-0.5 w-1.5 bg-primary -rotate-45 origin-left opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="absolute left-0 h-0.5 w-1.5 bg-primary rotate-45 origin-left opacity-0 group-hover:opacity-100 transition-all duration-300" />
                <div className="h-0.5 w-6 bg-muted-foreground group-hover:w-9 group-hover:bg-primary transition-all duration-300" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">{backButton.label || "Return"}</span>
            </Button>
          )}

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-2">
              <RenderUpperTitle />
              <RenderTitle />
              <RenderSubtitle className="max-w-2xl leading-relaxed" />
            </div>
            <RenderActions className="pb-2" />
          </div>
        </div>
      </div>
    );
  }

  // Variant: compact (Minimal single row)
  return (
    <div className={cn('flex items-center justify-between gap-4 py-3 px-4 bg-background/50 backdrop-blur-sm border-b page-header', className)}>
      <div className="flex items-center gap-4 min-w-0">
        {backButton && (
          <Button
            onClick={handleBackClick}
            variant="ghost"
            className="h-8 w-8 hover:bg-muted transition-colors shrink-0"
            size="icon"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="flex items-center gap-3 min-w-0">
          <RenderTitle className="truncate" />
          {subtitle && (
            <>
              <div className="h-3 w-px bg-border/60" />
              <RenderSubtitle className="text-[11px] opacity-60 truncate" />
            </>
          )}
        </div>
      </div>

      <RenderActions className="gap-2 shrink-0" />
    </div>
  );
};

export default PageHeader;
