import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/useAuth";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function LoginPage() {
  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef(null);
  const googleInitialized = useRef(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  // Defined before useEffect that uses it
  const handleGoogleLogin = useCallback(async (response) => {
    setError("");
    setLoading(true);
    api.post("/auth/google", { idToken: response.credential })
      .then((data) => {
        login(data.token, data.user);
        navigate("/");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [login, navigate]);

  useEffect(() => {
    if (googleInitialized.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 280,
      });
      googleInitialized.current = true;
    };
    document.body.appendChild(script);
    return () => script.remove();
  }, [handleGoogleLogin]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post("/auth/login", form);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      if (err.data?.code === "EMAIL_NOT_VERIFIED") {
        navigate("/verify-otp", { state: { email: form.usernameOrEmail } });
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-8 col-md-5">
          <h4 className="mb-4 fw-semibold">Sign in</h4>

          {error && (
            <div className="alert alert-danger py-2">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Username or Email</label>
              <input
                className="form-control"
                name="usernameOrEmail"
                value={form.usernameOrEmail}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <div className="mt-1 text-end">
                <Link to="/forgot-password" className="small text-muted">
                  Forgot password?
                </Link>
              </div>
            </div>
            <button className="btn btn-dark w-100" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="d-flex align-items-center my-3 gap-2">
            <hr className="flex-grow-1 m-0" />
            <span className="text-muted small">or</span>
            <hr className="flex-grow-1 m-0" />
          </div>

          <div className="d-flex justify-content-center">
            <div ref={googleButtonRef}></div>
          </div>

          <p className="text-center mt-3 small text-muted">
            Don&apos;t have an account?{" "}
            <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
