import { useEffect, useMemo, useState } from 'react';

/* Theme-aware chart palette. Recharts needs concrete color strings, so read
   the Evergreen CSS variables and re-derive the palette whenever the dark
   class flips (theme toggle / calm mode). Shared by every recharts surface. */

const cssRgb = (name, fallback) => {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

export const useChartTheme = () => {
  const isDark = useDarkMode();
  return useMemo(() => {
    const ink = cssRgb('--c-ink-muted', '119 130 125');
    const brand = cssRgb('--c-brand-600', '5 150 105');
    const line = cssRgb('--c-line-strong', '198 207 203');
    const surface = cssRgb('--c-surface', '255 255 255');
    const warning = cssRgb('--c-warning', '180 83 9');
    return {
      isDark,
      tick: { fontSize: 11, fill: `rgb(${ink})`, fontWeight: 500 },
      brand: `rgb(${brand})`,
      brandFill: `rgb(${brand} / ${isDark ? 0.2 : 0.12})`,
      muted: `rgb(${line})`,
      dotStroke: `rgb(${surface})`,
      /* Secondary series color — matches the warning-tone badges used for
         Face-to-Face across the app. */
      warning: `rgb(${warning})`,
      warningFill: `rgb(${warning} / ${isDark ? 0.2 : 0.12})`,
    };
  }, [isDark]);
};;
