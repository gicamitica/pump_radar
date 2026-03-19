import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/components/ui/card';
import { Button } from '@/shared/ui/shadcn/components/ui/button';
import {
  Command,
  Search,
  Users,
  UsersRound,
  Settings,
  HelpCircle,
  Star,
  Keyboard,
} from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import type { ShortcutItem } from '../../../domain/models';

interface ShortcutsPanelProps {
  shortcuts: ShortcutItem[];
  onToggleFavorite?: (shortcutId: string) => void;
}

const iconMap: Record<string, typeof Command> = {
  Command,
  Search,
  Users,
  UsersRound,
  Settings,
  HelpCircle,
};

export function ShortcutsPanel({ shortcuts, onToggleFavorite }: ShortcutsPanelProps) {
  const { t } = useTranslation('activityHub');

  const favorites = shortcuts.filter((s) => s.isFavorite);
  const others = shortcuts.filter((s) => !s.isFavorite);

  return (
    <Card data-tour="shortcuts">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Keyboard className="h-4 w-4 text-primary" />
          {t('shortcuts.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {favorites.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {t('shortcuts.favorites')}
            </p>
            {favorites.map((shortcut) => {
              const Icon = iconMap[shortcut.icon] ?? Command;
              return (
                <div
                  key={shortcut.id}
                  className="flex items-center gap-2 py-1.5"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{shortcut.label}</span>
                  {shortcut.shortcut && (
                    <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      {shortcut.shortcut}
                    </kbd>
                  )}
                  {onToggleFavorite && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onToggleFavorite(shortcut.id)}
                    >
                      <Star
                        className={cn(
                          'h-3 w-3',
                          shortcut.isFavorite
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground'
                        )}
                      />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {others.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {t('shortcuts.all')}
            </p>
            {others.map((shortcut) => {
              const Icon = iconMap[shortcut.icon] ?? Command;
              return (
                <div
                  key={shortcut.id}
                  className="flex items-center gap-2 py-1.5 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm">{shortcut.label}</span>
                  {shortcut.shortcut && (
                    <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      {shortcut.shortcut}
                    </kbd>
                  )}
                  {onToggleFavorite && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => onToggleFavorite(shortcut.id)}
                    >
                      <Star className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            {t('shortcuts.hint')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
