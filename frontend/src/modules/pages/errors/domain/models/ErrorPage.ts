export type ErrorPageKind = 'not_found' | 'server_error';

export interface ErrorPageContent {
  kind: ErrorPageKind;
  code: '404' | '500';
  title: string;
  description: string;
}
