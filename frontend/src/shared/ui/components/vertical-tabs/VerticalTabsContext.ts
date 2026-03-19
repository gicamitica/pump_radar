import { createContext } from 'react';

export interface VerticalTabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const VerticalTabsContext = createContext<VerticalTabsContextValue | null>(null);
