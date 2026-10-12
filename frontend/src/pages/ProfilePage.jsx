import { useState } from "react";
import { useAuth } from "../context/useAuth";
import { api } from "../api/api";

export default function ProfilePage() {
  const { user, refreshUser, updateUser, logout } = useAuth();

  const [nameForm, setNameForm] = useState({ name: user?.name || "" });
  const [nameMsg, setNameMsg] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameLoading, setNameLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  async function handleNameSubmit(e) {
    e.preventDefault();
    setNameError("");
    setNameMsg("");
    if (!nameForm.name.trim() || nameForm.name.trim().length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    setNameLoading(true);
    try {
      const data = await api.put("/auth/profile", { name: nameForm.name.trim() });
      if (data.user) {
        updateUser(data.user);
      }
      await refreshUser();
      setNameMsg("Name updated successfully.");
    } catch (err) {
      setNameError(err.message || "Failed to update profile name.");
    } finally {
      setNameLoading(false);
    }
  }

  async function handlePwSubmit(e) {
    e.preventDefault();
    setPwError("");
    setPwMsg("");
    if (pwForm.newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    setPwLoading(true);
    try {
      const data = await api.put("/auth/change-password", pwForm);
      // backend returns a new token after password change
      localStorage.setItem("token", data.token);
      await refreshUser();
      setPwForm({ currentPassword: "", newPassword: "" });
      setPwMsg("Password changed. You have been signed in with the new credentials.");
    } catch (err) {
      setPwError(err.message || "Failed to change password.");
    } finally {
      setPwLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-7">
          <h4 className="mb-4 fw-semibold">My Profile</h4>

          {/* Info card */}
          <div className="border rounded p-3 mb-4">
            <dl className="row mb-0">
              <dt className="col-5 col-md-4 text-muted fw-normal">Name</dt>
              <dd className="col-7 col-md-8 mb-2">{user.name}</dd>

              <dt className="col-5 col-md-4 text-muted fw-normal">Email</dt>
              <dd className="col-7 col-md-8 mb-2">{user.email}</dd>

              <dt className="col-5 col-md-4 text-muted fw-normal">Username</dt>
              <dd className="col-7 col-md-8 mb-2">{user.username}</dd>

              <dt className="col-5 col-md-4 text-muted fw-normal">Role</dt>
              <dd className="col-7 col-md-8 mb-2">
                <span className={`badge ${user.role === "Admin" ? "bg-danger" : "bg-secondary"}`}>
                  {user.role}
                </span>
              </dd>

              {user.isVerified !== undefined && (
                <>
                  <dt className="col-5 col-md-4 text-muted fw-normal">Verified</dt>
                  <dd className="col-7 col-md-8 mb-2">
                    {user.isVerified ? (
                      <span className="text-success"><i className="bi bi-check-circle me-1"></i>Yes</span>
                    ) : (
                      <span className="text-danger">No</span>
                    )}
                  </dd>
                </>
              )}

              {user.hasPassword !== undefined && (
                <>
                  <dt className="col-5 col-md-4 text-muted fw-normal">Password set</dt>
                  <dd className="col-7 col-md-8 mb-2">{user.hasPassword ? "Yes" : "No"}</dd>
                </>
              )}

              {user.googleLinked !== undefined && (
                <>
                  <dt className="col-5 col-md-4 text-muted fw-normal">Google linked</dt>
                  <dd className="col-7 col-md-8 mb-0">{user.googleLinked ? "Yes" : "No"}</dd>
                </>
              )}
            </dl>
          </div>

          {/* Update name */}
          <h6 className="fw-semibold mb-3">Update name</h6>
          {nameError && <div className="alert alert-danger py-2">{nameError}</div>}
          {nameMsg && <div className="alert alert-success py-2">{nameMsg}</div>}
          <form onSubmit={handleNameSubmit} className="mb-4">
            <div className="input-group">
              <input
                className="form-control"
                value={nameForm.name}
                onChange={(e) => setNameForm({ name: e.target.value })}
                placeholder="Full name"
              />
              <button className="btn btn-outline-dark" disabled={nameLoading}>
                {nameLoading ? "Saving…" : "Save"}
              </button>
            </div>
          </form>

          {/* Change password */}
          {user.hasPassword !== false && (
            <>
              <h6 className="fw-semibold mb-3">Change password</h6>
              {pwError && <div className="alert alert-danger py-2">{pwError}</div>}
              {pwMsg && <div className="alert alert-success py-2">{pwMsg}</div>}
              <form onSubmit={handlePwSubmit} className="mb-4">
                <div className="mb-3">
                  <label className="form-label">Current Password</label>
                  <input
                    className="form-control"
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    className="form-control"
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                    autoComplete="new-password"
                    required
                  />
                </div>
                <button className="btn btn-dark" disabled={pwLoading}>
                  {pwLoading ? "Changing…" : "Change password"}
                </button>
              </form>
            </>
          )}

          <hr />
          <button className="btn btn-outline-danger btn-sm" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
