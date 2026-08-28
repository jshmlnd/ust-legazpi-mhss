import { useState, useCallback } from 'react';

export const DEFAULT_PREFS = {
  sessionReminders: true,
  messageNotifications: true,
  calmMode: false,
  switchmode: false,
};

const keyFor = (userId) => `mhss_prefs_${userId || 'guest'}`;

export const loadPrefs = (userId) => {
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(keyFor(userId)) || '{}') };
  } catch {
    return { ...DEFAULT_PREFS };
  }
};

export const LIGHT_THEME = 'emerald';
export const DARK_THEME = 'emerald-dark';

const applySideEffects = (next) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if ('calmMode' in next) {
    root.classList.toggle('calm-mode', !!next.calmMode);
  }
  if ('switchmode' in next) {
    root.classList.toggle('dark', !!next.switchmode);
    root.setAttribute('data-theme', next.switchmode ? DARK_THEME : LIGHT_THEME);
  }
};

export const usePrefs = (userId) => {
  const [prefs, setPrefs] = useState(() => loadPrefs(userId));

  const update = useCallback((key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(keyFor(userId), JSON.stringify(next));
      applySideEffects(next);
      return next;
    });
  }, [userId]);

  const togglePref = useCallback((key) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(keyFor(userId), JSON.stringify(next));
      applySideEffects(next);
      return next;
    });
  }, [userId]);

  return { prefs, togglePref, setPref: update };
};
