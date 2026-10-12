export default function AddressCard({ address, onEdit, onDelete, disabled }) {
  return (
    <div className="card h-100 border shadow-sm">
      <div className="card-body p-3 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <span className="badge bg-secondary">{address.label}</span>
          <div className="btn-group btn-group-sm">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => onEdit(address)} title="Edit address" disabled={disabled}>
              <i className="bi bi-pencil"></i>
            </button>
            <button className="btn btn-outline-danger btn-sm" onClick={() => onDelete(address.id)} title="Delete address" disabled={disabled}>
              <i className="bi bi-trash3"></i>
            </button>
          </div>
        </div>

        <h6 className="fw-bold mb-1 text-dark">{address.fullName}</h6>
        <p className="text-muted small mb-2">
          <i className="bi bi-telephone me-1"></i>
          {address.phone}
        </p>

        <div className="small text-muted mb-3 flex-grow-1">
          <div>{address.addressLine1}</div>
          {address.addressLine2 && <div>{address.addressLine2}</div>}
          {address.landmark && <div className="text-secondary">Near {address.landmark}</div>}
          <div>
            {address.city}, {address.state} - <span className="fw-semibold">{address.pincode}</span>
          </div>
          <div>{address.country}</div>
        </div>
      </div>
    </div>
  );
}