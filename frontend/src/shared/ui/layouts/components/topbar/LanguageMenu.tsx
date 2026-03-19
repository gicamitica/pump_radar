import React from 'react';
import AnimatedDropdown from '@/shared/ui/components/animated-dropdown/AnimatedDropdown';
import AnimatedDropdownTrigger from '@/shared/ui/components/animated-dropdown/AnimatedDropdownTrigger';
import AnimatedDropdownContent from '@/shared/ui/components/animated-dropdown/AnimatedDropdownContent';
import { useAnimatedDropdown } from '@/shared/ui/components/animated-dropdown/useAnimatedDropdown';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocales } from '@/hooks/useLocales';
import { getFlagForLocale } from '@/shared/ui/data/flags';
// import { FloatingHover } from '@/shared/ui/components/FloatingHover';
// import { useHoverBackground } from '@/shared/ui/components/useHoverBackground';
import { cn } from '@/shadcn/lib/utils';

interface LangGridProps {
  locales: ReturnType<typeof useLocales>['locales'];
  currentLang: string;
  changeLanguage: (code: string) => Promise<void>;
  label: string;
}

const LangGrid: React.FC<LangGridProps> = ({ locales, currentLang, changeLanguage, label }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  // const { rect, bind, clear } = useHoverBackground(containerRef);
  const { setOpen } = useAnimatedDropdown();

  return (
    <div>
      <div className="px-2 pt-1 pb-2 text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</div>
      <div ref={containerRef} className="relative grid grid-cols-3 max-h-[300px] overflow-y-auto p-1" 
      // onMouseLeave={clear}
      >
        {/* <FloatingHover rect={rect} insetX={4} /> */}

        {locales.map((l) => {
          const Flag = getFlagForLocale(l.code);
          // Check if this locale matches the current language
          // Compare both exact match (en === en) and language base (en-US starts with en)
          const isActive = currentLang === l.code || currentLang.startsWith(l.code + '-') || l.code.startsWith(currentLang.split('-')[0]);
          
          return (
            <button
              key={l.code}
              type="button"
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-lg p-2 cursor-pointer',
                'transition-colors duration-200',
                'hover:bg-gray-50 dark:hover:bg-neutral-900',
                isActive && "border bg-gray-50 dark:bg-neutral-900"
              )}
              onClick={() => { setOpen(false); void changeLanguage(l.code); }}
              // {...bind}
            >
              <div className="size-8 overflow-hidden flex items-center justify-center">
                {Flag ? (
                  <Flag className="w-full h-full" />
                ) : (
                  <span className="text-[10px] font-semibold uppercase">{l.code}</span>
                )}
              </div>

              <p className="text-sm text-center capitalize">{l.nativeName || l.englishName || l.code}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const LanguageMenu: React.FC = () => {
  const { t } = useTranslation('common');
  const { locales, current, changeLanguage } = useLocales();

  const currentFlag = getFlagForLocale(current);

  return (
    <AnimatedDropdown placement="bottom-end" openOn="hover">
      <AnimatedDropdownTrigger asChild>
        <button
          className="inline-flex size-9 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 border border-gray-200/70 dark:border-neutral-800"
          aria-label={t('topbar.languages', { defaultValue: 'Languages' })}
        >
          {currentFlag ? currentFlag({ className: 'size-5 rounded-full overflow-hidden' }) : (
            <Languages className="size-5" />
          )}
        </button>
      </AnimatedDropdownTrigger>
      <AnimatedDropdownContent className="z-[60] w-[360px]">
        <LangGrid 
          label={t('topbar.selectLanguage', { defaultValue: 'Select Language' })} 
          locales={locales} 
          currentLang={current} 
          changeLanguage={changeLanguage} 
        />
      </AnimatedDropdownContent>
    </AnimatedDropdown>
  );
};

export default LanguageMenu;
