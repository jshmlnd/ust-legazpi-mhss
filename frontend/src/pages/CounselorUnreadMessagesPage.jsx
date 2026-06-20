import React, { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { HatGlasses } from "lucide-react";

const UnreadRow = ({ user, lastMessage, unread, onStart, displayName }) => (
  <div className="flex items-center justify-between border-[2px] border-black rounded-lg p-4 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-12 h-12 rounded-full border-[2px] border-black bg-gray-200 flex items-center justify-center font-bold"><HatGlasses /></div>
      <div className="min-w-0">
        <p className="font-black truncate">{displayName}</p>
        <p className="text-sm text-gray-500 truncate">{lastMessage?.text ? lastMessage.text.slice(0, 80) : "[No message]"}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="text-xs text-gray-400">{lastMessage ? new Date(lastMessage.createdAt).toLocaleString() : ""}</div>
      {unread && <div className="w-3 h-3 rounded-full bg-red-500" title="Unread" />}
      <button onClick={() => onStart(user)} className="px-3 py-2 border-[2px] border-black rounded bg-blue-100 font-bold">Start Chat</button>
    </div>
  </div>
);

const CounselorUnreadMessagesPage = () => {
  const { authUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadPairs, setUnreadPairs] = useState([]); // {user, lastMessage, unread}
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/message/unread');
        const data = res.data || [];

        // Server returns [{ user, lastMessage, unread }]
        // Do not filter — show results and mark unread visually so we can see what's returned
        setUnreadPairs(data);
      } catch (err) {
        console.error('Failed to load unread messages', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const startChat = (user) => {
    navigate(`/messages?user=${user._id}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;

  return (
    <div className="min-h-screen p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black mb-4">Unread Conversations</h1>
      {unreadPairs.length === 0 ? (
        <div className="border-[3px] border-black rounded-xl p-8 bg-white text-center font-bold">No unread conversations.</div>
      ) : (
        <div className="space-y-3">
          {unreadPairs.map((p) => {
            const u = p.user || { _id: 'unknown' };
            const viewerIsCounselor = authUser?.userType?.toLowerCase() === 'counselor';
            const displayName = viewerIsCounselor ? u._id : (u.fullName || u._id);
            return (
              <UnreadRow key={u._id || Math.random()} user={u} lastMessage={p.lastMessage} unread={p.unread} onStart={startChat} displayName={displayName} />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CounselorUnreadMessagesPage;