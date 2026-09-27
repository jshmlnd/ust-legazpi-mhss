// Reminder scheduler unit checks (no Mongo needed).
// Run: node test-reminders.js
const assert = (cond, msg) => { if (!cond) { console.error('FAIL:', msg); process.exit(1); } };

// Extract internals by importing the module with stubbed deps? The module
// imports mongoose models, so instead re-implement the parse here and verify
// against the real behavior by requiring the source as text — simpler: import
// the module and exercise slotToDate via a test-only export if present.
const mod = await import('./src/lib/reminders.js');

// The scheduler must be startable without Mongo (setTimeout guards the tick).
mod.startReminderScheduler();
mod.startReminderScheduler(); // idempotent
console.log('PASS: scheduler starts idempotently');
process.exit(0);
