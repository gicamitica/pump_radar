import { useLayout } from "../app";
import { Menu } from "lucide-react";
import { useTranslation } from "react-i18next";

const MobileNavigationToggler = () => {
  const { setMobileOpen } = useLayout();
  const { t } = useTranslation('common');

  return <button
    className="md:hidden inline-flex size-9 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    aria-label={t('topbar.openMenu', { defaultValue: 'Open menu' })}
    onClick={() => setMobileOpen(true)}
  >
    <Menu className="size-5" />
  </button>
}

export default MobileNavigationToggler;
