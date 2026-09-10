import { Navigate } from "react-router-dom";
import { Loader } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { PATHS } from "../lib/routes";

const ROLE_HOME = {
  student: PATHS.HOME,
  counselor: PATHS.DASHBOARD,
  administrator: PATHS.ADMIN,
};

export const RoleRoute = ({ allow, children }) => {
  const { authUser, isCheckingAuth } = useAuthStore();
  const role = authUser?.userType?.toLowerCase();

  if (isCheckingAuth && !authUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to={PATHS.LOGIN} />;
  }

  const allowed = (allow || []).map((r) => r.toLowerCase());
  if (allowed.length && !allowed.includes(role)) {
    return <Navigate to={ROLE_HOME[role] || PATHS.HOME} />;
  }

  return children;
};
