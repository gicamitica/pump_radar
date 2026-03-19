import { useContext } from 'react';
import { VerticalTabsContext } from './VerticalTabsContext';

export const useVerticalTabs = () => {
  const context = useContext(VerticalTabsContext);
  if (!context) {
    throw new Error('useVerticalTabs must be used within a VerticalTabsProvider');
  }
  return context;
};
