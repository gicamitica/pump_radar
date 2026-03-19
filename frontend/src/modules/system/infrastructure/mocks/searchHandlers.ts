import { http, HttpResponse, delay } from 'msw';
import { api } from '@/mocks/utils/apiPath';
import type { SearchResult, SearchResponse } from '../../domain/models/SearchResult';
import { highlightHtml } from '@/shared/lib/highlight';

const mockSearchDatabase: SearchResult[] = [
  // Users
  { id: 'user-1', type: 'user', title: 'John Smith', description: 'Administrator', path: '/management/users/1', icon: 'Users', metadata: { email: 'john@example.com', role: 'Admin' } },
  { id: 'user-2', type: 'user', title: 'Sarah Johnson', description: 'Team Lead', path: '/management/users/2', icon: 'Users', metadata: { email: 'sarah@example.com', role: 'Manager' } },
  { id: 'user-3', type: 'user', title: 'Mike Williams', description: 'Developer', path: '/management/users/3', icon: 'Users', metadata: { email: 'mike@example.com', role: 'Member' } },
  { id: 'user-4', type: 'user', title: 'Emily Davis', description: 'Designer', path: '/management/users/4', icon: 'Users', metadata: { email: 'emily@example.com', role: 'Member' } },
  { id: 'user-5', type: 'user', title: 'Alex Chen', description: 'Product Manager', path: '/management/users/5', icon: 'Users', metadata: { email: 'alex@example.com', role: 'Manager' } },
  
  // Teams
  { id: 'team-1', type: 'team', title: 'Engineering', description: '12 members', path: '/management/teams/1', icon: 'UsersRound', metadata: { members: '12' } },
  { id: 'team-2', type: 'team', title: 'Design', description: '5 members', path: '/management/teams/2', icon: 'UsersRound', metadata: { members: '5' } },
  { id: 'team-3', type: 'team', title: 'Marketing', description: '8 members', path: '/management/teams/3', icon: 'UsersRound', metadata: { members: '8' } },
  { id: 'team-4', type: 'team', title: 'Sales', description: '15 members', path: '/management/teams/4', icon: 'UsersRound', metadata: { members: '15' } },
  
  // Pages
  { id: 'page-1', type: 'page', title: 'Dashboard', description: 'Main dashboard overview', path: '/', icon: 'LayoutDashboard' },
  { id: 'page-2', type: 'page', title: 'User Management', description: 'Manage users and permissions', path: '/management/users', icon: 'Users' },
  { id: 'page-3', type: 'page', title: 'Team Management', description: 'Organize teams and members', path: '/management/teams', icon: 'UsersRound' },
  { id: 'page-4', type: 'page', title: 'Email Templates', description: 'Configure email templates', path: '/apps/email/templates', icon: 'Mail' },
  { id: 'page-5', type: 'page', title: 'Calendar', description: 'Schedule and events', path: '/apps/calendar', icon: 'Calendar' },
  { id: 'page-6', type: 'page', title: 'Kanban Board', description: 'Project management board', path: '/apps/kanban', icon: 'Kanban' },
  { id: 'page-7', type: 'page', title: 'Changelog', description: 'System updates and releases', path: '/system/changelog', icon: 'FileText' },
  
  // Settings
  { id: 'setting-1', type: 'setting', title: 'General Settings', description: 'Application preferences', path: '/settings/general', icon: 'Settings' },
  { id: 'setting-2', type: 'setting', title: 'Security Settings', description: 'Authentication and security', path: '/settings/security', icon: 'Shield' },
  { id: 'setting-3', type: 'setting', title: 'Notification Settings', description: 'Email and push notifications', path: '/settings/notifications', icon: 'Bell' },
  { id: 'setting-4', type: 'setting', title: 'API Keys', description: 'Manage API access tokens', path: '/settings/api-keys', icon: 'Key' },
  
  // Documents
  { id: 'doc-1', type: 'document', title: 'Getting Started Guide', description: 'Quick start documentation', path: '/docs/getting-started', icon: 'FileText' },
  { id: 'doc-2', type: 'document', title: 'API Documentation', description: 'REST API reference', path: '/docs/api', icon: 'FileCode' },
  { id: 'doc-3', type: 'document', title: 'User Guide', description: 'Complete user manual', path: '/docs/user-guide', icon: 'BookOpen' },
  { id: 'doc-4', type: 'document', title: 'Admin Handbook', description: 'Administrator documentation', path: '/docs/admin', icon: 'Book' },
];

function searchDatabase(query: string): SearchResult[] {
  const lowerQuery = query.toLowerCase().trim();
  
  if (!lowerQuery) {
    return [];
  }
  
  // First, try to find exact matches
  const exactMatches = mockSearchDatabase.filter(item => {
    const searchableText = [
      item.title,
      item.description,
      item.type,
      ...(item.metadata ? Object.values(item.metadata) : []),
    ].join(' ').toLowerCase();
    
    return searchableText.includes(lowerQuery);
  });

  // If we have exact matches, return them
  if (exactMatches.length > 0) {
    return exactMatches.map(item => ({
      ...item,
      highlight: highlightHtml(item.title, query),
    }));
  }

  // For demo purposes: always return some results even if no exact match
  // Generate mock results based on the query
  const demoResults: SearchResult[] = [
    {
      id: `search-user-${lowerQuery}`,
      type: 'user',
      title: `User matching "${query}"`,
      description: 'Demo user result',
      path: '/management/users',
      icon: 'Users',
      metadata: { email: `${lowerQuery.replace(/\s+/g, '.')}@example.com`, role: 'Member' },
    },
    {
      id: `search-team-${lowerQuery}`,
      type: 'team',
      title: `Team "${query}"`,
      description: '3 members',
      path: '/management/teams',
      icon: 'UsersRound',
      metadata: { members: '3' },
    },
    {
      id: `search-page-${lowerQuery}`,
      type: 'page',
      title: `Page related to "${query}"`,
      description: 'Navigate to this page',
      path: '/',
      icon: 'LayoutDashboard',
    },
    {
      id: `search-doc-${lowerQuery}`,
      type: 'document',
      title: `Documentation for "${query}"`,
      description: 'Help article and guides',
      path: '/docs',
      icon: 'FileText',
    },
    {
      id: `search-setting-${lowerQuery}`,
      type: 'setting',
      title: `Settings for "${query}"`,
      description: 'Configure this feature',
      path: '/settings',
      icon: 'Settings',
    },
  ];

  return demoResults.map(item => ({
    ...item,
    highlight: highlightHtml(item.title, query),
  }));
}

export const searchHandlers = [
  http.get(api('/search'), async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    
    await delay(300);
    
    const startTime = Date.now();
    const results = searchDatabase(query);
    const took = Date.now() - startTime;
    
    const response: SearchResponse = {
      query,
      results,
      totalCount: results.length,
      took,
    };
    
    return HttpResponse.json(response);
  }),
];
