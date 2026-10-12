export default function ErrorMessage({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="alert alert-danger d-flex align-items-center justify-content-between my-3" role="alert">
      <div className="d-flex align-items-center">
        <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
        <span>{message}</span>
      </div>
      {onRetry && (
        <button className="btn btn-sm btn-outline-danger ms-3" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}