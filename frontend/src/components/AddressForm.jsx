import ErrorMessage from "./ErrorMessage";

function Field({ label, name, value, onChange, error, maxLength, required, col, placeholder }) {
  return (
    <div className={`col-12 col-${col}`}>
      <label className="form-label small fw-semibold">{label}</label>
      <input
        className={`form-control ${error ? "is-invalid" : ""}`}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
}

export default function AddressForm({ form, fieldErrors, formError, saving, mode, onChange, onSubmit, onCancel }) {
  return (
    <div className="card border shadow-sm mb-4">
      <div className="card-header bg-light py-3">
        <h5 className="mb-0 fw-semibold">
          {mode === "add" ? "Add New Shipping Address" : "Edit Address"}
        </h5>
      </div>
      <div className="card-body p-4">
        {formError && <ErrorMessage message={formError} />}

        <form onSubmit={onSubmit} noValidate>
          <div className="row g-3">
            <Field label="Address Label (e.g. Home, Office)" name="label" value={form.label} onChange={onChange} error={fieldErrors.label} maxLength={30} required col="md-4" placeholder="Home" />
            <Field label="Full Name" name="fullName" value={form.fullName} onChange={onChange} error={fieldErrors.fullName} maxLength={50} required col="md-4" placeholder="Your Name" />
            <Field label="Contact Phone" name="phone" value={form.phone} onChange={onChange} error={fieldErrors.phone} maxLength={15} required col="md-4" placeholder="Phone Number" />

            <Field label="Address Line 1 (House/Flat No, Street)" name="addressLine1" value={form.addressLine1} onChange={onChange} error={fieldErrors.addressLine1} maxLength={100} required col="md-6" placeholder="A-66 GIDC" />
            <Field label="Address Line 2 (Apartment, Floor - Optional)" name="addressLine2" value={form.addressLine2} onChange={onChange} error={fieldErrors.addressLine2} maxLength={100} col="md-6" placeholder="Sector 25" />

            <Field label="Landmark (Optional)" name="landmark" value={form.landmark} onChange={onChange} error={fieldErrors.landmark} maxLength={50} col="md-4" placeholder="EQDC Circle" />
            <Field label="City" name="city" value={form.city} onChange={onChange} error={fieldErrors.city} maxLength={50} required col="md-4" placeholder="Gandhinagar" />
            <Field label="State" name="state" value={form.state} onChange={onChange} error={fieldErrors.state} maxLength={50} required col="md-4" placeholder="Gujarat" />

            <Field label="Pincode (6 Digits)" name="pincode" value={form.pincode} onChange={onChange} error={fieldErrors.pincode} maxLength={6} required col="md-6" placeholder="382016" />
            <Field label="Country" name="country" value={form.country} onChange={onChange} error={fieldErrors.country} maxLength={40} required col="md-6" placeholder="India" />
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-dark d-flex align-items-center gap-1" disabled={saving}>
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Saving…</span>
                </>
              ) : (
                <span>{mode === "add" ? "Save Address" : "Update Address"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}