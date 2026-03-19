export interface SearchResult {
  id: string;
  type: 'user' | 'team' | 'page' | 'setting' | 'document';
  title: string;
  description?: string;
  path: string;
  icon?: string;
  highlight?: string;
  metadata?: Record<string, string>;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  totalCount: number;
  took: number;
}
