import { useAuthStore } from "../store/useAuthStore";
import { LogOut } from "lucide-react";
import ustLogo from "./images/ust-logo.png";

const Navbar = () => {
  const { authUser, logout } = useAuthStore();

  return (
    <nav className="navbar bg-base-400 border-b border-base-300 px-4">
      <div className="flex-1 flex items-center gap-2">
        <img src={ustLogo} alt="UST Logo" className="h-16 w-auto" />
        <span className="text-2xl font-black">University Mental Health Support</span>
      </div>
      {authUser && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-black">
            {authUser.studentId ? "STU-" + authUser._id.slice(0, 8) : authUser.fullName}
          </span>
          <button onClick={logout} className="btn btn-ghost btn-sm">
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar
