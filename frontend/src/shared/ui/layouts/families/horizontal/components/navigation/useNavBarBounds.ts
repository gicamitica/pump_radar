import React from 'react';

export const NavBarBoundsContext = React.createContext<HTMLDivElement | null>(null);

export const useNavBarBounds = () => {
  return React.useContext(NavBarBoundsContext);
};
