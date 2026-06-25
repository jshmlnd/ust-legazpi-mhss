import { useAuthStore } from '../store/useAuthStore';

const RoleGate = ({ roles, children, fallback = null }) => {
  const { authUser } = useAuthStore();
  const role = authUser?.userType?.toLowerCase() ?? null;

  if (!roles.includes(role)) return fallback;
  return children;
};

export default RoleGate;
