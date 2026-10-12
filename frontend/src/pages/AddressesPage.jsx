import { useState, useEffect, useCallback } from "react";
import { api } from "../api/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import AddressForm from "../components/AddressForm";
import AddressCard from "../components/AddressCard";
import { validateAddress, EMPTY_ADDRESS_FORM } from "../utils/addressValidation";

export default function AddressesPage() {
  const [data, setData] = useState({ addresses: [], loading: true, error: "" });
  const [reloadCount, setReloadCount] = useState(0);

  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const [mode, setMode] = useState(null); // null | "add" | addressId
  const [form, setForm] = useState(EMPTY_ADDRESS_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    api.get("/addresses")
      .then((res) => {
        if (active) {
          setData({
            addresses: Array.isArray(res.addresses) ? res.addresses : [],
            loading: false,
            error: "",
          });
        }
      })
      .catch((err) => {
        if (active) {
          setData({ addresses: [], loading: false, error: err.message || "Failed to load addresses." });
        }
      });
    return () => {
      active = false;
    };
  }, [reloadCount]);

  const fetchAddresses = useCallback(() => {
    setData((prev) => ({ ...prev, loading: true, error: "" }));
    setReloadCount((c) => c + 1);
  }, []);

  const { addresses, loading, error } = data;

  function handleStartAdd() {
    setForm(EMPTY_ADDRESS_FORM);
    setFieldErrors({});
    setFormError("");
    setMode("add");
  }

  function handleStartEdit(addr) {
    setForm({
      label: addr.label || "Home",
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      landmark: addr.landmark || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      country: addr.country || "India",
    });
    setFieldErrors({});
    setFormError("");
    setMode(addr.id);
  }

  function handleCancelForm() {
    setMode(null);
    setForm(EMPTY_ADDRESS_FORM);
    setFieldErrors({});
    setFormError("");
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const errs = validateAddress(form);
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSaving(true);
    const payload = {
      label: form.label.trim(),
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2 ? form.addressLine2.trim() : "",
      landmark: form.landmark ? form.landmark.trim() : "",
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      country: form.country.trim(),
    };

    try {
      if (mode === "add") {
        await api.post("/addresses", payload);
      } else {
        await api.put(`/addresses/${mode}`, payload);
      }
      handleCancelForm();
      fetchAddresses();
    } catch (err) {
      setFormError(err.message || "Failed to save address.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeleting(true);
    try {
      await api.delete(`/addresses/${id}`);
      setDeleteConfirmId(null);
      fetchAddresses();
    } catch (err) {
      setData((prev) => ({ ...prev, error: err.message || "Failed to delete address." }));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Saved Addresses</h2>
          <p className="text-muted small mb-0">Manage your shipping and delivery addresses</p>
        </div>

        {!mode && (
          <button className="btn btn-dark btn-sm d-flex align-items-center gap-1" onClick={handleStartAdd}>
            <i className="bi bi-plus-lg"></i>
            <span>Add New Address</span>
          </button>
        )}
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchAddresses} />}

      {deleteConfirmId && (
        <div className="alert alert-warning border d-flex flex-wrap align-items-center justify-content-between mb-4 py-2 px-3">
          <span className="small">Are you sure you want to permanently delete this address?</span>
          <div className="d-flex gap-2">
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(deleteConfirmId)} disabled={deleting}>
              {deleting ? "Deleting…" : "Yes, Delete"}
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setDeleteConfirmId(null)} disabled={deleting}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode && (
        <AddressForm
          form={form}
          fieldErrors={fieldErrors}
          formError={formError}
          saving={saving}
          mode={mode}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
        />
      )}

      {loading ? (
        <LoadingSpinner message="Loading your saved addresses…" />
      ) : addresses.length === 0 && !mode ? (
        <EmptyState
          icon="bi-geo-alt"
          title="No addresses saved"
          description="Add your delivery address so it will be ready for checkout."
          actionLabel="Add Address"
          onAction={handleStartAdd}
        />
      ) : (
        <div className="row g-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="col-12 col-md-6 col-lg-4">
              <AddressCard
                address={addr}
                onEdit={handleStartEdit}
                onDelete={(id) => setDeleteConfirmId(id)}
                disabled={Boolean(mode)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}