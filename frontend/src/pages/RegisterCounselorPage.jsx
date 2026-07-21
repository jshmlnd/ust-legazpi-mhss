import { useState } from 'react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import PageShell from '../components/PageShell';
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

  const inputClass = 'w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 placeholder-neutral-400 focus:border-neutral-900 outline-none transition-colors';

  return (
    <PageShell title="Register Counselor" subtitle="Create a new counselor account">
      <div className="max-w-xl">
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-sm p-6 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <Stethoscope size={16} className="text-neutral-400" />
            <span className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-400">Counselor Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Counselor ID <span className="text-red-400">*</span></label>
              <input name="counselorId" value={form.counselorId} onChange={handleChange} placeholder="Unique counselor ID" className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Password <span className="text-red-400">*</span></label>
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min. 8 characters" className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Full Name <span className="text-red-400">*</span></label>
            <input name="fullName" value={form.fullName} onChange={handleChange} placeholder="Dr. Jane Smith" className={inputClass} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com (optional)" className={inputClass} />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:pointer-events-none transition-colors rounded-sm"
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
