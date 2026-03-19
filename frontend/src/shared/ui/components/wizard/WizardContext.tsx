import { createContext, useContext } from 'react';
import type { WizardContextValue } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const WizardContext = createContext<WizardContextValue<any> | null>(null);

export function useWizard<T extends Record<string, unknown>>(): WizardContextValue<T> {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a Wizard component');
  }
  return context as WizardContextValue<T>;
}
