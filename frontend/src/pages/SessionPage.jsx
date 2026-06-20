import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import ChatPage from "./ChatPage";

const CounselorCard = ({ counselor, onStart }) => {
  return (
    <div className="bg-white text-black rounded-xl p-6 shadow-md border border-slate-700">
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center text-2xl font-bold">AV</div>
        <div className="flex-1">
          <h3 className="text-xl font-black">{counselor.fullName}</h3>
          <p className="text-sm text-slate-600 mt-1">{counselor.specialties}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-emerald-400 font-semibold">Online Now</div>
        </div>
      </div>

      <hr className="my-4 border-slate-700" />

      <div className="grid grid-cols-2 gap-4 text-center text-sm text-slate-800 mb-4 center">
        <div>
          <div className="text-xs uppercase text-slate-800">Department</div>
          <div className="font-black">CEAFA</div>
        </div>
      </div>

      <button
        onClick={() => onStart(counselor)}
        className="w-full py-3 bg-black hover:bg-slate-200 hover:text-black text-white rounded font-semibold"
      >
        Start Chat
      </button>
    </div>
  );
};

const SessionPage = () => {
  const navigate = useNavigate();
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [initialUser, setInitialUser] = useState(null);
  const [loadingInitialUser, setLoadingInitialUser] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get('/counselor/list');
        const data = Array.isArray(res?.data) ? res.data : [];
        // map server fields to display fields if needed
        const mapped = data.map((c) => ({
          _id: c._id,
          fullName: c.fullName,
          specialties: c.specialties || `${c.department || "General"}`,
          experienceYears: c.experienceYears || c.years || "—",
          rating: c.rating || "—",
        }));
        setCounselors(mapped);
      } catch (err) {
        console.error('Failed to fetch counselors, falling back to placeholders', err);
        setCounselors([
          { _id: "1", fullName: "Counselor Loria", specialties: "Anxiety · Academic Stress · Relationships", experienceYears: 8, rating: "4.9 (42)" },
          { _id: "2", fullName: "Counselor Estocado", specialties: "Depression · Relationships · Trauma Support", experienceYears: 6, rating: "4.8 (38)" },
          { _id: "3", fullName: "Counselor Molaer", specialties: "Grief · Loss · Crisis Support", experienceYears: 10, rating: "5.0 (51)" },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const startChat = (counselor) => {
    navigate(`/messages?user=${counselor._id}`);
  };

  // If URL contains ?user=, fetch that user's profile and render chat instead
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get("user");
    if (!userId) {
      setInitialUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        setLoadingInitialUser(true);
        const res = await axiosInstance.get(`/message/user/${userId}`);
        setInitialUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user by id:", err);
        setInitialUser(null);
      } finally {
        setLoadingInitialUser(false);
      }
    };

    fetchUser();
  }, [location.search]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;

  // If a user id was provided in the query params, and we've loaded it, render ChatPage
  const params = new URLSearchParams(location.search);
  const userId = params.get("user");
  if (userId) {
    if (loadingInitialUser) return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin" /></div>;
    return <ChatPage initialUser={initialUser} />;
  }

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black mb-6">Available Counselors</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {counselors.map((c) => (
          <CounselorCard key={c._id} counselor={c} onStart={startChat} />
        ))}
      </div>
    </div>
  );
};

export default SessionPage;