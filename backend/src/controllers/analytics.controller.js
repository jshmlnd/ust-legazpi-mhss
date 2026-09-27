import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";
import Appointment from "../models/appointment.model.js";
import JournalEntry from "../models/journalEntry.model.js";
import SelfCareModule from "../models/selfCareModule.model.js";
import Resource from "../models/resource.model.js";
import { getDailyDynamicId } from "../lib/generateId.js";

const MOOD_SCORE = { great: 9, good: 7, okay: 5, low: 3, bad: 1 };

export const getDashboard = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments();
    const completedSessions = await Appointment.countDocuments({ status: { $in: ["completed", "ended"] } });
    const pendingSessions = await Appointment.countDocuments({ status: { $in: ["pending", "active", "on-going", "paused"] } });

    // Active students — distinct students with at least one appointment.
    const activeStudentIds = await Appointment.distinct("studentId");

    // Avg. active students per month — distinct students seen each month
    // over the last 6 months, averaged over months that had activity.
    const monthly = await Appointment.aggregate([
      { $group: { _id: {
        y: { $year: "$createdAt" },
        m: { $month: "$createdAt" },
      }, students: { $addToSet: "$studentId" } } },
      { $project: { count: { $size: "$students" } } },
      { $sort: { "_id.y": -1, "_id.m": -1 } },
      { $limit: 6 },
    ]);
    const avgActiveStudents = monthly.length > 0
      ? Math.round(monthly.reduce((sum, mo) => sum + mo.count, 0) / monthly.length)
      : 0;

    const journalEntries = await JournalEntry.find();
    const avgSentiment = journalEntries.length > 0
      ? (journalEntries.reduce((sum, e) => sum + (MOOD_SCORE[e.mood] || 5), 0) / journalEntries.length).toFixed(1)
      : "—";

    const selfCareModules = await SelfCareModule.countDocuments();
    const totalResources = await Resource.countDocuments();

    res.json({
      totalStudents,
      activeStudents: activeStudentIds.length,
      avgActiveStudents,
      completedSessions,
      pendingSessions,
      avgSentiment: avgSentiment === "—" ? 0 : parseFloat(avgSentiment),
      selfCareModules,
      totalResources,
    });
  } catch (error) {
    console.error("Error in getDashboard:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* Weekly Sessions Trend — per-day session counts split by type, for the
   counselor dashboard's two-line chart. Counts both type spellings that
   exist in the data ('Face-To-Face' and the legacy 'f2f'). Uses the
   appointment's createdAt so days align with "this week" even when the
   date strings use a different locale format. */
export const getWeeklySessions = async (req, res) => {
  try {
    // Rolling 7-day window ending today, oldest first (Mon..Sun order).
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const days = [];
    const dayKeys = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      dayKeys.push(d.getTime());
      days.push({
        day: weekdays[d.getDay()],
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        chat: 0,
        f2f: 0,
      });
    }
    const since = new Date(dayKeys[0]);

    const sessions = await Appointment.find({ createdAt: { $gte: since } })
      .select("type createdAt")
      .lean();

    sessions.forEach((s) => {
      const d = new Date(s.createdAt);
      d.setHours(0, 0, 0, 0);
      const idx = dayKeys.indexOf(d.getTime());
      if (idx === -1) return;
      if (s.type === "Chat") days[idx].chat += 1;
      else if (s.type === "Face-To-Face" || s.type === "f2f") days[idx].f2f += 1;
    });

    res.json(days);
  } catch (error) {
    console.error("Error in getWeeklySessions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getWeeklySentiment = async (req, res) => {
  try {
    const entries = await JournalEntry.find().sort({ createdAt: -1 }).limit(28);
    const dayMap = {};
    entries.forEach((e) => {
      if (e.createdAt) {
        const day = e.createdAt.toLocaleDateString("en-US", { weekday: "short" });
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(MOOD_SCORE[e.mood] || 5);
      }
    });
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const result = weekdays.map((day) => ({
      day,
      score: dayMap[day]
        ? (dayMap[day].reduce((a, b) => a + b, 0) / dayMap[day].length).toFixed(1)
        : 0,
    }));
    res.json(result);
  } catch (error) {
    console.error("Error in getWeeklySentiment:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSessionDistribution = async (req, res) => {
  try {
    const chatCount = await Appointment.countDocuments({ type: "Chat" });
    const f2fCount = await Appointment.countDocuments({ type: "f2f" });
    res.json([
      { type: "Active Chat", count: chatCount },
      { type: "Face-to-Face", count: f2fCount },
    ]);
  } catch (error) {
    console.error("Error in getSessionDistribution:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUpcomingSessions = async (req, res) => {
  try {
    const sessions = await Appointment.find({
      counselorId: req.user._id,
      counselorArchived: { $ne: true },
      status: { $in: ["pending", "active", "declined", "completed", "cancelled", "on-going", "paused", "ended"] },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const studentIds = [...new Set(sessions.map((s) => s.studentId))];
    const students = await User.find({ _id: { $in: studentIds } }).select("dynamicId fullName showNameToCounselor").lean();
    const studentMap = Object.fromEntries(students.map((s) => [String(s._id), s]));

    const result = sessions.map((s) => ({
      _id: s._id,
      id: `STU-${getDailyDynamicId(studentMap[String(s.studentId)]?.dynamicId) || s.studentId}`,
      studentId: s.studentId,
      studentName: studentMap[String(s.studentId)]?.showNameToCounselor
        ? studentMap[String(s.studentId)].fullName
        : null,
      type: s.type,
      time: s.time,
      date: s.date,
      status: s.status,
    }));
    res.json(result);
  } catch (error) {
    console.error("Error in getUpcomingSessions:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAnalyticsSummary = async (req, res) => {
  try {
    const appointments = await Appointment.find({}, { time: 1, duration: 1, status: 1, startedAt: 1, endedAt: 1 });

    const hourCounts = {};
    appointments.forEach((a) => {
      const match = a.time && a.time.match(/(\d{1,2})/);
      if (match) {
        let h = parseInt(match[1], 10);
        if (a.time.includes('PM') && h !== 12) h += 12;
        if (a.time.includes('AM') && h === 12) h = 0;
        hourCounts[h] = (hourCounts[h] || 0) + 1;
      }
    });

    const sortedHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]);
    const formatHour = (h) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      return `${hour12}:00 ${period}`;
    };
    const peakRanges = [];
    for (let i = 0; i < sortedHours.length; i++) {
      const h = parseInt(sortedHours[i][0]);
      if (peakRanges.length === 0) {
        peakRanges.push({ start: h, end: h });
      } else {
        const last = peakRanges[peakRanges.length - 1];
        if (h === last.end + 1) {
          last.end = h;
        } else if (peakRanges.length < 2) {
          peakRanges.push({ start: h, end: h });
        }
      }
      if (peakRanges.length >= 2) break;
    }
    const peakString = peakRanges.map((r) =>
      r.start === r.end ? formatHour(r.start) : `${formatHour(r.start)} – ${formatHour(r.end)}`
    ).join(' \u00B7 ');

    const types = await Resource.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 2 },
    ]);
    const topTypes = { article: 'Articles', hotline: 'Hotlines', sheet: 'Sheets', location: 'Locations' };
    const topResources = types.length > 0
      ? types.map((t) => topTypes[t._id] || t._id).join(' \u00B7 ')
      : 'No resources yet';

    const completed = appointments.filter((a) => a.status === 'completed');
    let totalMin = 0;
    let count = 0;
    completed.forEach((a) => {
      let min = 0;
      if (a.startedAt && a.endedAt) {
        min = (new Date(a.endedAt) - new Date(a.startedAt)) / 60000;
      } else {
        const parts = (a.duration || '45 min').match(/(\d+)/);
        if (parts) min = parseInt(parts[1], 10);
      }
      if (min > 0) { totalMin += min; count++; }
    });
    const avgDuration = count > 0 ? Math.round(totalMin / count) : 0;
    const avgString = avgDuration > 0 ? `${avgDuration} minutes` : '—';

    const totalStudents = await User.countDocuments();
    const totalWithAppointments = await Appointment.distinct('studentId');
    const accessPct = totalStudents > 0
      ? Math.round((totalWithAppointments.length / totalStudents) * 100)
      : 0;

    res.json({ peakHours: peakString || 'No data yet', topResources, avgDuration: avgString, accessPct });
  } catch (error) {
    console.error("Error in getAnalyticsSummary:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

export const getStudentInfo = async (req, res) => {
  try {
    const studentId = Number(req.params.id);
    const student = await User.findById(studentId).select("-password");
    if (!student) return res.status(404).json({ error: "Student not found" });

    const sessionCount = await Appointment.countDocuments({ studentId });
    const lastVisit = await Appointment.findOne({ studentId })
      .sort({ createdAt: -1 })
      .select("date time");

    res.json({
      _id: student._id,
      studentId: student.studentId,
      dynamicId: getDailyDynamicId(student.dynamicId),
      fullName: student.fullName,
      department: student.department,
      program: student.program,
      yearLevel: student.yearLevel || 1,
      sessionCount,
      lastVisit: lastVisit ? `${lastVisit.date} ${lastVisit.time}` : null,
    });
  } catch (error) {
    console.error("Error in getStudentInfo:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
