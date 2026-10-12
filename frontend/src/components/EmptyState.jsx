import { Link } from "react-router-dom";

export default function EmptyState({
  icon = "bi-inbox",
  title = "No items found",
  description = "There are no items to display at this time.",
  actionLabel,
  actionLink,
  onAction,
}) {
  return (
    <div className="text-center py-5 text-muted">
      <i className={`bi ${icon} text-secondary`} style={{ fontSize: "3rem" }}></i>
      <h5 className="mt-3 fw-semibold text-dark">{title}</h5>
      {description && <p className="text-muted small mb-3">{description}</p>}
      {actionLabel && actionLink && (
        <Link to={actionLink} className="btn btn-dark btn-sm">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionLink && (
        <button type="button" className="btn btn-dark btn-sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}