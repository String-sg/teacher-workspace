import { createContext, useContext } from 'react';

export interface SidebarContextValues {
  /**
   * Whether the sidebar is open.
   */
  isOpen: boolean;
  /**
   * Whether the sidebar is open on mobile.
   */
  isMobileOpen: boolean;
  /**
   * Whether the viewport is mobile.
   */
  isMobile: boolean;
  /**
   * Toggle the sidebar open state.
   */
  toggleSidebar: () => void;
}

export const SidebarContext = createContext<SidebarContextValues | undefined>(undefined);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("'useSidebarContext' must be used within a 'Sidebar' component");
  }

  return context;
}
