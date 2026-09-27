import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Hash, Building2, BookOpen, Phone, Shield, AlertTriangle } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import PageShell from '../ui/PageShell';
import SectionDivider from '../components/SectionDivider';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-3 border-b border-line last:border-b-0">
    <Icon size={14} className="text-ink-muted shrink-0" />
    <span className="text-xs text-ink-muted w-28 shrink-0">{label}</span>
    <span className="text-sm text-ink font-medium break-all">{value || '—'}</span>
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
          try {
            await axiosInstance.post('/audit-trails/identity-reveal', {
              studentId: id,
              counselorId: authUser._id,
            });
          } catch { /* audit logging should not block UI */ }
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
        <p className="text-xs font-medium text-ink-muted">Access restricted to counselors</p>
      </div>
    );
  }

  return (
    <PageShell
      title="Student Identity"
      description="Secured profile view — crisis intervention protocol"
      actions={
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 transition-colors rounded-lg"
        >
          <ArrowLeft size={14} /> Back
        </button>
      }
    >
      <div className="max-w-2xl mx-auto -mt-6">
        {loading ? (
          <div className="bg-surface border border-line rounded-lg p-12 flex items-center justify-center">
            <p className="text-sm text-ink-muted">Loading student data...</p>
          </div>
        ) : error ? (
          <div className="bg-surface border border-danger/30 rounded-lg p-8 text-center">
            <AlertTriangle size={24} className="text-danger mx-auto mb-3" />
            <p className="text-sm font-medium text-danger-ink">{error}</p>
            <button onClick={() => navigate(-1)} className="mt-4 text-xs text-ink-muted hover:text-ink underline">
              Go back
            </button>
          </div>
        ) : student ? (
          <div className="space-y-6">
            {/* Crisis Warning */}
            <div className="bg-warning-soft border border-warning/30 rounded-lg px-5 py-4 flex items-start gap-3">
              <Shield size={18} className="text-warning-ink shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-ink">Crisis Intervention Record</p>
                <p className="text-xs text-warning-ink mt-0.5">
                  Identity accessed via emergency protocol at{' '}
                  {new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
                </p>
              </div>
            </div>

            {/* Profile Card */}
            <div className="bg-surface border border-line rounded-lg p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-14 rounded-full bg-line flex items-center justify-center text-ink-muted">
                  <User size={26} />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-ink">{student.fullName}</h2>
                  <span className="text-xs text-ink-muted font-mono">STU-{student._id}</span>
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
            <div className="bg-surface border border-line rounded-lg p-6">
              <SectionDivider label="Mother's Information" />
              <div>
                <InfoRow icon={User} label="Name" value={student.mother?.name} />
                <InfoRow icon={Building2} label="Occupation" value={student.mother?.occupation} />
                <InfoRow icon={Phone} label="Contact" value={student.mother?.contact} />
              </div>
            </div>

            {/* Father's Information */}
            <div className="bg-surface border border-line rounded-lg p-6">
              <SectionDivider label="Father's Information" />
              <div>
                <InfoRow icon={User} label="Name" value={student.father?.name} />
                <InfoRow icon={Building2} label="Occupation" value={student.father?.occupation} />
                <InfoRow icon={Phone} label="Contact" value={student.father?.contact} />
              </div>
            </div>

            {/* Guardian & Emergency Contact */}
            <div className="bg-surface border border-line rounded-lg p-6">
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
