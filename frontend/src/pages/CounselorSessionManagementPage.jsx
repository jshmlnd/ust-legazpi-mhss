import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, User, FileText, ClipboardList, Send, Check, Plus, Clock, MoreHorizontal, Loader, Save } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { PATHS } from '../lib/routes';
import PageShell from '../components/PageShell';
import SectionDivider from '../components/SectionDivider';

const TYPE_ICONS = { Chat: MessageCircle, 'Face-To-Face': User, Review: ClipboardList };
const TYPE_LABELS = { Chat: 'Chat', 'Face-To-Face': 'Face-To-Face', Review: 'Review' };
const STATUS_COLORS = { active: 'text-emerald-600 bg-emerald-50 border-emerald-200', waiting: 'text-amber-600 bg-amber-50 border-amber-200', completed: 'text-neutral-500 bg-neutral-100 border-neutral-200', approved: 'text-emerald-600 bg-emerald-50 border-emerald-200' };

const QueueCard = ({ item, isSelected, onSelect, showIdOnly, disableChatNav }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (item.type === 'Chat' && !disableChatNav) {
      navigate(`/messages?user=${item.studentId}`);
    } else {
      onSelect(item);
    }
  };

  const Icon = TYPE_ICONS[item.type];

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left p-4 rounded-sm border transition-all ${
        isSelected ? 'border-neutral-900 bg-neutral-50' : 'border-neutral-200 bg-white hover:border-neutral-400'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
            item.type === 'chat' ? 'bg-emerald-50 text-emerald-600' : item.type === 'f2f' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
          }`}>
            <Icon size={15} />
          </div>
          <div className="min-w-0">
            {showIdOnly ? (
              <p className="text-sm font-medium text-neutral-900 font-mono tracking-tight">{item.id}</p>
            ) : (
              <p className="text-sm font-medium text-neutral-900 truncate">{"STU-" + item.studentId}</p>
            )}
            <p className="text-[11px] text-neutral-400 truncate mt-0.5">{item.concern}</p>
          </div>
        </div>
        <span className={`shrink-0 text-[9px] font-semibold tracking-[0.1em] uppercase px-2 py-0.5 rounded-sm border ${STATUS_COLORS[item.status] || ''}`}>
          {item.status}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[10px] text-neutral-400">
        <Clock size={10} /> {item.time}
        <span className="text-neutral-200">·</span>
        {TYPE_LABELS[item.type]}
      </div>
    </button>
  );
};

const SessionNotes = ({ session }) => {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session) {
      setNotes(session.notes || '');
    }
  }, [session]);

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await axiosInstance.patch(`/appointments/${session._id}`, { notes });
      toast.success('Session notes saved');
    } catch {
      toast.error('Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-sm">
      <div className="px-5 py-4 border-b border-neutral-100">
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Clinical Session Notes</span>
      </div>
      <div className="p-5">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Type your session notes here..."
          rows={8}
          className={`w-full bg-neutral-50 border text-sm rounded-sm px-4 py-3 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors resize-none ${saving ? 'opacity-50' : ''}`}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px] text-neutral-400">{notes.length} characters</span>
          <button
            onClick={handleSave}
            disabled={saving || !session}
            className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm disabled:opacity-50"
          >
            {saving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />} {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>
    </div>
  );
};

const TaskAssignment = () => {
  return (
    <div className="bg-white border border-neutral-200 rounded-sm">
      <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Self-Care Task Assignment</span>
        <button className="text-[10px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors inline-flex items-center gap-1">
          <Plus size={12} /> Add
        </button>
      </div>
      <div className="p-5 space-y-2">
        <p className="text-xs text-neutral-400">No tasks assigned yet.</p>
      </div>
    </div>
  );
};

const ClientFile = ({ session, studentInfo, loadingInfo }) => {
  const navigate = useNavigate();
  return (
  <div className="bg-white border border-neutral-200 rounded-sm">
    <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
      <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Client File</span>
      <button
        onClick={() => navigate(PATHS.STUDENT_IDENTITY_DETAIL.replace(':id', session?.studentId))}
        className="text-[10px] font-medium text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1"
      >
        <FileText size={12} /> View Full
      </button>
    </div>
    <div className="p-5 space-y-3 text-xs">
      {loadingInfo ? (
        <div className="flex items-center justify-center py-4"><Loader size={16} className="animate-spin text-neutral-400" /></div>
      ) : (
        <>
          <div className="flex justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-400">Student ID</span>
            <span className="text-neutral-900 font-medium">{session?.id || '—'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-400">Year Level</span>
            <span className="text-neutral-900 font-medium">{studentInfo?.yearLevel ? `${studentInfo.yearLevel}${studentInfo.yearLevel === 1 ? 'st' : studentInfo.yearLevel === 2 ? 'nd' : studentInfo.yearLevel === 3 ? 'rd' : 'th'} Year` : '—'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-400">Program</span>
            <span className="text-neutral-900 font-medium">{studentInfo?.program || '—'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-400">Department</span>
            <span className="text-neutral-900 font-medium">{studentInfo?.department || '—'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-400">Sessions</span>
            <span className="text-neutral-900 font-medium">{studentInfo?.sessionCount ?? '—'}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-neutral-400">Last Visit</span>
            <span className="text-neutral-900 font-medium">{studentInfo?.lastVisit || '—'}</span>
          </div>
        </>
      )}
    </div>
  </div>
  );
};

const CounselorSessionManagementPage = () => {
  const [queueItems, setQueueItems] = useState([]);
  const [pastChatItems, setPastChatItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [endingSessionId, setEndingSessionId] = useState(null);

  const handleEndSession = async (appointmentId) => {
    setEndingSessionId(appointmentId);
    try {
      await axiosInstance.patch(`/appointments/${appointmentId}`, { status: 'completed' });
      setQueueItems((prev) => prev.filter((item) => item._id !== appointmentId));
      if (selectedSession?._id === appointmentId) setSelectedSession(null);
      toast.success('Session ended');
    } catch {
      toast.error('Failed to end session');
    } finally {
      setEndingSessionId(null);
    }
  };

  const fetchStudentInfo = async (studentId) => {
    if (!studentId) return;
    setLoadingInfo(true);
    try {
      const res = await axiosInstance.get(`/analytics/student/${studentId}`);
      setStudentInfo(res.data);
    } catch { setStudentInfo(null); }
    finally { setLoadingInfo(false); }
  };

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await axiosInstance.get('/appointments');
        const mapItem = (a) => ({
          _id: a._id,
          id: `STU-${a.studentId}`,
          studentId: a.studentId,
          type: a.type,
          time: a.time,
          date: a.date,
          status: a.type === 'Face-To-Face' && (a.status === 'active' || a.status === 'confirmed') ? 'approved' : a.status === 'active' ? 'active' : a.status === 'pending' ? 'waiting' : 'completed',
          dbStatus: a.status,
          concern: a.concern || 'No concern specified',
          notes: a.notes || '',
        });
        const active = res.data.filter((a) => a.status !== 'completed' && a.status !== 'cancelled' && a.status !== 'declined').map(mapItem);
        const past = res.data.filter((a) => a.status === 'completed' && a.type === 'Chat').map(mapItem);
        setQueueItems(active);
        setPastChatItems(past);
        if (active.length > 0) {
          setSelectedSession(active[0]);
          fetchStudentInfo(active[0].studentId);
        }
      } catch (err) {
        console.error('Failed to fetch queue:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();
  }, []);

  useEffect(() => {
    if (selectedSession) fetchStudentInfo(selectedSession.studentId);
  }, [selectedSession]);

  const queueByType = [
    { type: 'Active Chat', label: 'Active Chat', items: queueItems.filter((q) => q.type === 'Chat' && q.dbStatus === 'active') },
    { type: 'Face-To-Face', label: 'Face-To-Face', items: queueItems.filter((q) => q.type === 'Face-To-Face') },
    { type: 'Review', label: 'Review', items: queueItems.filter((q) => q.type === 'Review') },
  ];

  if (loading) return <PageShell title="Session Manager" subtitle="Monitor active sessions"><p className="text-sm text-neutral-400">Loading...</p></PageShell>;

  return (
    <PageShell title="Session Manager" subtitle="Monitor active sessions, record notes, and assign self-care tasks">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {queueByType.map((group) => (
            <div key={group.type}>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">{group.label}</h3>
                <span className="text-[10px] text-neutral-400">{group.items.length}</span>
              </div>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <QueueCard key={item.id} item={item} isSelected={selectedSession?.id === item.id} onSelect={setSelectedSession} showIdOnly={group.type === 'Active Chat'} />
                ))}
                {group.items.length === 0 && (
                  <p className="text-xs text-neutral-400 py-3 text-center">No {group.type} sessions</p>
                )}
              </div>
            </div>
          ))}

          {pastChatItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-400">Past Chat Sessions</h3>
                <span className="text-[10px] text-neutral-400">{pastChatItems.length}</span>
              </div>
              <div className="space-y-2 opacity-60">
                {pastChatItems.map((item) => (
                  <QueueCard key={item.id} item={item} isSelected={selectedSession?.id === item.id} onSelect={setSelectedSession} showIdOnly disableChatNav />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selectedSession && (selectedSession.dbStatus === 'active' || selectedSession.dbStatus === 'confirmed') && (
            <div className="bg-white border border-neutral-200 rounded-sm px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900">Active Session</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">This session is currently in progress</p>
              </div>
              <button
                onClick={() => handleEndSession(selectedSession._id)}
                disabled={endingSessionId === selectedSession._id}
                className="px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-red-600 hover:bg-red-700 transition-colors rounded-sm disabled:opacity-50 inline-flex items-center gap-2"
              >
                {endingSessionId === selectedSession._id ? <Loader size={12} className="animate-spin" /> : null}
                End Session
              </button>
            </div>
          )}
          <SessionNotes session={selectedSession} />
          <TaskAssignment />
          <ClientFile session={selectedSession} studentInfo={studentInfo} loadingInfo={loadingInfo} />
        </div>
      </div>
    </PageShell>
  );
};


export default CounselorSessionManagementPage;
