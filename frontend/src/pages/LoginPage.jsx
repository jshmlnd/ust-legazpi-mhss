import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Eye, EyeOff, Loader } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    password: "",
  });

  const { login, isLoggingIn, error } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ id: formData.id, password: formData.password });
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-full border p-6">
            <legend className="fieldset-legend text-lg font-bold"></legend>

            <label className="label">
              <span className="label-text">Student ID</span>
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="Student or Counselor ID"
              value={formData.id}
              onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value }))}
              required
            />

            <label className="label mt-3">
              <span className="label-text">Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input w-full pr-10"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/60 hover:text-base-content cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="alert alert-error mt-4 p-2 text-sm">
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-neutral mt-4 w-full" disabled={isLoggingIn}>
              {isLoggingIn ? <Loader className="size-4 animate-spin" /> : "Login"}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
