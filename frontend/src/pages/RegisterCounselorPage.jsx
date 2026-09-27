import { useState } from 'react';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-toastify';
import PageShell from '../ui/PageShell';
import { Stethoscope } from 'lucide-react';

const initialForm = {
  counselorId: '',
  password: '',
  fullName: '',
  email: '',
};

const RegisterCounselorPage = () => {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.counselorId.trim() || !form.password || !form.fullName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/auth/register-counselor', {
        counselorId: form.counselorId.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
      });
      toast.success('Counselor account created successfully');
      setForm(initialForm);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-transparent border border-line text-sm rounded-lg px-3 py-2.5 text-ink placeholder:text-ink-muted focus:border-brand-600 outline-none transition-colors';

  return (
    <PageShell title="Register Counselor" description="Create a new counselor account">
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-lg p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <Stethoscope size={16} className="text-ink-muted" />
            <span className="text-xs font-semibold text-ink-muted">Counselor Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted">Counselor ID <span className="text-danger">*</span></label>
              <input name="counselorId" value={form.counselorId} onChange={handleChange} placeholder="Unique counselor ID" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted">Password <span className="text-danger">*</span></label>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Full Name <span className="text-danger">*</span></label>
            <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Dr. Jane Smith" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com (optional)" className={inputClass} />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-brand-fg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:pointer-events-none transition-colors rounded-lg"
            >
              {loading ? 'Creating...' : 'Create Counselor Account'}
            </button>
          </div>
        </form>
      </div>
    </PageShell>
  );
};

export default RegisterCounselorPage;
