import {
  Home, LayoutDashboard, BarChart2, PieChart, Calendar, Mail, MessageCircle,
  Kanban, FileText, Users, Settings, Plug, Bell, Palette, Type, Component,
  Table, LayoutGrid, Layers, AlertTriangle, Sparkles, Zap, Command, Badge,
  Keyboard, Lock, ShieldCheck, BookOpen, Loader, Search, Columns, GitCommit, Truck,
  // New icons for showcase
  Pencil, MousePointer2, ChevronDownSquare, Accessibility, Move, AlignLeft,
  Boxes, Combine, SlidersHorizontal, ToggleLeft, Eye,
  ListOrdered, ShoppingCart, Briefcase, GraduationCap, Contact,
  Brain, HardDrive, StickyNote, Map, CheckSquare, HeartPulse, Headphones, Video, Clock,
  Send
} from 'lucide-react';
import type { SidebarIconKey } from '@/app/config/navigation';

/**
 * Shared icon map for navigation components
 * 
 * Used by both vertical and horizontal layouts to render navigation icons.
 */
export const iconMap: Record<SidebarIconKey, React.ComponentType<{ className?: string }>> = {
  'home': Home,
  'layout-dashboard': LayoutDashboard,
  'bar-chart': BarChart2,
  'pie-chart': PieChart,
  'calendar': Calendar,
  'mail': Mail,
  'message-circle': MessageCircle,
  'kanban': Kanban,
  'file-text': FileText,
  'users': Users,
  'settings': Settings,
  'plug': Plug,
  'bell': Bell,
  'palette': Palette,
  'type': Type,
  'component': Component,
  'table': Table,
  'layout-grid': LayoutGrid,
  'layers': Layers,
  'alert-triangle': AlertTriangle,
  'sparkles': Sparkles,
  'zap': Zap,
  'command': Command,
  'badge': Badge,
  'keyboard': Keyboard,
  'lock': Lock,
  'shield-check': ShieldCheck,
  'book-open': BookOpen,
  'loader': Loader,
  'search': Search,
  'columns': Columns,
  'git-commit': GitCommit,
  'truck': Truck,
  // New icons
  'pencil': Pencil,
  'mouse-pointer': MousePointer2,
  'chevron-down-square': ChevronDownSquare,
  'accessibility': Accessibility,
  'move': Move,
  'align-left': AlignLeft,
  'boxes': Boxes,
  'combine': Combine,
  'sliders': SlidersHorizontal,
  'toggle': ToggleLeft,
  'eye': Eye,
  'list-ordered': ListOrdered,
  'shopping-cart': ShoppingCart,
  'briefcase': Briefcase,
  'graduation-cap': GraduationCap,
  'contact': Contact,
  'brain': Brain,
  'hard-drive': HardDrive,
  'sticky-note': StickyNote,
  'map': Map,
  'check-square': CheckSquare,
  'heart-pulse': HeartPulse,
  'headphones': Headphones,
  'video': Video,
  'clock': Clock,
  'telegram': Send,
};

/**
 * Default icons for navigation groups
 */
export const groupIconMap: Record<string, SidebarIconKey> = {
  'home': 'home',
  'dashboards': 'layout-dashboard',
  'solutions': 'layout-grid',
  'apps': 'calendar',
  'management': 'users',
  'pages': 'file-text',
  'showcase': 'palette',
  'auth': 'lock',
  'system': 'settings',
  'widgets': 'sparkles',
};
