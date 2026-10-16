import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosInstance } from './axios';
import { useAuthStore } from '../store/useAuthStore';

export const DEFAULT_PREFS = {
  sessionReminders: true,
  messageNotifications: true,
  calmMode: false,
  switchmode: false,
  sidebarCollapsed: false,
};

// Keys that follow the account (User/Counselor.preferences, synced through
// /auth/profile-details). calmMode and sidebarCollapsed stay device-local —
// they are per-screen UI state.
const SYNCED_PREFS = ['sessionReminders', 'messageNotifications', 'switchmode'];

const keyFor = (userId) => String(userId || 'guest');

// Mirror the change onto authUser so a later merge can never overwrite the
// fresh local value with the stale copy the login response carried.
const mirrorToAuthUser = (key, value) => {
  useAuthStore.setState((s) => s.authUser
    ? { authUser: { ...s.authUser, preferences: { ...s.authUser.preferences, [key]: value } } }
    : s);
};

// Fire-and-forget server write. localStorage stays the instant source of
// truth; a failed write is corrected on the next sign-in merge.
const pushPref = (key, value) => {
  if (!SYNCED_PREFS.includes(key) || !useAuthStore.getState().authUser) return;
  mirrorToAuthUser(key, value);
  axiosInstance.put('/auth/profile-details', { preferences: { [key]: value } })
    .catch((err) => console.warn('Failed to sync preference to account:', err.message));
};

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
  setPref: (userId, key, value) => {
    set(({ prefsByUser }) => ({
      prefsByUser: {
        ...prefsByUser,
        [keyFor(userId)]: { ...DEFAULT_PREFS, ...prefsByUser[keyFor(userId)], [key]: value },
      },
    }));
    pushPref(key, value);
  },
  togglePref: (userId, key) => {
    const prefs = { ...DEFAULT_PREFS, ...usePrefsStore.getState().prefsByUser[keyFor(userId)] };
    const value = !prefs[key];
    set(({ prefsByUser }) => ({
      prefsByUser: {
        ...prefsByUser,
        [keyFor(userId)]: { ...prefs, [key]: value },
      },
    }));
    pushPref(key, value);
  },
}), { name: 'mhss-prefs' }));

/** Merge account-saved prefs into the local store; server wins for synced keys. */
export const mergeServerPrefs = (userId, serverPrefs) => {
  if (!userId || !serverPrefs) return;
  const synced = {};
  for (const key of SYNCED_PREFS) {
    if (typeof serverPrefs[key] === 'boolean') synced[key] = serverPrefs[key];
  }
  if (Object.keys(synced).length === 0) return;
  usePrefsStore.setState(({ prefsByUser }) => ({
    prefsByUser: {
      ...prefsByUser,
      [keyFor(userId)]: { ...DEFAULT_PREFS, ...prefsByUser[keyFor(userId)], ...synced },
    },
  }));
};

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

  // Pull account-saved prefs when the signed-in user changes (e.g. after
  // login/checkAuth on a new device). Guests keep device-local prefs only.
  useEffect(() => {
    mergeServerPrefs(userId, useAuthStore.getState().authUser?.preferences);
  }, [userId]);

  return {
    prefs,
    setPref: (prefKey, value) => setPref(userId, prefKey, value),
    togglePref: (prefKey) => togglePref(userId, prefKey),
  };
};
