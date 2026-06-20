import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCounselorStore } from "../store/useCounselorStore";
import { ArrowLeft, Mail, Phone, User, BookOpen, Users, AlertCircle, Loader, HatGlasses } from "lucide-react";

const InfoCard = ({ title, children }) => (
  <div className="border-[3px] border-black rounded-xl p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
    <h3 className="text-lg font-black mb-4 flex items-center gap-2">
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </div>
);

const InfoField = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 pb-3 border-b-[2px] border-gray-200 last:border-b-0 last:pb-0">
    {Icon && (
      <div className="p-2 rounded-lg bg-blue-100 border-[2px] border-black mt-1 shrink-0">
        <Icon size={16} />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-xs font-bold uppercase text-gray-500">{label}</p>
      <p className="font-bold text-gray-900 break-words">{value || "N/A"}</p>
    </div>
  </div>
);

const CounselorStudentIdentity = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentStudent, isLoading, error, fetchStudentById } = useCounselorStore();

  useEffect(() => {
    if (id) {
      fetchStudentById(id);
    }
  }, [id, fetchStudentById]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  if (error || !currentStudent) {
    return (
      <div className="min-h-screen p-6 max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 font-bold mb-6 hover:opacity-70 transition"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="border-[3px] border-black rounded-xl p-8 bg-red-50 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="text-red-600 mt-1 shrink-0" />
            <div>
              <h2 className="font-black text-red-900">Error</h2>
              <p className="text-red-800">{error || "Student not found"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 font-bold mb-6 hover:opacity-70 transition"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      {/* Header */}
      <section className="mb-8">
        <div className="border-[3px] border-black rounded-xl p-6 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full border-[3px] border-black bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center shrink-0">
              {currentStudent.profilePic ? (
                <img
                  src={currentStudent.profilePic}
                  alt={currentStudent.fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <HatGlasses size={32} className="text-blue-700" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-black mb-2">{currentStudent.fullName}</h1>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-blue-100 border-[2px] border-black px-3 py-1 rounded-lg font-bold text-sm">
                  {currentStudent.studentId}
                </span>
                <span className="bg-green-100 border-[2px] border-black px-3 py-1 rounded-lg font-bold text-sm">
                  {currentStudent.department}
                </span>
              </div>
              <p className="font-bold text-gray-600">{currentStudent.program}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Personal & Contact Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-black mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfoCard title="Contact Details">
            <InfoField label="Email" value={currentStudent.email} icon={Mail} />
            <InfoField label="Phone" value={currentStudent.phone} icon={Phone} />
            <InfoField label="Program" value={currentStudent.program} icon={BookOpen} />
          </InfoCard>

          <InfoCard title="Academic Details">
            <InfoField label="Student ID" value={currentStudent.studentId} />
            <InfoField label="Department" value={currentStudent.department} />
            <InfoField label="User Type" value={currentStudent.userType} icon={User} />
          </InfoCard>
        </div>
      </section>

      {/* Family Information */}
      <section className="mb-8">
        <h2 className="text-2xl font-black mb-4">Family Information</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InfoCard title="Father">
            <InfoField label="Name" value={currentStudent.fatherName} icon={Users} />
            <InfoField label="Contact" value={currentStudent.fatherContactNo} icon={Phone} />
          </InfoCard>

          <InfoCard title="Mother">
            <InfoField label="Name" value={currentStudent.motherName} icon={Users} />
            <InfoField label="Contact" value={currentStudent.motherContactNo} icon={Phone} />
          </InfoCard>

          <InfoCard title="Guardian">
            <InfoField label="Name" value={currentStudent.guardianName} icon={Users} />
            <InfoField label="Contact" value={currentStudent.guardianContactNo} icon={Phone} />
          </InfoCard>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="mb-8">
        <h2 className="text-2xl font-black mb-4">Emergency Contact</h2>
        <InfoCard title="Contact Details">
          <InfoField label="Name" value={currentStudent.emergencyContactName} icon={Users} />
          <InfoField label="Phone" value={currentStudent.emergencyContactNo} icon={Phone} />
        </InfoCard>
      </section>

      {/* Quick Actions */}
      <section className="mb-8 flex gap-4 flex-wrap">
        <button className="border-[3px] border-black rounded-lg px-6 py-3 font-bold bg-blue-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
          Send Message
        </button>
        <button className="border-[3px] border-black rounded-lg px-6 py-3 font-bold bg-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
          Schedule Appointment
        </button>
        <button className="border-[3px] border-black rounded-lg px-6 py-3 font-bold bg-purple-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
          View History
        </button>
      </section>
    </div>
  );
};

export default CounselorStudentIdentity;