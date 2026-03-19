import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  PlusCircle, 
  RefreshCw, 
  AlertTriangle, 
  MinusCircle, 
  CheckCircle, 
  Shield, 
  Info,
  Calendar,
  Tag,
} from 'lucide-react';
import { 
  CHANGELOG_ENTRIES, 
  CHANGELOG_SECTION_LABELS,
  type ChangelogSection,
  type ChangelogEntry,
} from '@/modules/system/data/changelog';

const SECTION_ICONS: Record<ChangelogSection, React.ElementType> = {
  added: PlusCircle,
  changed: RefreshCw,
  deprecated: AlertTriangle,
  removed: MinusCircle,
  fixed: CheckCircle,
  security: Shield,
  notes: Info,
};

const SECTION_COLORS: Record<ChangelogSection, { bg: string; text: string; border: string }> = {
  added: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  changed: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  deprecated: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  removed: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  fixed: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  security: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
  notes: {
    bg: 'bg-gray-50 dark:bg-gray-800/50',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-200 dark:border-gray-700',
  },
};

const ChangelogSectionBlock: React.FC<{ 
  section: ChangelogSection; 
  items: string[];
}> = ({ section, items }) => {
  const Icon = SECTION_ICONS[section];
  const colors = SECTION_COLORS[section];
  const label = CHANGELOG_SECTION_LABELS[section];

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} p-4`}>
      <div className={`flex items-center gap-2 mb-3 ${colors.text}`}>
        <Icon className="size-5" />
        <h4 className="font-semibold">{label}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li 
            key={index} 
            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <span className={`mt-1.5 size-1.5 rounded-full flex-shrink-0 ${colors.text.replace('text-', 'bg-')}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const VersionCard: React.FC<{ entry: ChangelogEntry }> = ({ entry }) => {
  const { t } = useTranslation('system');
  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const sectionOrder: ChangelogSection[] = ['added', 'changed', 'fixed', 'deprecated', 'removed', 'security', 'notes'];
  const availableSections = sectionOrder.filter(s => entry.sections[s]?.length);

  return (
    <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Version Header */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Tag className="size-5 text-primary" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {t('changelog.version', { version: entry.version })}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="size-4" />
            <time dateTime={entry.date}>{formattedDate}</time>
          </div>
        </div>
      </div>

      {/* Version Content */}
      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {availableSections.map(section => (
            <ChangelogSectionBlock
              key={section}
              section={section}
              items={entry.sections[section]!}
            />
          ))}
        </div>
      </div>
    </article>
  );
};

const ChangelogPage: React.FC = () => {
  const { t } = useTranslation('system');

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {t('changelog.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
          {t('changelog.description')}
        </p>
      </header>

      {/* Changelog Timeline */}
      <div className="space-y-8">
        {CHANGELOG_ENTRIES.map(entry => (
          <VersionCard key={entry.version} entry={entry} />
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {t('changelog.footer')}
        </p>
      </footer>
    </div>
  );
};

export default ChangelogPage;
