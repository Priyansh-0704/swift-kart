import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function AdminRoute({ children }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && user.role !== "Admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}