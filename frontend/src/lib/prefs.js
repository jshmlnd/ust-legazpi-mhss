import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_PREFS = {
  sessionReminders: true,
  messageNotifications: true,
  calmMode: false,
  switchmode: false,
  sidebarCollapsed: false,
};

const keyFor = (userId) => String(userId || 'guest');

export const LIGHT_THEME = 'emerald';
export const DARK_THEME = 'emerald-dark';

const applySideEffects = (next) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if ('calmMode' in next) {
    root.classList.toggle('calm-mode', !!next.calmMode);
  }
  if ('switchmode' in next || 'calmMode' in next) {
    // Calm mode implies the dark theme; the standalone dark toggle (switchmode) is additive.
    const dark = !!(next.calmMode || next.switchmode);
    root.classList.toggle('dark', dark);
    root.setAttribute('data-theme', dark ? DARK_THEME : LIGHT_THEME);
  }
};

const usePrefsStore = create(persist((set) => ({
  prefsByUser: {},
  activeKey: 'guest',
  setPref: (userId, key, value) => set(({ prefsByUser }) => ({
    prefsByUser: {
      ...prefsByUser,
      [keyFor(userId)]: { ...DEFAULT_PREFS, ...prefsByUser[keyFor(userId)], [key]: value },
    },
  })),
  togglePref: (userId, key) => set(({ prefsByUser }) => {
    const prefs = { ...DEFAULT_PREFS, ...prefsByUser[keyFor(userId)] };
    return {
      prefsByUser: {
        ...prefsByUser,
        [keyFor(userId)]: { ...prefs, [key]: !prefs[key] },
      },
    };
  }),
}), { name: 'mhss-prefs' }));

export const getPrefs = (userId) => ({
  ...DEFAULT_PREFS,
  ...usePrefsStore.getState().prefsByUser[keyFor(userId)],
});

/**
 * Apply the persisted theme synchronously at startup (before React renders)
 * so a saved dark mode paints immediately instead of flashing light until
 * AppLayout mounts. persist rehydrates synchronously from localStorage.
 */
export const applyStartupTheme = () => {
  if (typeof document === 'undefined') return;
  const { activeKey, prefsByUser } = usePrefsStore.getState();
  applySideEffects({ ...DEFAULT_PREFS, ...prefsByUser[activeKey] });
};

export const usePrefs = (userId) => {
  const key = keyFor(userId);
  const prefs = usePrefsStore((state) => state.prefsByUser[key] || DEFAULT_PREFS);
  const setPref = usePrefsStore((state) => state.setPref);
  const togglePref = usePrefsStore((state) => state.togglePref);

  useEffect(() => {
    // Remember whose prefs are active so the next cold start can restore
    // the theme before first paint (see applyStartupTheme).
    if (usePrefsStore.getState().activeKey !== key) {
      usePrefsStore.setState({ activeKey: key });
    }
    applySideEffects(prefs);
  }, [prefs, key]);

  return {
    prefs,
    setPref: (prefKey, value) => setPref(userId, prefKey, value),
    togglePref: (prefKey) => togglePref(userId, prefKey),
  };
};
