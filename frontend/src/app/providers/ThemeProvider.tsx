import React from 'react';
import type { PropsWithChildren } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="katalyst_theme"
    >
      {children}
    </NextThemesProvider>
  );
};
