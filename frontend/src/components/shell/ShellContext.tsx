'use client';

import { createContext, useContext } from 'react';

export interface ShellContextValue {
  /** Opens the navigation sheet on tablet and phone. */
  openNav: () => void;
  /** Opens the command palette, optionally pre-filled. */
  openPalette: (query?: string) => void;
}

export const ShellContext = createContext<ShellContextValue>({
  openNav: () => {},
  openPalette: () => {},
});

export function useShell() {
  return useContext(ShellContext);
}
