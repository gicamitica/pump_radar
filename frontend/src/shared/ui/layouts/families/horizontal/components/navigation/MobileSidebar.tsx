import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "../../../vertical";
import { useLayout } from "../../../../app";
import { X } from "lucide-react";
import { getSidebarAppearance } from "@/shared/ui/layouts/tokens/sidebarAppearances";

/* Mobile Sidebar Overlay */
const MobileSidebar = () => {
  const { mobileOpen, setMobileOpen, collapsed, toggleCollapsed } = useLayout();

  return (
    <AnimatePresence>
      {mobileOpen && (
        <motion.div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/40 cursor-pointer backdrop-blur-sm flex items-start justify-end p-4"
            onClick={() => setMobileOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileOpen(false);
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>

          <motion.aside
            style={getSidebarAppearance('dark')}
            className={cn(
              'absolute left-0 top-0 h-full w-64 px-3 py-4',
              'bg-sidebar sidebar-surface text-sidebar-foreground',
            )}
            initial={{ x: '-100%' }}
            animate={{ x: 0, width: collapsed ? 64 : 288 }}
            exit={{ x: '-100%' }}
            transition={{ 
              type: 'spring',
              stiffness: 380,
              damping: 38,
              mass: 0.8
            }}
          >
            <Sidebar
              collapsed={collapsed}
              onToggle={toggleCollapsed}
              onItemClick={() => setMobileOpen(false)}
            />
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileSidebar;
