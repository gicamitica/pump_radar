import React from 'react';
import { Card } from '@/shared/ui/shadcn/components/ui/card';
import ActionButton from '@/components/forms/buttons/ActionButton';
import { Badge } from '@/shared/ui/shadcn/components/ui/badge';
import { Switch } from '@/shared/ui/shadcn/components/ui/switch';
import { cn } from '@/shadcn/lib/utils';

export type InfoCardProps = {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  rightSlot?: React.ReactNode;
  buttonProps?: { label: React.ReactNode; onClick?: () => void; variant?: React.ComponentProps<typeof ActionButton>['variant']; size?: React.ComponentProps<typeof ActionButton>['size']; className?: string };
  badgeProps?: { children: React.ReactNode; variant?: 'outline' | 'secondary' | 'default'; className?: string };
  switchProps?: { defaultChecked?: boolean; onChange?: (checked: boolean) => void };
};

const InfoCard: React.FC<InfoCardProps> = ({ icon, title, description, className, rightSlot, buttonProps, badgeProps, switchProps }) => {
  const [checked, setChecked] = React.useState<boolean>(!!switchProps?.defaultChecked);

  const right = rightSlot ?? (
    switchProps ? (
      <Switch
        defaultChecked={checked}
        onClick={() => {
          const next = !checked;
          setChecked(next);
          switchProps?.onChange?.(next);
        }}
      />
    ) : buttonProps ? (
      <ActionButton variant={buttonProps.variant} size={buttonProps.size} className={buttonProps.className} onClick={buttonProps.onClick}>
        {buttonProps.label}
      </ActionButton>
    ) : badgeProps ? (
      <Badge variant={badgeProps.variant} className={badgeProps.className}>
        {badgeProps.children}
      </Badge>
    ) : null
  );

  return (
    <Card className={cn('flex flex-row flex-wrap items-center justify-between px-6 py-4', className)}>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:gap-3 max-w-fit">
        {icon && <div className="shrink-0">{icon}</div>}

        <div className="max-w-fit">
          {typeof title === 'string' ? (
            <p className="truncate">{title}</p>
          ) : (
            title
          )}

          {description && (
            typeof description === 'string' ? (
              <p className="text-sm text-muted-foreground whitespace-normal text-wrap">{description}</p>
            ) : (
              description
            )
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">{right}</div>
    </Card>
  );
};

export default InfoCard;