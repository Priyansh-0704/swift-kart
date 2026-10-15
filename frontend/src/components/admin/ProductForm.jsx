import { useState } from "react";
import { api } from "../../api/api";
import ErrorMessage from "../ErrorMessage";

const EMPTY_FORM = { name: "", description: "", price: "", discount: "0" };

export default function ProductForm({ product, onDone, onCancel }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(
    isEdit
      ? { name: product.name, description: product.description, price: String(product.price), discount: String(product.discount) }
      : EMPTY_FORM
  );
  const [imageFile, setImageFile] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const errs = {};
    const name = form.name.trim();
    if (!name || name.length < 2 || name.length > 50) errs.name = "Name must be between 2 and 50 characters.";

    const description = form.description.trim();
    if (!description || description.length < 2 || description.length > 1000) errs.description = "Description must be between 2 and 1000 characters.";

    const price = Number(form.price);
    if (!form.price || Number.isNaN(price) || price <= 0 || price > 99999999.99) errs.price = "Enter a valid price greater than 0.";

    const discount = Number(form.discount);
    if (form.discount !== "" && (Number.isNaN(discount) || discount < 0 || discount > 100)) errs.discount = "Discount must be between 0 and 100.";

    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("description", form.description.trim());
    fd.append("price", form.price);
    fd.append("discount", form.discount || "0");
    if (imageFile) fd.append("image", imageFile);

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/products/${product.id}`, fd);
      } else {
        await api.post("/products", fd);
      }
      onDone();
    } catch (err) {
      setFormError(err.message || "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card border shadow-sm mb-4">
      <div className="card-header bg-light py-3">
        <h5 className="mb-0 fw-semibold">{isEdit ? "Edit Product" : "New Product"}</h5>
      </div>
      <div className="card-body p-4">
        {formError && <ErrorMessage message={formError} />}

        <form onSubmit={handleSubmit} noValidate>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">Product Name</label>
              <input
                className={`form-control ${fieldErrors.name ? "is-invalid" : ""}`}
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={50}
                required
              />
              {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label small fw-semibold">Price (₹)</label>
              <input
                className={`form-control ${fieldErrors.price ? "is-invalid" : ""}`}
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={handleChange}
                required
              />
              {fieldErrors.price && <div className="invalid-feedback">{fieldErrors.price}</div>}
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label small fw-semibold">Discount (%)</label>
              <input
                className={`form-control ${fieldErrors.discount ? "is-invalid" : ""}`}
                name="discount"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.discount}
                onChange={handleChange}
              />
              {fieldErrors.discount && <div className="invalid-feedback">{fieldErrors.discount}</div>}
            </div>

            <div className="col-12">
              <label className="form-label small fw-semibold">Description</label>
              <textarea
                className={`form-control ${fieldErrors.description ? "is-invalid" : ""}`}
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                maxLength={1000}
                required
              />
              {fieldErrors.description && <div className="invalid-feedback">{fieldErrors.description}</div>}
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label small fw-semibold">
                Product Image {isEdit && <span className="text-muted fw-normal">(leave empty to keep current image)</span>}
              </label>
              <input
                className="form-control"
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              />
            </div>

            {isEdit && product.imageUrl && (
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold d-block">Current Image</label>
                <img src={product.imageUrl} alt={product.name} style={{ maxHeight: "60px" }} />
              </div>
            )}
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
                <span>{isEdit ? "Update Product" : "Create Product"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}