import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_PREFS = {
  sessionReminders: true,
  messageNotifications: true,
  calmMode: false,
  switchmode: false,
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
  if ('switchmode' in next) {
    root.classList.toggle('dark', !!next.switchmode);
    root.setAttribute('data-theme', next.switchmode ? DARK_THEME : LIGHT_THEME);
  }
};

const usePrefsStore = create(persist((set) => ({
  prefsByUser: {},
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

export const usePrefs = (userId) => {
  const key = keyFor(userId);
  const prefs = usePrefsStore((state) => state.prefsByUser[key] || DEFAULT_PREFS);
  const setPref = usePrefsStore((state) => state.setPref);
  const togglePref = usePrefsStore((state) => state.togglePref);

  useEffect(() => applySideEffects(prefs), [prefs]);

  return {
    prefs,
    setPref: (prefKey, value) => setPref(userId, prefKey, value),
    togglePref: (prefKey) => togglePref(userId, prefKey),
  };
};
