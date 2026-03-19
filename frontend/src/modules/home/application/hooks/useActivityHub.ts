import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useActivityHubRepository } from './useActivityHubRepository';

const QUERY_KEYS = {
  hub: ['home', 'activity-hub'] as const,
  activity: ['home', 'activity-hub', 'activity'] as const,
};

export function useActivityHubState() {
  const repository = useActivityHubRepository();

  return useQuery({
    queryKey: QUERY_KEYS.hub,
    queryFn: () => repository.getHubState(),
  });
}

export function useActivityStream() {
  const repository = useActivityHubRepository();

  return useInfiniteQuery({
    queryKey: QUERY_KEYS.activity,
    queryFn: ({ pageParam = 0 }) => repository.getMoreActivity(pageParam, 10),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 10) return undefined;
      return allPages.length * 10;
    },
  });
}

export function useRecordModuleVisit() {
  const repository = useActivityHubRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduleId: string) => repository.recordModuleVisit(moduleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hub });
    },
  });
}

export function useToggleShortcutFavorite() {
  const repository = useActivityHubRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (shortcutId: string) => repository.toggleShortcutFavorite(shortcutId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hub });
    },
  });
}

export function useCompletePowerTips() {
  const repository = useActivityHubRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => repository.completePowerTips(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.hub });
    },
  });
}
