import { useMemo } from 'react';

/* Recharts needs concrete color strings, so read the shared Evergreen tokens. */

const cssRgb = (name, fallback) => {
  if (typeof document === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

export const useChartTheme = () => {
  return useMemo(() => {
    const ink = cssRgb('--c-ink-muted', '119 130 125');
    const brand = cssRgb('--c-brand-600', '5 150 105');
    const line = cssRgb('--c-line-strong', '198 207 203');
    const surface = cssRgb('--c-surface', '255 255 255');
    const warning = cssRgb('--c-warning', '180 83 9');
    return {
      tick: { fontSize: 11, fill: `rgb(${ink})`, fontWeight: 500 },
      brand: `rgb(${brand})`,
      brandFill: `rgb(${brand} / 0.12)`,
      muted: `rgb(${line})`,
      dotStroke: `rgb(${surface})`,
      /* Secondary series color — matches the warning-tone badges used for
         Face-to-Face across the app. */
      warning: `rgb(${warning})`,
      warningFill: `rgb(${warning} / 0.12)`,
    };
  }, []);
};
