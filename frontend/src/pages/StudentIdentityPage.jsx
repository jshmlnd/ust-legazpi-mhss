import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Hash, Building2, BookOpen, Phone, Shield, AlertTriangle } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import PageShell from '../components/PageShell';
import SectionDivider from '../components/SectionDivider';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-b-0">
    <Icon size={14} className="text-neutral-400 shrink-0" />
    <span className="text-xs text-neutral-500 w-28 shrink-0">{label}</span>
    <span className="text-sm text-neutral-900 font-medium break-all">{value || '—'}</span>
  </div>
);

const SESSION_KEY = 'crisis_identity_verified';

const StudentIdentityPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authUser) return;

    const fetchStudent = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/message/users`);
        const found = res.data.find((u) => String(u._id) === String(id));
        if (found) {
          setStudent(found);
        } else {
          setError('Student not found');
        }
      } catch {
        setError('Failed to load student information');
      } finally {
        setLoading(false);
        sessionStorage.setItem(SESSION_KEY, 'true');
      }
    };

    fetchStudent();
  }, [id, authUser]);

  const isCounselor = authUser?.userType?.toLowerCase() === 'counselor';

  if (!authUser) return null;
  if (!isCounselor) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="text-xs tracking-[0.1em] font-medium uppercase text-neutral-400">Access restricted to counselors</p>
      </div>
    );
  }

  return (
    <PageShell
      title="Student Identity"
      subtitle="Secured profile view — crisis intervention protocol"
      actions={
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm"
        >
          <ArrowLeft size={14} /> Back
        </button>
      }
    >
      <div className="max-w-2xl mx-auto -mt-6">
        {loading ? (
          <div className="bg-white border border-neutral-200 rounded-sm p-12 flex items-center justify-center">
            <p className="text-sm text-neutral-400">Loading student data...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-sm p-8 text-center">
            <AlertTriangle size={24} className="text-red-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-xs text-neutral-500 hover:text-neutral-900 underline">
              Go back
            </button>
          </div>
        ) : student ? (
          <div className="space-y-6">
            {/* Crisis Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-sm px-5 py-4 flex items-start gap-3">
              <Shield size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Crisis Intervention Record</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Identity accessed via emergency protocol at{' '}
                  {new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white border border-neutral-200 rounded-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-14 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                  <User size={26} />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-neutral-900">{student.fullName}</h2>
                  <span className="text-xs text-neutral-400 font-mono">STU-{student._id}</span>
                </div>
              </div>

              <SectionDivider label="Academic Profile" />

              <div>
                <InfoRow icon={Hash} label="Student ID" value={student.studentId} />
                <InfoRow icon={Building2} label="Department" value={student.department} />
                <InfoRow icon={BookOpen} label="Program" value={student.program} />
              </div>

              <SectionDivider label="Contact Information" />

              <div>
                <InfoRow icon={Mail} label="Email" value={student.email} />
                <InfoRow icon={Phone} label="Phone" value={student.phone} />
              </div>
            </div>

            {/* Mother's Information */}
            <div className="bg-white border border-neutral-200 rounded-sm p-6">
              <SectionDivider label="Mother's Information" />
              <div>
                <InfoRow icon={User} label="Name" value={student.mother?.name} />
                <InfoRow icon={Building2} label="Occupation" value={student.mother?.occupation} />
                <InfoRow icon={Phone} label="Contact" value={student.mother?.contact} />
              </div>
            </div>

            {/* Father's Information */}
            <div className="bg-white border border-neutral-200 rounded-sm p-6">
              <SectionDivider label="Father's Information" />
              <div>
                <InfoRow icon={User} label="Name" value={student.father?.name} />
                <InfoRow icon={Building2} label="Occupation" value={student.father?.occupation} />
                <InfoRow icon={Phone} label="Contact" value={student.father?.contact} />
              </div>
            </div>

            {/* Guardian & Emergency Contact */}
            <div className="bg-white border border-neutral-200 rounded-sm p-6">
              <SectionDivider label="Guardian Information" />
              <div>
                <InfoRow icon={User} label="Name" value={student.guardian?.name} />
                <InfoRow icon={Building2} label="Relationship" value={student.guardian?.relationship} />
                <InfoRow icon={Phone} label="Contact" value={student.guardian?.contact} />
              </div>

              <SectionDivider label="Emergency Contact" />
              <div>
                <InfoRow icon={User} label="Name" value={student.emergencyContact?.name} />
                <InfoRow icon={Building2} label="Relationship" value={student.emergencyContact?.relationship} />
                <InfoRow icon={Phone} label="Contact" value={student.emergencyContact?.contact} />
                <InfoRow icon={Mail} label="Address" value={student.emergencyContact?.address} />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  );
};

export default StudentIdentityPage;
