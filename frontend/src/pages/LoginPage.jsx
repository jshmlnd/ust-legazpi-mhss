import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { PATHS } from '../lib/routes';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');

  const { login, isLoggingIn } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentId.trim()) {
      toast.error('Please enter your Student / Counselor ID');
      return;
    }

    if (!password) {
      toast.error('Please enter your password');
      return;
    }

    try {
      const user = await login(studentId.trim(), password);
      const isCounselor = user?.userType?.toLowerCase() === 'counselor';
      navigate(isCounselor ? PATHS.DASHBOARD : PATHS.HOME);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <main>
      <div className="absolute inset-0 -z-10 scale-100 bg-center bg-cover bg-no-repeat blur-[8px]"
        style={{ backgroundImage: "url('https://ik.imagekit.io/zjkm666/background.png')" }} />
      <div className="min-h-full pt-32 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-12 text-center">
            <h1 className="text-xl tracking-[0.2em] font-medium text-gray-900 uppercase mb-3">
              UST-Legazpi
            </h1>
            <p className="text-xs tracking-[0.1em] font-medium uppercase text-gray-400">
              Mental Health Support System
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs tracking-[0.1em] font-medium uppercase text-gray-500">
                Student / Counselor ID
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter your ID"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors placeholder:text-gray-300"
                autoComplete="username"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs tracking-[0.1em] font-medium uppercase text-gray-500">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-colors placeholder:text-gray-300"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full mt-2 px-6 py-3 text-sm tracking-[0.1em] font-medium uppercase rounded-full bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none transition-all duration-300"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
