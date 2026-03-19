import React, { useMemo } from 'react';
import { X, Sparkles, Calendar, MessageCircle, Mail, Bell, Kanban, FileText, CheckSquare, StickyNote, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shadcn/lib/utils';
import { useLayout } from '../../app';
import { EmptyState } from '@/components/states';

interface ActivityPanelProps {
  onClose?: () => void;
}

const DummyWidget = () => {
  return (
    <div className="flex items-center justify-center h-full">
      <EmptyState
        title="Activity widget"
        description="Widgets are part of the Apps ecosystem. You can add widgets to the activity panel to enhance your productivity."
        icon={Calendar}
      />
    </div>
  );
};

export const ActivityPanel: React.FC<ActivityPanelProps> = ({ onClose }) => {
  const { activeRightPanelTab, setActiveRightPanelTab } = useLayout();

  const activeWidget = useMemo(() => {
    switch (activeRightPanelTab) {
      case 'daily-plan':
        return { title: 'Daily Plan', icon: Calendar, component: <DummyWidget /> };
      case 'ai-assistant':
        return { title: 'AI Assistant', icon: Sparkles, component: <DummyWidget /> };
      case 'tasks':
        return { title: 'Tasks', icon: CheckSquare, component: <DummyWidget /> };
      case 'notes':
        return { title: 'Quick Notes', icon: StickyNote, component: <DummyWidget /> };
      case 'files':
        return { title: 'Explorer', icon: FolderOpen, component: <DummyWidget /> };
      case 'calendar':
        return { title: 'Events', icon: Calendar, component: <DummyWidget /> };
      case 'chat':
        return { title: 'Messenger', icon: MessageCircle, component: <DummyWidget /> };
      case 'email':
        return { title: 'Mailbox', icon: Mail, component: <DummyWidget /> };
      case 'inbox':
        return { title: 'Notifications', icon: Bell, component: <DummyWidget /> };
      case 'kanban':
        return { title: 'Board', icon: Kanban, component: <DummyWidget /> };
      case 'invoices':
        return { title: 'Invoicing', icon: FileText, component: <DummyWidget /> };
      default:
        return { title: 'Activity', icon: Calendar, component: <DummyWidget /> };
    }
  }, [activeRightPanelTab]);

  const handleClose = () => {
    if (onClose) onClose();
    setActiveRightPanelTab(null);
  };

  if (!activeRightPanelTab) return null;

  return (
    <motion.aside 
      initial={{ x: 340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 340, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={cn(
        "hidden xl:flex flex-col shrink-0 border-l border-sidebar-border bg-sidebar-background sticky top-0 h-dvh z-30",
        "w-[340px]"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border bg-sidebar-surface/50">
        <div className="flex items-center gap-2">
          <activeWidget.icon className="size-5 text-primary" />
          <h2 className="font-bold text-xs uppercase tracking-widest text-sidebar-muted">{activeWidget.title}</h2>
        </div>
        <button onClick={handleClose} className="p-1 hover:bg-sidebar-hover rounded-lg transition-colors">
          <X className="size-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRightPanelTab}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {activeWidget.component}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.aside>
  );
};
