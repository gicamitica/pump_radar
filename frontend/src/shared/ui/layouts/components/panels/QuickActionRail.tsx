import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Settings, 
  Calendar,
  MessageCircle,
  Mail,
  Bell,
  Kanban,
  FileText,
  ListTodo,
  CheckSquare
} from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { useLayout } from '../../app';

interface ActionItem {
  id: string;
  icon: React.ElementType;
  label: string;
  to: string;
  color?: string;
  badge?: number;
}

const actions: ActionItem[] = [
  { id: 'daily-plan', icon: ListTodo, label: 'Daily Plan', to: '/home/setup', color: 'text-muted-foreground' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks', to: '/apps/tasks', color: 'text-muted-foreground' },
  { id: 'calendar', icon: Calendar, label: 'Calendar', to: '/apps/calendar', color: 'text-muted-foreground' },
  { id: 'email', icon: Mail, label: 'Email', to: '/apps/email', color: 'text-muted-foreground', badge: 12 },
  { id: 'chat', icon: MessageCircle, label: 'Chat', to: '/apps/chat', color: 'text-muted-foreground' },
  { id: 'inbox', icon: Bell, label: 'Inbox', to: '/apps/inbox', color: 'text-muted-foreground', badge: 5 },
  { id: 'kanban', icon: Kanban, label: 'Kanban', to: '/apps/kanban', color: 'text-muted-foreground' },
  { id: 'invoices', icon: FileText, label: 'Invoices', to: '/invoices', color: 'text-muted-foreground' },
  { id: 'ai-assistant', icon: Sparkles, label: 'AI Assistant', to: '/home/setup', color: 'text-primary/70' },
];

export const QuickActionRail: React.FC = () => {
  const { settings, activeRightPanelTab, setActiveRightPanelTab } = useLayout();
  const navigate = useNavigate();

  const handleActionClick = (action: ActionItem) => {
    if (settings.rightPanel === 'dual') {
       setActiveRightPanelTab(activeRightPanelTab === action.id ? null : action.id);
    } else {
       // Shortcut mode: Navigate to full app
       navigate(action.to);
    }
  };

  return (
    <aside className={cn(
      "hidden lg:flex flex-col items-center py-4 px-2 shrink-0 border-l border-sidebar-border bg-sidebar-surface/10 sticky top-0 h-dvh z-30",
      "w-[64px]"
    )}>
      <div className="flex flex-col items-center gap-4">
        {actions.map((action) => {
          const isActive = settings.rightPanel === 'dual' && activeRightPanelTab === action.id;
          
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={cn(
                "group relative p-3 rounded-2xl transition-all duration-200 active:scale-90",
                isActive 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "hover:bg-sidebar-hover text-sidebar-foreground"
              )}
            >
              <action.icon className={cn(
                "size-5 transition-transform group-hover:scale-110", 
                !isActive && action.color
              )} />
              {action.badge && (
                <span className="absolute top-1 right-1 size-4 flex items-center justify-center bg-primary text-[10px] font-bold text-white rounded-full ring-2 ring-sidebar-background">
                  {action.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto">
        <Link to="/playground/layout-builder">
          <button className="p-3 rounded-2xl hover:bg-sidebar-hover text-sidebar-muted transition-all">
            <Settings className="size-5" />
          </button>
        </Link>
      </div>
    </aside>
  );
};
