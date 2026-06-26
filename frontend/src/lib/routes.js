export const PATHS = {
  HOME: '/',
  SESSIONS: '/sessions',
  LOGIN: '/login',
  MY_ACCOUNT: '/account',
  RESOURCES: '/resources',
  SELF_CARE: '/self-care',
  DIARY: '/user/diary',
  MESSAGES: '/messages',
  UNIVERSITY_UPDATES: '/university-updates',
  DASHBOARD: '/dashboard',
  MANAGE_SESSIONS: '/manage/sessions',

  MANAGE_ANNOUNCEMENT: '/manage/announcement',
  MANAGE_SELF_CARE: '/manage/self-care',
  MANAGE_RESOURCES: '/manage/resources',
  COUNSELOR_SCHEDULE: '/appointments',
  STUDENT_IDENTITY: '/identity/user',
  STUDENT_IDENTITY_DETAIL: '/identity/user/:id',
  SETTINGS: '/settings',
  PROFILE: '/profile',
};

export const NAV_ITEMS = [
  { label: 'Sessions', path: PATHS.SESSIONS, allowedRoles: ['student'] },
  { label: 'Resources', path: PATHS.RESOURCES, allowedRoles: ['student'] },
  { label: 'Self Care', path: PATHS.SELF_CARE, allowedRoles: ['student'] },
  { label: 'Sessions', path: PATHS.MANAGE_SESSIONS, allowedRoles: ['counselor'] },
  { label: 'Appointments', path: PATHS.COUNSELOR_SCHEDULE, allowedRoles: ['counselor'] },
  { label: 'Resources', path: PATHS.MANAGE_RESOURCES, allowedRoles: ['counselor'] },
  { label: 'Self-Care', path: PATHS.MANAGE_SELF_CARE, allowedRoles: ['counselor'] },
  { label: 'Announcements', path: PATHS.MANAGE_ANNOUNCEMENT, allowedRoles: ['counselor'] },
  { label: 'My Account', path: PATHS.MY_ACCOUNT, allowedRoles: ['student', 'counselor'] },
];
