import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = "Name must be at least 2 characters.";
    }
    if (!form.email.trim()) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Enter a valid email address.";
    }
    if (!form.username.trim() || form.username.length < 3) {
      errs.username = "Username must be at least 3 characters.";
    } else if (!/^[a-z0-9]+$/i.test(form.username)) {
      errs.username = "Username can only contain letters and numbers.";
    }
    if (!form.password || form.password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        username: form.username.trim().toLowerCase(),
        password: form.password,
      });
      navigate("/verify-otp", { state: { email: form.email.trim().toLowerCase() } });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-8 col-md-5">
          <h4 className="mb-4 fw-semibold">Create account</h4>

          {serverError && (
            <div className="alert alert-danger py-2">{serverError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label">Full Name</label>
              <input
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                name="name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
              />
              {errors.name && <div className="invalid-feedback">{errors.name}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
              {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                className={`form-control ${errors.username ? "is-invalid" : ""}`}
                name="username"
                value={form.username}
                onChange={handleChange}
                autoComplete="username"
              />
              {errors.username && <div className="invalid-feedback">{errors.username}</div>}
            </div>

            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
              {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>

            <button className="btn btn-dark w-100" disabled={loading}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center mt-3 small text-muted">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
