import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      {/* ========== SECTION 1: Hero / Welcome ========== */}
      <section className="hero bg-base-200 py-12 h-svh">
        <div className="hero-content text-center max-w-2xl mx-auto">
          <div className="max-w-md">
            <h1 className="text-4xl font-bold">Welcome to the Mental Health Support System</h1>
            <p className="py-4 text-base-content/70">
              Your well-being matters. Explore resources, connect with counselors, and manage your mental health journey.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => navigate("/sessions")} className="border-[3px] border-black rounded-xl p-6 bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all text-left font-bold">
            <h3 className="text-lg mb-2">Connect with a Counselor</h3>
            <p className="text-gray-600 font-normal">Start your private chat session with a counselor.</p>
          </button>

          <button onClick={() => navigate("/resource")} className="border-[3px] border-black rounded-xl p-6 bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all text-left font-bold">
            <h3 className="text-lg mb-2">Resources</h3>
            <p className="text-gray-600 font-normal">Find Mental Health Professionals around Albay.</p>
          </button>

          <button onClick={() => navigate("/selfcare")} className="border-[3px] border-black rounded-xl p-6 bg-white shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all text-left font-bold">
            <h3 className="text-lg mb-2">Self Care Activities</h3>
            <p className="text-gray-600 font-normal">Breathing, grounding & more.</p>
          </button>
        </div>
      </section>

      {/* ========== SECTION 3: Info / Resources ========== */}
      <section className="bg-base-200 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Today's Wellness Check</h2>
          <div className="space-y-4">
            <div className="bg-base-100 border border-base-300 rounded-box p-4">
              <h3 className="font-semibold">Daily Affirmation</h3>
              <p className="text-base-content/60 text-sm mt-1">"Your mental health is just as important as your physical health. Taking care of your mind is not a luxury — it is a necessity."</p>
            </div>
            <div className="bg-base-100 border border-base-300 rounded-box p-4">
              <h3 className="font-semibold">Today's Tip</h3>
              <p className="text-base-content/60 text-sm mt-1">Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you touch, 3 you hear, 2 you smell, and 1 you taste.</p>
            </div>
            <div className="bg-base-100 border border-base-300 rounded-box p-4">
              <h3 className="font-semibold">University Announcement</h3>
              <p className="text-base-content/60 text-sm mt-1">There are no announcement yet.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
