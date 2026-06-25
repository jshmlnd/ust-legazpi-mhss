import User from "../models/user.model.js";
import Counselor from "../models/counselor.model.js";
import Appointment from "../models/appointment.model.js";
import JournalEntry from "../models/journalEntry.model.js";
import SelfCareModule from "../models/selfCareModule.model.js";
import Resource from "../models/resource.model.js";

const MOOD_SCORE = { great: 9, good: 7, okay: 5, low: 3, bad: 1 };

export const getDashboard = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments();
    const completedSessions = await Appointment.countDocuments({ status: "completed" });
    const pendingSessions = await Appointment.countDocuments({ status: { $in: ["pending", "active"] } });

    const journalEntries = await JournalEntry.find();
    const avgSentiment = journalEntries.length > 0
      ? (journalEntries.reduce((sum, e) => sum + (MOOD_SCORE[e.mood] || 5), 0) / journalEntries.length).toFixed(1)
      : "—";

    const selfCareModules = await SelfCareModule.countDocuments();
    const totalResources = await Resource.countDocuments();

    res.json({
      totalStudents,
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
    const chatCount = await Appointment.countDocuments({ type: "chat" });
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
      status: { $in: ["pending", "active", "declined", "completed", "cancelled"] },
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const result = sessions.map((s) => ({
      _id: s._id,
      id: `STU-${s.studentId}`,
      studentId: s.studentId,
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
    const appointments = await Appointment.find({}, { time: 1, duration: 1, status: 1 });

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
      const dur = a.duration || '45 min';
      const parts = dur.match(/(\d+)/);
      if (parts) { totalMin += parseInt(parts[1], 10); count++; }
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
