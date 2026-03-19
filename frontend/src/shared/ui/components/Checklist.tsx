import { type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shadcn/components/ui/card';
import { Button } from '@/shadcn/components/ui/button';
import { Progress } from '@/shadcn/components/ui/progress';
import { Checkbox } from '@/shadcn/components/ui/checkbox';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';

export interface ChecklistItemData {
  /** Unique identifier for the item */
  id: string;
  /** Key used for translations or identification */
  key: string;
  /** Whether the item is completed */
  completed: boolean;
  /** Optional icon to display when not completed */
  icon?: ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
}

export interface ChecklistAction {
  /** Label for the action button */
  label: string;
  /** Icon to display in the button */
  icon?: ReactNode;
  /** Click handler */
  onClick: (item: ChecklistItemData) => void;
  /** Variant for the button */
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  /** Whether to show this action - receives the item to determine visibility */
  showWhen?: (item: ChecklistItemData) => boolean;
}

export interface ChecklistProps {
  /** Title for the checklist card */
  title: string;
  /** Array of checklist items */
  items: ChecklistItemData[];
  /** Handler when an item's checkbox is toggled */
  onToggleItem: (itemId: string, completed: boolean) => void;
  /** Whether updates are in progress */
  isUpdating?: boolean;
  /** Progress label template - use {{completed}} and {{total}} placeholders */
  progressLabel?: string;
  /** Actions to display for each incomplete item */
  actions?: ChecklistAction[];
  /** Additional class name for the card */
  className?: string;
  /** Data attribute for tour targeting */
  'data-tour'?: string;
}

export function Checklist({
  title,
  items,
  onToggleItem,
  isUpdating,
  progressLabel = '{{completed}} of {{total}} completed',
  actions = [],
  className,
  'data-tour': dataTour,
}: ChecklistProps) {
  const completedCount = items.filter((item) => item.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const formattedProgressLabel = progressLabel
    .replace('{{completed}}', String(completedCount))
    .replace('{{total}}', String(items.length));

  return (
    <Card className={className} data-tour={dataTour}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <span className="text-sm text-muted-foreground">{formattedProgressLabel}</span>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item) => {
          const DefaultIcon = Circle;

          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                item.completed ? 'bg-muted/50' : 'hover:bg-muted/30'
              )}
            >
              <Checkbox
                checked={item.completed}
                onCheckedChange={(checked) => onToggleItem(item.id, checked === true)}
                disabled={isUpdating}
                className="shrink-0"
              />
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                  item.completed ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                )}
              >
                {item.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : item.icon ? (
                  item.icon
                ) : (
                  <DefaultIcon className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    item.completed && 'text-muted-foreground line-through'
                  )}
                >
                  {item.title}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                )}
              </div>
              {!item.completed && actions.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  {actions.map((action, index) => {
                    const shouldShow = action.showWhen ? action.showWhen(item) : true;
                    if (!shouldShow) return null;

                    return (
                      <Button
                        key={index}
                        variant={action.variant ?? 'outline'}
                        size="sm"
                        className="h-7 px-2 text-xs gap-1"
                        onClick={() => action.onClick(item)}
                        disabled={isUpdating}
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

