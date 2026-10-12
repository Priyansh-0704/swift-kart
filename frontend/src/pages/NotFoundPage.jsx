import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="container py-5 text-center">
      <div className="py-5">
        <h1 className="display-1 fw-bold text-secondary">404</h1>
        <h3 className="fw-bold mb-3">Page Not Found</h3>
        <p className="text-muted mb-4 col-md-6 mx-auto">
          The page you are looking for doesn't exist, or has been removed.
        </p>
        <div className="d-flex justify-content-center gap-2">
          <Link to="/" className="btn btn-dark">
            <i className="bi bi-house me-1"></i>Back to Home
          </Link>
          <Link to="/products" className="btn btn-outline-secondary">
            <i className="bi bi-grid me-1"></i>Browse Catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
