/**
 * Seed script for self-care modules.
 * Run with: node scripts/seed-self-care.mjs
 *
 * Reads MONGODB_URI from backend/.env.
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

const activitySchema = new mongoose.Schema({
  label: { type: String, required: true },
  link: { type: String, default: '' },
  completed: { type: Boolean, default: false },
}, { _id: true });

const selfCareModuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String, default: 'Sparkles' },
  activities: [activitySchema],
  order: { type: Number, default: 0 },
  createdBy: { type: Number },
}, { timestamps: true });

const SelfCareModule = mongoose.model('SelfCareModule', selfCareModuleSchema);

const modules = [
  {
    title: 'Morning Mindfulness',
    icon: 'Sun',
    activities: [
      { label: 'Take 5 slow, deep breaths before getting out of bed', link: '' },
      { label: 'Write down 3 things you are grateful for today', link: '' },
      { label: 'Stretch for 5 minutes — reach for the sky, touch your toes', link: '' },
      { label: 'Watch a guided morning meditation', link: 'https://www.youtube.com/watch?v=U3lTUG3oYDI' },
    ],
  },
  {
    title: 'Breathing Exercises',
    icon: 'Wind',
    activities: [
      { label: 'Box breathing: inhale 4s, hold 4s, exhale 4s, hold 4s — repeat 4 times', link: '' },
      { label: '4-7-8 technique: inhale 4s, hold 7s, exhale 8s — repeat 3 times', link: '' },
      { label: 'Try a 3-minute guided breathing session', link: 'https://www.youtube.com/watch?v=VUjiXcfBnH4' },
    ],
  },
  {
    title: 'Journaling Prompts',
    icon: 'BookOpen',
    activities: [
      { label: 'Write about one challenge you faced this week and how you handled it', link: '' },
      { label: 'Describe your ideal day five years from now', link: '' },
      { label: 'List 5 personal strengths you possess', link: '' },
      { label: 'Write a letter of encouragement to your future self', link: '' },
    ],
  },
  {
    title: 'Physical Wellness',
    icon: 'Dumbbell',
    activities: [
      { label: 'Take a 15-minute walk around campus', link: '' },
      { label: 'Do 10 minutes of stretching or yoga', link: 'https://www.youtube.com/watch?v=v7AYKMP6rOE' },
      { label: 'Drink at least 8 glasses of water today', link: '' },
      { label: 'Replace one unhealthy snack with a fruit or nut', link: '' },
    ],
  },
  {
    title: 'Sleep Hygiene',
    icon: 'Moon',
    activities: [
      { label: 'Set a consistent bedtime and wake-up time this week', link: '' },
      { label: 'Put away screens 30 minutes before sleep', link: '' },
      { label: 'Try a calming bedtime routine — warm drink, reading, or soft music', link: '' },
      { label: 'Listen to a sleep story or ambient sounds', link: 'https://www.youtube.com/watch?v=CZ0N9uMlkSk' },
    ],
  },
  {
    title: 'Social Connection',
    icon: 'HeartHandshake',
    activities: [
      { label: 'Text or call a friend or family member you haven\'t spoken to in a while', link: '' },
      { label: 'Share a meal with someone and put your phone away', link: '' },
      { label: 'Give someone a genuine compliment today', link: '' },
      { label: 'Join a campus club or attend a social event this week', link: '' },
    ],
  },
  {
    title: 'Stress Relief',
    icon: 'Shield',
    activities: [
      { label: 'Identify your top 3 stressors and write one small action for each', link: '' },
      { label: 'Practice progressive muscle relaxation — tense and release each muscle group', link: '' },
      { label: 'Spend 10 minutes in nature or by a window with natural light', link: '' },
      { label: 'Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste', link: '' },
    ],
  },
  {
    title: 'Creative Expression',
    icon: 'Palette',
    activities: [
      { label: 'Draw, sketch, or doodle for 10 minutes — no pressure, just express', link: '' },
      { label: 'Create a playlist of songs that uplift your mood', link: '' },
      { label: 'Write a short poem or story about your day', link: '' },
      { label: 'Try coloring or an adult coloring book for relaxation', link: '' },
    ],
  },
  {
    title: 'Digital Detox',
    icon: 'Timer',
    activities: [
      { label: 'Set a 1-hour phone-free block today', link: '' },
      { label: 'Turn off non-essential notifications for the day', link: '' },
      { label: 'Replace 30 minutes of scrolling with a walk, reading, or hobby', link: '' },
      { label: 'Unfollow or mute accounts that make you feel anxious or inadequate', link: '' },
    ],
  },
  {
    title: 'Positive Affirmations',
    icon: 'Star',
    activities: [
      { label: 'Read these aloud: I am capable. I am enough. I am worthy of good things.', link: '' },
      { label: 'Write 3 affirmations and place them where you will see them daily', link: '' },
      { label: 'Look in the mirror and say one kind thing to yourself', link: '' },
      { label: 'Listen to a guided affirmations session', link: 'https://www.youtube.com/watch?v=5H1kAdUQvQo' },
    ],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingCount = await SelfCareModule.countDocuments();
    if (existingCount > 0) {
      await SelfCareModule.deleteMany({});
      console.log(`Cleared ${existingCount} existing module(s).`);
    }

    const docs = modules.map((m, i) => ({ ...m, order: i }));
    await SelfCareModule.insertMany(docs);
    console.log(`Seeded ${docs.length} self-care modules.`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
