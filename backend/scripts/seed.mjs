/**
 * Full database seed (dev/demo data).
 * Run with: node scripts/seed.mjs
 *
 * Reads MONGODB_URI from backend/.env. Wipes User, Counselor, Appointment,
 * Message, AvailabilitySlot, Resource, JournalEntry, Notice, Announcement,
 * Suggestion collections, then inserts:
 *   - 2 counselors
 *   - 6 students using the accounts from README.md
 *     (password = student number with a leading '0', e.g. 4210043 / 04210043)
 *   - availability slots, appointments in every status, a chat thread,
 *     resources, journal entries, notices, an announcement, a suggestion.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/user.model.js';
import Counselor from '../src/models/counselor.model.js';
import Appointment from '../src/models/appointment.model.js';
import Message from '../src/models/message.model.js';
import AvailabilitySlot from '../src/models/availabilitySlot.model.js';
import Resource from '../src/models/resource.model.js';
import JournalEntry from '../src/models/journalEntry.model.js';
import Notice from '../src/models/notice.model.js';
import Announcement from '../src/models/announcement.model.js';
import Suggestion from '../src/models/suggestion.model.js';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in backend/.env');
  process.exit(1);
}

const dayOffset = (n, hh = 10, mm = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hh, mm, 0, 0);
  return d;
};
const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const time12h = (d) => {
  let h = d.getHours();
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${suffix}`;
};

const hash = (pw) => bcrypt.hashSync(pw, 10);

// Accounts from README.md: password = student number with leading '0'.
const students = [
  { studentId: '4210043', password: hash('04210043'), fullName: 'Joshua M. Santos', email: 'joshua.santos@ust-legazpi.edu.ph', phone: '09171000001', department: 'CEAFA', program: 'BS Civil Engineering', yearLevel: 3 },
  { studentId: '4230306', password: hash('04230306'), fullName: 'Alina R. Reyes', email: 'alina.reyes@ust-legazpi.edu.ph', phone: '09171000002', department: 'CHS', program: 'BS Nursing', yearLevel: 2 },
  { studentId: '4230023', password: hash('04230023'), fullName: 'Miguel P. Torres', email: 'miguel.torres@ust-legazpi.edu.ph', phone: '09171000003', department: 'CASE', program: 'BS Psychology', yearLevel: 1 },
  { studentId: '4210021', password: hash('04210021'), fullName: 'Bea C. Dela Cruz', email: 'bea.delacruz@ust-legazpi.edu.ph', phone: '09171000004', department: 'CBMA', program: 'BS Accountancy', yearLevel: 4 },
  { studentId: '4200420', password: hash('04200420'), fullName: 'Karla J. Fuentes', email: 'karla.fuentes@ust-legazpi.edu.ph', phone: '09171000005', department: 'LAW', program: 'Juris Doctor', yearLevel: 1 },
  { studentId: '4220051', password: hash('04220051'), fullName: 'Nico D. Estrella', email: 'nico.estrella@ust-legazpi.edu.ph', phone: '09171000006', department: 'CEAFA', program: 'BS Computer Engineering', yearLevel: 2 },
].map((s) => ({ ...s, userType: 'Student' }));

const counselors = [
  { counselorId: 'sonnysallena', fullName: 'Sonny T. Sallena', email: 'sonny.sallena@ust-legazpi.edu.ph', password: hash('sonnysallena') },
  { counselorId: 'mariacruz', fullName: 'Maria L. Cruz', email: 'maria.cruz@ust-legazpi.edu.ph', password: hash('mariacruz') },
].map((c) => ({ ...c, userType: 'Counselor', pin: '' }));

console.log(`Connecting to ${MONGODB_URI.replace(/\/\/[^@]+@/, '//<credentials>@')} ...`);
await mongoose.connect(MONGODB_URI);

console.log('Wiping collections...');
await Promise.all([
  User.deleteMany({}),
  Counselor.deleteMany({}),
  Appointment.deleteMany({}),
  Message.deleteMany({}),
  AvailabilitySlot.deleteMany({}),
  Resource.deleteMany({}),
  JournalEntry.deleteMany({}),
  Notice.deleteMany({}),
  Announcement.deleteMany({}),
  Suggestion.deleteMany({}),
]);

// Use .create() (not insertMany) so pre('save') hooks run: User/Counselor
// schemas define `_id: false` and assign their numeric _id in the hook.
console.log('Creating counselors & students...');
const insertedCounselors = await Counselor.create(counselors);
const insertedStudents = await User.create(students);
const [c1, c2] = insertedCounselors;
const [s1, s2, s3, s4, s5, s6] = insertedStudents;

console.log('Inserting availability slots...');
const slots = [];
for (let n = 1; n <= 7; n++) {
  const d = dayOffset(n);
  slots.push({ counselorId: c1._id, date: isoDate(d), time: '09:00 AM' });
  slots.push({ counselorId: c1._id, date: isoDate(d), time: '01:30 PM' });
  slots.push({ counselorId: c2._id, date: isoDate(d), time: '10:00 AM' });
}
await AvailabilitySlot.insertMany(slots);

console.log('Inserting appointments...');
const in7d = dayOffset(7);
const yesterday = dayOffset(-1);
const appointments = await Appointment.insertMany([
  // Student 1: upcoming confirmed session with Sonny T. Sallena in 7 days
  { studentId: s1._id, counselorId: c1._id, type: 'Face-To-Face', status: 'confirmed', date: isoDate(in7d), time: '10:00 AM', concern: 'Academic stress — thesis workload', notes: '' },
  // Student 2: pending request
  { studentId: s2._id, counselorId: c1._id, type: 'Chat', status: 'pending', date: isoDate(dayOffset(3)), time: '09:00 AM', concern: 'Adjustment to dorm life' },
  // Student 3: active chat with counselor 2
  { studentId: s3._id, counselorId: c2._id, type: 'Chat', status: 'active', date: isoDate(dayOffset(0)), time: time12h(new Date()), concern: 'Homesickness' },
  // Student 4: declined request
  { studentId: s4._id, counselorId: c2._id, type: 'Face-To-Face', status: 'declined', date: isoDate(dayOffset(2)), time: '10:00 AM', concern: 'Time management' },
  // Student 5: completed session a week ago
  { studentId: s5._id, counselorId: c1._id, type: 'Face-To-Face', status: 'completed', date: isoDate(dayOffset(-7)), time: '01:30 PM', concern: 'Board exam anxiety', startedAt: dayOffset(-7, 13, 30), endedAt: dayOffset(-7, 14, 15) },
  // Student 6: chat that ended yesterday
  { studentId: s6._id, counselorId: c2._id, type: 'Chat', status: 'ended', date: isoDate(yesterday), time: '10:00 AM', concern: 'Anxiety about group grades', startedAt: yesterday, endedAt: yesterday },
]);

console.log('Inserting chat thread (student 3 <-> counselor 2)...');
const chat = appointments.find((a) => a.status === 'active' && a.type === 'Chat');
await Message.insertMany([
  { senderId: c2._id, senderModel: 'Counselor', receiverId: s3._id, receiverModel: 'User', appointmentId: chat._id, text: 'Hi Miguel! Thanks for reaching out today — what’s on your mind?' },
  { senderId: s3._id, senderModel: 'User', receiverId: c2._id, receiverModel: 'Counselor', appointmentId: chat._id, text: 'Hello po. Just missing home a lot this semester.' },
  { senderId: c2._id, senderModel: 'Counselor', receiverId: s3._id, receiverModel: 'User', appointmentId: chat._id, text: 'That’s completely normal. We can talk about it and set up a visit schedule that helps.' },
]);

console.log('Inserting resources...');
await Resource.insertMany([
  { title: 'UST-Legazpi Guidance Office', type: 'location', address: 'Sta. Rita St., Legazpi City', hours: 'Mon–Fri 8AM–5PM', contact: '(052) 742-0000', lat: 13.1391, lng: 123.7367 },
  { title: 'National Center for Mental Health Hotline', type: 'hotline', contact: '1553 (landline) / 0917-899-8727', hours: '24/7' },
  { title: 'Dr. Elena Ramos, Psychiatrist', type: 'psychiatrist', contact: '(052) 480-1111', address: 'Legazpi City, Albay' },
  { title: 'Dr. Paolo Mendoza, Psychologist', type: 'psychologist', contact: '(052) 480-2222', address: 'Legazpi City, Albay' },
]);

console.log('Inserting journal entries...');
await JournalEntry.insertMany([
  { studentId: s1._id, title: 'First week back', content: 'Classes are getting heavier but I feel okay about the pace.', mood: 'good' },
  { studentId: s1._id, title: 'Long day', content: 'Thesis defense practice drained me. Sleep early tonight.', mood: 'low' },
  { studentId: s2._id, title: 'Dorm routine', content: 'Made friends with my floor-mates. Weeks are better now.', mood: 'great' },
]);

console.log('Inserting notices & announcement...');
await Notice.insertMany([
  { tag: 'NOTICE', text: 'Counseling walk-in hours resume 8AM Monday.', linkHref: '/university-updates', linkLabel: 'Read latest updates' },
  { tag: 'OGT', text: 'Mental Health Awareness Week: Oct 20–24. See schedules.', linkHref: '/university-updates', linkLabel: 'See schedules' },
]);
await Announcement.insertMany([
  { title: 'Mental Health Awareness Week', body: 'Join us Oct 20–24 for free workshops, peer support sessions, and stress-relief activities at the Student Bar. Open to all departments.', author: 'Counseling Office' },
]);

console.log('Inserting suggestion...');
await Suggestion.insertMany([
  { studentId: s2._id, message: 'Could we have evening chat slots for working students?' },
]);

const counts = {
  Counselors: insertedCounselors.length,
  Students: insertedStudents.length,
  'Availability slots': slots.length,
  Appointments: appointments.length,
  Messages: 3,
  Resources: 4,
  'Journal entries': 3,
  Notices: 2,
  Announcements: 1,
  Suggestions: 1,
};
console.log('\nSeed complete:');
for (const [k, v] of Object.entries(counts)) console.log(`  ${k}: ${v}`);
console.log('\nTest logins (from README.md — password = student number with leading 0):');
console.log('  Students:   4210043, 4230306, 4230023, 4210021, 4200420, 4220051');
console.log("  Counselors: C-0001 (Sonny T. Sallena), C-0002 (Maria L. Cruz) — reuse the first two student passwords");

await mongoose.disconnect();
