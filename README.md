# University Mental Health Support: Semi-Anonymous Student Counseling and Resource Mapping Web Application

I, [`Joshua Klein A. Malonda`](https://github.com/jshmlnd), along with my research partner [`Hanz Gregor P. Loria`](https://github.com/grxg0r), a 3rd year BS Computer Science student at the University of Santo Tomas - Legazpi. We are currently working on our undergraduate thesis entitled `"University Mental Health Support: Semi-Anonymous Student Counseling and Resource Mapping Web Application"`. 

---

## Tech Stack:

###### Frontend:

|  Category  | Technology |
| ---------- | :--------: |
| Framework  | React |
| Build Tool | Vite 8 |
| UI/Styling | TailwindCSS + DaisyUI |
| Animation | Framer Motion |
| Maps | Leaflet |
| Charts | Recharts 3 |
| HTTP Client | Axios |
| State Management | Zustand |
| Real-time | Socket.IO |

###### Backend:

| Category | Technology |
| -------- | :--------: |
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB |
| Real-time | Socket.IO |
| Dev Tool | Nodemon |
| File Upload | Cloudinary |

###### Accounts:

| Student No. | Password |
| ----------- | :------: |
| 4210043 | 04210043 |
| 4230306 | 04230306 |
| 4230023 | 04230023 |
| 4210021 | 04210021 |
| 4200420 | 04200420 |
| 4220051 | 04220051 |

## Changelog

docs:

- Added changelog to README.md
- Removed GITHUB.md

refactor!:

- Overhaul page design and drop legacy pages (2026-09-27)
- navbar → sidebar + role-based home routing (student/counselor/administrator)
- Separated CallLog model from messages
- Connected weekly mood chart + mood overview to shared entries data

chore:

- Removed seed.js
- connectDB ordering fix; RoleRoute for role verification/routing
- Installed commitizen (cz-conventional-changelog); ponytail audits

fix:

- Crisis detector: missing suicide keywords + threshold to 10; proximity negation check + Filipino negations; robust student session exit; skip counselor messages
- Voice calls (Agora SDK): token gen (RtcRole), async cleanup/UID safety, join-before-mic-track, buffer ICE + remote audio playback, call drops from callState deps, global listeners in App.jsx, ring sound, duplicate call-log removal, delete messages on session end
- Chat: responsive bubble max-width/wrapping, redesign
- Announcements: single-image cap (max-h/max-w), adaptive grid, left-align in updates
- Profile pictures: Cloudinary 'Profile Pictures' folder, fix removal 400
- Face-to-face booking: conflict detection, remove manual date selection, allow clearing all slots
- Resources: psychiatrist enum validation, resource type fixes
- Active Conversations: exclude non-chat appointments
- HomePage background blur 8px → 15px

feat:

- Email notifications via Mailtrap + nodemailer (2026-09-28): forgot-password OTP emailed to students and counselors, "Did you change your password?" alert on every password change (reset + settings), and announcement newsletters bulk-sent to all student emails (with "Receive OGT Updates" opt-out preference). OTP verify-before-reset (new-password form gated behind code verification, 5-attempt guard), resend-code cooldown, live sending from verified domain jshmlnd.space
- Design overhaul: sidebar integration (2026-09-27)
- JEV AI integration (chatbot + crisis NLP pipeline, severity-aware UI, message translation before detection)
- Two-factor auth: Google Authenticator TOTP integration; PIN 2FA with login enforcement + preferences toggle
- Crisis lexicon: Filipino terms incl. "bigti"/hang myself + expanded Tagalog markers
- Safety: audit trails for crisis detection + identity reveal; reveal-identity banner w/ auto-connect
- Counselor editable dashboard NOTICE + dynamic notice
- Announcements: image/GIF upload (Cloudinary), clickable URLs, permanent delete (deleted view), view counts/reactions
- Loading: reusable skeleton system across pages
- Journal: weekly mood graph + calendar activity heatmap
- Self-care: 10-module seed script, collapsible activities, card-grid redesign, icon picker, enter-to-submit forms
- Admin: Administrator landing page w/ navigation cards, register-student/counselor pages
- Sessions: type badges on counselor dashboard, F2F available dates, call logs per session (+ on cancel), file sharing, read receipts, dashboard suggestions
- Background reminders (node-cron + Web Push) backend/src/lib/reminders.js + PushSubscription model + /api/push routes. Cron runs every 5 minutes: T-24h, T-1h before confirmed sessions, and a missed-chat nudge (30–120 min past a never-started confirmed chat). Delivery is Web Push (VAPID keys generated into .env), so reminders fire even with no tab open; expired subscriptions are auto-pruned on 404/410. Your existing sw.js notificationclick routes taps to /messages or /sessions. Reminders dedupe in-memory per appointment+kind (bounded Map, restart-safe since rules re-evaluate).
- Close the session loop: SessionFeedbackModal fires when a session completes — from either direction (counselor ends → both sides see it via socket + local action). "How are you feeling?" 1-tap saves a diary entry (feeds F3's streak). Students get 1-tap "Book a follow-up": same counselor, concern pre-filled, straight to Sessions. "Check in again?" banner on HomePage when the last completed session was 3–7 days ago with no open appointment to that counselor (dismissable 3 days).
- Daily mood streak HomePage card (students): "How are you today?" → 1-tap mood creates a JournalEntry titled "Daily mood check-in" — no schema change. Streak = consecutive days with entries ending today (or yesterday, so it breaks only after a full skipped day), computed frontend-only. Card shows 🔥 N-day streak; buttons disable once today is logged.
- Real sessionReminders On login/app-open: the student's next confirmed/active appointment inside 24h fires showNotification() through the service worker; a 5-min re-poll catches sessions crossing the window while open. On notification permission granted, the browser also subscribes to background push.

#### Upcoming

- Point System: adds a feature where Counselor can evaluate how much point a student gains per session from `1-10`.
- Points Shop: adds a feature where Students can buy University Merchandise using their accumulated points. (e.g., ID Lace = 100/200 Points, 100 Pesos Coupon = 100 Points)

[The reason for these point system is to gain recurring users, and increase Office of Guidance and Testing engagement.]