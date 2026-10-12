import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/useAuth";

const COOLDOWN_SECONDS = 60;

// step: "request" → "reset"
export default function ForgotPasswordPage() {
  const [step, setStep] = useState("request");
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  function startCooldown() {
    setCooldown(COOLDOWN_SECONDS);
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [cooldown]);

  async function handleRequest(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const data = await api.post("/auth/forgot-password/request-otp", { usernameOrEmail });
      setMessage(data.message);
      setStep("reset");
      startCooldown();
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
      const data = await api.post("/auth/forgot-password/request-otp", { usernameOrEmail });
      setMessage(data.message);
      startCooldown();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.post("/auth/forgot-password/reset", {
        usernameOrEmail,
        otp,
        newPassword,
      });
      login(data.token, data.user);
      navigate("/");
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

          {step === "request" && (
            <>
              <h4 className="mb-1 fw-semibold">Reset password</h4>
              <p className="text-muted small mb-4">
                Enter your username or email to receive a reset code.
              </p>

              {error && <div className="alert alert-danger py-2">{error}</div>}

              <form onSubmit={handleRequest}>
                <div className="mb-3">
                  <label className="form-label">Username or Email</label>
                  <input
                    className="form-control"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-dark w-100" disabled={loading}>
                  {loading ? "Sending…" : "Send reset code"}
                </button>
              </form>
            </>
          )}

          {step === "reset" && (
            <>
              <h4 className="mb-1 fw-semibold">Enter reset code</h4>
              {message && <div className="alert alert-info py-2">{message}</div>}
              {error && <div className="alert alert-danger py-2">{error}</div>}

              <form onSubmit={handleReset}>
                <div className="mb-3">
                  <label className="form-label">Reset Code</label>
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
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    className="form-control"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <button className="btn btn-dark w-100" disabled={loading}>
                  {loading ? "Resetting…" : "Reset password"}
                </button>
              </form>

              <div className="mt-3 text-center">
                {cooldown > 0 ? (
                  <span className="text-muted small">Resend code in {cooldown}s</span>
                ) : (
                  <button
                    className="btn btn-link btn-sm p-0"
                    onClick={handleResend}
                    disabled={loading}
                  >
                    Resend code
                  </button>
                )}
              </div>
            </>
          )}

          <p className="text-center mt-3 small text-muted">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
