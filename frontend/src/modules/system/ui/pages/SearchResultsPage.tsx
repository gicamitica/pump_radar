import { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/shared/ui/shadcn/components/ui/card';
import { Skeleton } from '@/shared/ui/components/Skeleton';
import { EmptyState } from '@/shared/ui/components/states/EmptyState';
import {
  Search,
  Users,
  UsersRound,
  LayoutDashboard,
  Mail,
  Calendar,
  Kanban,
  FileText,
  FileCode,
  BookOpen,
  Book,
  Settings,
  Shield,
  Bell,
  Key,
  ArrowRight,
  SearchX,
} from 'lucide-react';
import { cn } from '@/shadcn/lib/utils';
import { useSearch } from '../../application/hooks/useSearch';
import type { SearchResult } from '../../domain/models/SearchResult';

const iconMap: Record<string, typeof Search> = {
  Users,
  UsersRound,
  LayoutDashboard,
  Mail,
  Calendar,
  Kanban,
  FileText,
  FileCode,
  BookOpen,
  Book,
  Settings,
  Shield,
  Bell,
  Key,
  Search,
};

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  user: { label: 'User', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  team: { label: 'Team', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-500/10' },
  page: { label: 'Page', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  setting: { label: 'Setting', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  document: { label: 'Document', color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-500/10' },
};

function SearchResultSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl border">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchResultItem({ result, onClick }: { result: SearchResult; onClick: () => void }) {
  const Icon = iconMap[result.icon ?? 'Search'] ?? Search;
  const config = typeConfig[result.type];

  return (
    <button
      className="flex items-center gap-4 w-full p-4 rounded-xl border bg-card hover:bg-muted/50 hover:border-muted-foreground/20 transition-all duration-200 text-left group"
      onClick={onClick}
    >
      <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105', config.bg)}>
        <Icon className={cn('h-6 w-6', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p 
            className="text-sm font-medium"
            dangerouslySetInnerHTML={{ __html: result.highlight ?? result.title }}
          />
          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', config.bg, config.color)}>
            {config.label}
          </span>
        </div>
        {result.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{result.description}</p>
        )}
        {result.metadata && (
          <div className="flex items-center gap-3 mt-1">
            {Object.entries(result.metadata).map(([key, value]) => (
              <span key={key} className="text-[10px] text-muted-foreground/70">
                {key}: {value}
              </span>
            ))}
          </div>
        )}
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export default function SearchResultsPage() {
  const { t } = useTranslation('system');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data, isLoading, error } = useSearch(query);

  const results = data?.results;
  const groupedResults = useMemo(() => {
    if (!results) return new Map<string, SearchResult[]>();
    
    const groups = new Map<string, SearchResult[]>();
    for (const result of results) {
      const type = result.type;
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      groups.get(type)!.push(result);
    }
    return groups;
  }, [results]);

  const handleResultClick = (result: SearchResult) => {
    navigate(result.path);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <Search className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('search.title', 'Search Results')}</h1>
          <p className="text-sm text-muted-foreground">
            {query ? (
              <>
                {t('search.resultsFor', 'Results for')} <span className="font-medium text-foreground">"{query}"</span>
                {data && (
                  <span className="ml-2 text-muted-foreground/70">
                    ({data.totalCount} {t('search.found', 'found')} in {data.took}ms)
                  </span>
                )}
              </>
            ) : (
              t('search.enterQuery', 'Enter a search term to find results')
            )}
          </p>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <SearchResultSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={SearchX}
              title={t('search.error', 'Search failed')}
              description={t('search.errorDescription', 'An error occurred while searching. Please try again.')}
              action={{
                label: t('search.retry', 'Retry'),
                onClick: () => window.location.reload(),
              }}
              variant="error"
            />
          </CardContent>
        </Card>
      ) : !query ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Search}
              title={t('search.noQuery', 'Start searching')}
              description={t('search.noQueryDescription', 'Use the command palette (⌘K) to search for users, teams, pages, and more.')}
            />
          </CardContent>
        </Card>
      ) : data?.results.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={SearchX}
              title={t('search.noResults', 'No results found')}
              description={t('search.noResultsDescription', `We couldn't find anything matching "${query}". Try a different search term.`)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedResults.entries()).map(([type, results]) => {
            const config = typeConfig[type];
            return (
              <section key={type}>
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span className={cn('h-2 w-2 rounded-full', config.bg.replace('/10', ''))} />
                  {config.label}s
                  <span className="text-muted-foreground font-normal">({results.length})</span>
                </h2>
                <div className="space-y-2">
                  {results.map((result) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      onClick={() => handleResultClick(result)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
