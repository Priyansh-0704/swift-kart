export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div className="spinner-border text-primary mb-2" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      {message && <p className="text-muted small mb-0">{message}</p>}
    </div>
  );
}