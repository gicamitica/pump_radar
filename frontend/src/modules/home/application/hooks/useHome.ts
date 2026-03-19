import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useHomeRepository } from './useHomeRepository';

const QUERY_KEYS = {
  dashboard: ['home', 'dashboard'] as const,
  tour: ['home', 'tour'] as const,
};

export function useHomeDashboard() {
  const repository = useHomeRepository();

  return useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: () => repository.getDashboard(),
  });
}

export function useTourState() {
  const repository = useHomeRepository();

  return useQuery({
    queryKey: QUERY_KEYS.tour,
    queryFn: () => repository.getTourState(),
  });
}

export function useUpdateChecklistItem() {
  const repository = useHomeRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, completed }: { itemId: string; completed: boolean }) =>
      repository.updateChecklistItem(itemId, completed),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

export function useCompleteTour() {
  const repository = useHomeRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => repository.completeTour(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tour });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

export function useSkipTour() {
  const repository = useHomeRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => repository.skipTour(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tour });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}

export function useResetTour() {
  const repository = useHomeRepository();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => repository.resetTour(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.tour });
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
    },
  });
}
