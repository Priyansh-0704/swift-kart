import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/useAuth";

const COOLDOWN_SECONDS = 60;

export default function VerifyOtpPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState(state?.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await api.post("/auth/verify-otp", { email, otp });
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await api.post("/auth/resend-otp", { email });
      setMessage(data.message);
      startCooldown();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-8 col-md-5">
          <h4 className="mb-1 fw-semibold">Verify your email</h4>
          <p className="text-muted small mb-4">
            Enter the 6-digit code sent to <strong>{email}</strong>
          </p>

          {error && <div className="alert alert-danger py-2">{error}</div>}
          {message && <div className="alert alert-info py-2">{message}</div>}

          {!state?.email && (
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                className="form-control"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Verification Code</label>
              <input
                className="form-control"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                required
              />
            </div>

            <button className="btn btn-dark w-100" disabled={loading}>
              {loading ? "Verifying…" : "Verify"}
            </button>
          </form>

          <div className="mt-3 text-center">
            {cooldown > 0 ? (
              <span className="text-muted small">Resend OTP in {cooldown}s</span>
            ) : (
              <button
                className="btn btn-link btn-sm p-0"
                onClick={handleResend}
                disabled={loading}
              >
                Resend OTP
              </button>
            )}
          </div>

          <p className="text-center mt-3 small text-muted">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
