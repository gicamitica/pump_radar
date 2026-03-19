import { useQuery } from '@tanstack/react-query';
import type { SearchResponse } from '../../domain/models/SearchResult';

async function fetchSearchResults(query: string): Promise<SearchResponse> {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Search failed');
  }
  return response.json();
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => fetchSearchResults(query),
    enabled: query.length > 0,
    staleTime: 30000,
  });
}
