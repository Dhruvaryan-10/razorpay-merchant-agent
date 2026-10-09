export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_KEY = 'rma.theme';

/**
 * Runs inline in <head> before first paint so the page never flashes the
 * wrong theme. "system" leaves data-theme unset and the CSS media query decides.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export function readThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

export function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  if (preference === 'system') delete root.dataset.theme;
  else root.dataset.theme = preference;
  try {
    if (preference === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, preference);
  } catch {
    // Preference simply won't persist; the current page still switches.
  }
}
