import {
  Home, LayoutDashboard, Shield, MessageSquare, Calendar, CalendarDays,
  ClipboardList, Heart, Book, Megaphone,
  UserPlus, Stethoscope, User,
  MapPinned,
  MessageCircleQuestionMark,
} from 'lucide-react';

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
  SUGGESTIONS: '/suggestions',

  DASHBOARD: '/dashboard',
  SESSION_REQUESTS: '/manage/session-requests',
  MANAGE_ANNOUNCEMENT: '/manage/announcement',
  MANAGE_SELF_CARE: '/manage/self-care',
  MANAGE_RESOURCES: '/manage/resources',
  COUNSELOR_SCHEDULE: '/appointments',
  STUDENT_IDENTITY: '/identity/user',
  STUDENT_IDENTITY_DETAIL: '/identity/user/:id',
  PROFILE: '/profile',

  ADMIN: '/admin',
  ADMIN_REGISTER_STUDENT: '/admin/register-student',
  ADMIN_REGISTER_COUNSELOR: '/admin/register-counselor',
};

/**
 * Sidebar navigation — grouped by intent, filtered per role at render time.
 * Every route is reachable from the sidebar; My Account lives in the
 * sidebar footer (secondary action, not primary nav).
 */
export const NAV_SECTIONS = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { label: 'Home', path: PATHS.HOME, icon: Home, roles: ['student'] },
      { label: 'Dashboard', path: PATHS.DASHBOARD, icon: LayoutDashboard, roles: ['counselor'] },
      { label: 'Requests', path: PATHS.SESSION_REQUESTS, icon: ClipboardList, roles: ['counselor'] },
      { label: 'Administration', path: PATHS.ADMIN, icon: Shield, roles: ['administrator'] },
    ],
  },
  {
    id: 'counseling',
    label: 'Counseling',
    items: [
      { label: 'Messages', path: PATHS.MESSAGES, icon: MessageSquare, roles: ['student', 'counselor'] },
      { label: 'Sessions', path: PATHS.SESSIONS, icon: Calendar, roles: ['student'] },
      { label: 'Appointments', path: PATHS.COUNSELOR_SCHEDULE, icon: CalendarDays, roles: ['counselor'] },
    ],
  },
  {
    id: 'wellbeing',
    label: 'Personal',
    items: [
      { label: 'Self-Care', path: PATHS.SELF_CARE, icon: Heart, roles: ['student'] },
      { label: 'My Diary', path: PATHS.DIARY, icon: Book, roles: ['student'] },
    ],
  },
  {
    id: 'explore',
    label: 'Explore',
    items: [
      { label: 'Resources', path: PATHS.RESOURCES, icon: MapPinned, roles: ['student'] },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    items: [
      { label: 'Help Desk', path: PATHS.SUGGESTIONS, icon: MessageCircleQuestionMark, roles: ['student'] },
    ]
  },
  {
    id: 'content',
    label: 'Content Management',
    items: [
      { label: 'Announcements', path: PATHS.MANAGE_ANNOUNCEMENT, icon: Megaphone, roles: ['counselor'] },
      { label: 'Resources', path: PATHS.MANAGE_RESOURCES, icon: MapPinned, roles: ['counselor'] },
      { label: 'Self-Care Library', path: PATHS.MANAGE_SELF_CARE, icon: Heart, roles: ['counselor'] },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    items: [
      { label: 'Register Student', path: PATHS.ADMIN_REGISTER_STUDENT, icon: UserPlus, roles: ['administrator'] },
      { label: 'Register Counselor', path: PATHS.ADMIN_REGISTER_COUNSELOR, icon: Stethoscope, roles: ['administrator'] },
    ],
  },
];

export const ACCOUNT_ITEM = { label: 'My Account', path: PATHS.MY_ACCOUNT, icon: User, roles: ['student', 'counselor', 'administrator'] };
