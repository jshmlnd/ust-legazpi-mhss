import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useCounselorStore } from "../store/useCounselorStore";
import {
  MessageSquare,
  Users,
  CalendarCheck,
  Bell,
  Clock,
  ArrowRight,
  Search,
  X,
  HatGlasses
} from "lucide-react";

const StatCard = ({ icon: Icon, label, value, onClick }) => (
  <button
    onClick={onClick}
    className="border-[3px] border-black rounded-xl p-5 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] bg-white hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all text-left w-full"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-3xl font-black mt-1">{value}</p>
      </div>
      <div className="p-3 rounded-lg border-[3px] border-black bg-blue-100">
        <Icon size={24} />
      </div>
    </div>
  </button>
);

const RecentItem = ({ studentId, text, createdAt, direction }) => (
  <div className="flex items-center justify-between border-[3px] border-black rounded-xl p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div className="flex-1 min-w-0">
      <p className="font-bold truncate">{studentId || <HatGlasses /> }</p>
      <p className="text-sm text-gray-500 truncate">
        {direction === "sent" ? "You: " : ""}
        {text || "No content"}
      </p>
    </div>
    <div className="flex items-center gap-3 shrink-0 ml-3">
      <p className="text-xs text-gray-400">{createdAt}</p>
      <ArrowRight size={16} className="text-gray-400" />
    </div>
  </div>
);

const StudentRow = ({ student, onMessage, onReveal }) => (
  <div className="flex items-center justify-between border-[2px] border-black rounded-lg p-3 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-full border-[2px] border-black bg-gray-200 shrink-0 flex items-center justify-center font-bold text-sm">
        <HatGlasses />
      </div>
      <div className="min-w-0">
        <p className="font-bold truncate">{ "Session ID #" + student._id.slice(0, 8) }</p>
        <p className="text-xs text-gray-500 font-bold">{ student.studentId } &middot; { student.department }</p>
      </div>
    </div>
    <button
      onClick={() => onReveal && onReveal(student)}
      className="btn btn-ghost btn-sm shrink-0 ml-2"
    >
      Reveal Identity
    </button>
    <button
      onClick={() => onMessage(student)}
      className="btn btn-ghost btn-sm shrink-0 ml-2"
    >
      Message
    </button>
  </div>
);

const CounselorDashboard = () => {
  const { authUser } = useAuthStore();
  const { stats, students, fetchStats, fetchStudents } = useCounselorStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchStudents();
  }, [fetchStats, fetchStudents]);

  const relativeTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Section 1: Greeting */}
      <section className="mb-8">
        <h1 className="text-4xl font-black">
          Welcome back,{" "}
          <span className="bg-yellow-200 px-2 py-1 border-[3px] border-black -rotate-1 inline-block">
            {authUser?.fullName || "Counselor"}
          </span>
        </h1>
        <p className="text-gray-500 font-bold mt-2">Here's your overview for today.</p>
      </section>

      {/* Section 2: Stats */}
      <section className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Students"
            value={stats?.totalStudents ?? "—"}
            onClick={() => document.getElementById("students-modal").showModal()}
          />
          <StatCard
            icon={CalendarCheck}
            label="Appointments Today"
            value={stats?.todayAppointments ?? 0}
          />
          <StatCard
            icon={MessageSquare}
            label="Unread Messages"
            value={stats?.unreadMessages ?? "—"}
            onClick={() => navigate("/messages/unread")}
          />
          <StatCard
            icon={Clock}
            label="Pending Requests"
            value={stats?.pendingRequests ?? 0}
          />
        </div>
      </section>

      {/* Section 3: Quick Actions */}
      <section className="mb-8">
        <h2 className="text-2xl font-black mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => document.getElementById("students-modal").showModal()}
            className="border-[3px] border-black rounded-xl p-5 bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all text-left font-bold"
          >
            <Users size={24} className="mb-2" />
            View Students
          </button>
          <button
            onClick={() => navigate("/messages/unread")}
            className="border-[3px] border-black rounded-xl p-5 bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all text-left font-bold"
          >
            <MessageSquare size={24} className="mb-2" />
            Messages
          </button>
          <button className="border-[3px] border-black rounded-xl p-5 bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all text-left font-bold">
            <Bell size={24} className="mb-2" />
            Create Announcement
          </button>
        </div>
      </section>

      {/* Section 4: Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black">Recent Activity</h2>
          <button
            onClick={() => navigate("/messages")}
            className="text-sm font-bold underline underline-offset-4"
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {stats?.recentActivity?.length > 0 ? (
            stats.recentActivity.map((item) => (
              <RecentItem
                key={item._id}
                studentName={item.otherUser?.fullName}
                text={item.text}
                createdAt={relativeTime(item.createdAt)}
                direction={item.direction}
              />
            ))
          ) : (
            <p className="text-gray-400 font-bold text-center py-8">
              No activity yet. Start a conversation with a student!
            </p>
          )}
        </div>
      </section>

      {/* Students Modal */}
      <dialog id="students-modal" className="modal">
        <div className="modal-box w-11/12 max-w-2xl border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-0">
          <div className="p-6 border-b-[3px] border-black flex items-center justify-between">
            <h3 className="text-2xl font-black">All Students</h3>
            <form method="dialog">
              <button className="btn btn-ghost btn-square">
                <X size={20} />
              </button>
            </form>
          </div>
          <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
            {students.length > 0 ? (
              students.map((student) => (
                <StudentRow
                  key={student._id}
                  student={student}
                  onMessage={(s) => navigate(`/messages?user=${s._id}`)}
                  onReveal={(s) => {
                    const modal = document.getElementById("students-modal");
                    if (modal && typeof modal.close === "function") modal.close();
                    navigate(`/counselor/students/${s._id}`);
                  }}
                />
              ))
            ) : (
              <p className="text-gray-400 font-bold text-center py-8">
                No students registered yet.
              </p>
            )}
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
};

export default CounselorDashboard;
