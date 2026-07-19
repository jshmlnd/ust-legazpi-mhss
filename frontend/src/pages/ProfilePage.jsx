import { useState } from 'react';
import { Shield, Mail, Hash, Building2, BookOpen, Eye, EyeOff, Check, X, Loader } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import PageShell from '../components/PageShell';
import SectionDivider from '../components/SectionDivider';
import AvatarUpload from '../components/AvatarUpload';
import toast from 'react-hot-toast';

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-b-0">
    <span className="text-xs text-neutral-500">{label}</span>
    <span className="text-sm font-medium text-neutral-900 text-right max-w-[60%] truncate">{value || '—'}</span>
  </div>
);

const StrengthBar = ({ score }) => {
  const levels = [
    { label: 'Weak', color: 'bg-red-500', width: '25%', textColor: 'text-red-600' },
    { label: 'Fair', color: 'bg-orange-500', width: '50%', textColor: 'text-orange-600' },
    { label: 'Good', color: 'bg-amber-500', width: '75%', textColor: 'text-amber-600' },
    { label: 'Strong', color: 'bg-emerald-500', width: '100%', textColor: 'text-emerald-600' },
  ];
  const level = levels[Math.min(score, 3)];

  return (
    <div>
      <div className="h-1 bg-neutral-100 rounded-full overflow-hidden mt-1.5">
        <div className={`h-full rounded-full transition-all duration-500 ${level.color}`} style={{ width: level.width }} />
      </div>
      <p className={`text-[10px] font-medium mt-1 ${level.textColor}`}>{level.label} password</p>
    </div>
  );
};

const getPasswordStrength = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const ValidationRule = ({ passes, label }) => (
  <div className={`flex items-center gap-2 text-[11px] ${passes ? 'text-emerald-600' : 'text-neutral-400'}`}>
    {passes ? <Check size={12} /> : <X size={12} />}
    {label}
  </div>
);

const SecurityCard = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(form.newPassword);
  const passwordsMatch = form.newPassword === form.confirmPassword && form.confirmPassword.length > 0;
  const hasMinLength = form.newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(form.newPassword);
  const hasNumber = /[0-9]/.test(form.newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(form.newPassword);

  const canSubmit = form.currentPassword.length > 0 && form.newPassword.length >= 8 && passwordsMatch;

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setStatus(null);

    try {
      await axiosInstance.put('/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setStatus({ type: 'success', message: 'Password updated successfully.' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password.';
      setStatus({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="size-9 rounded-sm bg-neutral-100 flex items-center justify-center text-neutral-500">
          <Shield size={16} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-neutral-900">Security Settings</h3>
          <p className="text-[11px] text-neutral-400">Update your password</p>
        </div>
      </div>

      {status && (
        <div className={`mb-4 px-4 py-3 rounded-sm text-xs font-medium border ${
          status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Current Password</label>
          <div className="relative">
            <input
              name="currentPassword"
              type={show.current ? 'text' : 'password'}
              value={form.currentPassword}
              onChange={handleChange}
              placeholder="Enter current password"
              className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 pr-9 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors"
            />
            <button type="button" onClick={() => setShow((p) => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              {show.current ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">New Password</label>
          <div className="relative">
            <input
              name="newPassword"
              type={show.new ? 'text' : 'password'}
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 pr-9 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors"
            />
            <button type="button" onClick={() => setShow((p) => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              {show.new ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {form.newPassword.length > 0 && <StrengthBar score={strength} />}
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Confirm New Password</label>
          <div className="relative">
            <input
              name="confirmPassword"
              type={show.confirm ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 pr-9 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors"
            />
            <button type="button" onClick={() => setShow((p) => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
              {show.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {form.confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-[11px] text-red-500 mt-0.5">Passwords do not match</p>
          )}
        </div>

        {form.newPassword.length > 0 && (
          <div className="bg-neutral-50 rounded-sm p-3 space-y-1.5">
            <ValidationRule passes={hasMinLength} label="At least 8 characters" />
            <ValidationRule passes={hasUpper} label="One uppercase letter" />
            <ValidationRule passes={hasNumber} label="One number" />
            <ValidationRule passes={hasSpecial} label="One special character" />
          </div>
        )}

        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors rounded-sm"
          >
            {loading ? <Loader size={14} className="animate-spin" /> : <Shield size={14} />}
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ProfilePage = () => {
  const { authUser, updateProfile } = useAuthStore();
  if (!authUser) return null;

  const isStudent = authUser.userType?.toLowerCase() === 'student';

  const meta = [
    { icon: Mail, label: 'Email', value: authUser.email },
    ...(isStudent ? [{ icon: Hash, label: 'Student ID', value: authUser.studentId }] : []),
    { icon: Building2, label: 'Department', value: authUser.department },
    { icon: BookOpen, label: 'Program', value: authUser.program },
  ];

  const handleUpload = async (base64) => {
    try {
      await updateProfile(base64);
      toast.success('Profile picture updated');
    } catch {
      toast.error('Failed to update profile picture');
    }
  };

  const handleRemove = async () => {
    try {
      await updateProfile('');
      toast.success('Profile picture removed');
    } catch {
      toast.error('Failed to remove profile picture');
    }
  };

  return (
    <PageShell title="My Account" subtitle="Manage your profile and security settings">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-sm p-6">
            <div className="flex items-center gap-4 mb-5">
              <AvatarUpload
                profilePic={authUser.profilePic}
                fullName={authUser.fullName}
                onUpload={handleUpload}
                onRemove={handleRemove}
                size="lg"
              />
              <div>
                <h2 className="text-base font-medium text-neutral-900">{authUser.fullName || 'User'}</h2>
                <span className="text-xs text-neutral-400">
                  {authUser.userType === 'Counselor' ? 'Counselor' : 'Student'}
                </span>
              </div>
            </div>

            <SectionDivider label="Details" />

            <div>
              {meta.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-b-0">
                    <Icon size={14} className="text-neutral-400 shrink-0" />
                    <span className="text-xs text-neutral-500 w-24 shrink-0">{item.label}</span>
                    <span className="text-sm text-neutral-900 truncate">{item.value || '—'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <SecurityCard />
        </div>
      </div>
    </PageShell>
  );
};

export default ProfilePage;
