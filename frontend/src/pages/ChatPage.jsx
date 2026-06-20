import React, { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import {
  initializeSocket,
  onReceiveMessage,
  sendMessageViaSocket,
} from "../lib/socket";
import { Loader, Paperclip, Send, HatGlasses } from "lucide-react";


const ChatBubble = ({ message, isOwn }) => (
  <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}> 
    <div className={`${isOwn ? "bg-blue-50 border-blue-500" : "bg-white border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"} border-[2px] rounded-xl p-3 max-w-[80%]`}>
      <div className="text-sm break-words">{message.text}</div>
      <div className="text-xs text-gray-400 mt-2">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  </div>
);

const ChatPage = ({ initialUser = null }) => {
  const { authUser } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const msgEndRef = useRef(null);

  // no users list fetch — conversation selection comes from `initialUser` or routing

  // socket init
  useEffect(() => {
    if (!authUser?._id) return;
    initializeSocket(authUser._id);
    onReceiveMessage((msg) => {
      setMessages((p) => [...p, msg]);
    });
  }, [authUser]);

  // Accept an initial user object (when navigated via ?user=)
  useEffect(() => {
    if (initialUser) {
      setSelectedUser(initialUser);
    }
  }, [initialUser]);

  useEffect(() => {
    if (!selectedUser) return;
    const fetchMessages = async () => {
      try {
        const res = await axiosInstance.get(`/message/${selectedUser._id}`);
        setMessages(res.data || []);
      } catch (err) {
        console.error(err);
        setMessages([]);
      }
    };
    fetchMessages();
  }, [selectedUser]);

  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || !selectedUser) return;
    try {
      setSending(true);
      const body = { text };
      await axiosInstance.post(`/message/send/${selectedUser._id}`, body);
      sendMessageViaSocket(selectedUser._id, text, null, authUser._id, authUser.userType === 'student' ? 'User' : 'Counselor', selectedUser.userType === 'student' ? 'User' : 'Counselor');
      setMessages((p) => [...p, { senderId: authUser._id, text, createdAt: new Date() }]);
      setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-fit flex items-center justify-center"><Loader className="animate-spin" /></div>;

  return (
    <div className="min-h-fit bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto bg-white border-[3px] border-black rounded-xl overflow-hidden grid grid-cols-1 gap-0" style={{ height: '72vh' }}>

        {/* Center: Chat (full width) */}
        <div className="p-4 flex flex-col min-h-0">
          <div className="border-b-[3px] border-black p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-[2px] border-black"><HatGlasses /></div>
              <div>
                <div className="font-black">{selectedUser ? selectedUser.studentId : 'Select a conversation'}</div>
                <div className="text-xs text-gray-500">{selectedUser ? (selectedUser.studentId || 'Student') : ''}</div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 min-h-0 max-h-full">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 font-bold">No messages yet.</div>
            ) : (
              messages.map((m, i) => (
                <ChatBubble key={i} message={m} isOwn={String(m.senderId) === String(authUser?._id)} />
              ))
            )}
            <div ref={msgEndRef} />
          </div>

          <div className="border-t-[3px] border-black p-4 bg-white">
            <div className="flex items-center gap-2">
              <button className="p-3 border-[2px] border-black rounded-lg"><Paperclip /></button>
              <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={selectedUser ? 'Type a message...' : 'Select a conversation'} className="flex-1 px-4 py-3 border-[2px] border-black rounded-lg font-bold" disabled={!selectedUser} />
              <button onClick={handleSend} disabled={!text.trim() || !selectedUser || sending} className="p-3 border-[3px] border-black bg-blue-100 rounded-lg disabled:opacity-50">
                <Send />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatPage;