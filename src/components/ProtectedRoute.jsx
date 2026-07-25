import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children, allowedTypes, adminOnly}) => {
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 👇 NEW: Admin bypass — admin can access any page

  if (user.isAdmin) {
    return children;
  }

  if (allowedTypes && !allowedTypes.includes(user.accountType) && !user.isAdmin) {
  return <Navigate to="/" replace />;
}

   // 👇 NEW: Admin check
  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
