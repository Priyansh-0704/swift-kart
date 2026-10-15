import { useState, useEffect, useCallback, Fragment } from "react";
import { api } from "../../api/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const queryKey = `${page}:${role}:${status}:${reloadCount}`;
  const [data, setData] = useState({ key: null, users: [], pagination: null, error: "" });

  const [banTargetId, setBanTargetId] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (role) params.set("role", role);
    if (status) params.set("status", status);

    api.get(`/users?${params.toString()}`)
      .then((res) => {
        if (active) {
          setData({ key: queryKey, users: Array.isArray(res.users) ? res.users : [], pagination: res.pagination || null, error: "" });
        }
      })
      .catch((err) => {
        if (active) setData({ key: queryKey, users: [], pagination: null, error: err.message || "Failed to load users." });
      });

    return () => { active = false; };
  }, [page, role, status, reloadCount, queryKey]);

  const refresh = useCallback(() => setReloadCount((c) => c + 1), []);

  async function handleBan(id) {
    if (!banReason.trim()) {
      setActionError("Please provide a reason for the ban.");
      return;
    }
    setActionLoading(id);
    setActionError("");
    try {
      await api.patch(`/users/${id}/ban`, { reason: banReason.trim() });
      setBanTargetId(null);
      setBanReason("");
      refresh();
    } catch (err) {
      setActionError(err.message || "Failed to ban user.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnban(id) {
    setActionLoading(id);
    setActionError("");
    try {
      await api.patch(`/users/${id}/unban`);
      refresh();
    } catch (err) {
      setActionError(err.message || "Failed to unban user.");
    } finally {
      setActionLoading(null);
    }
  }

  const { users, pagination, error } = data;
  const loading = data.key !== queryKey;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Manage Users</h2>

      <div className="d-flex flex-wrap gap-2 mb-3">
        <select className="form-select form-select-sm" style={{ width: "160px" }} value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="Customer">Customer</option>
          <option value="Admin">Admin</option>
        </select>
        <select className="form-select form-select-sm" style={{ width: "160px" }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Banned">Banned</option>
        </select>
      </div>

      {error && <ErrorMessage message={error} onRetry={refresh} />}
      {actionError && <ErrorMessage message={actionError} />}

      {loading ? (
        <LoadingSpinner message="Loading users…" />
      ) : users.length === 0 ? (
        <EmptyState icon="bi-people" title="No users found" description="No users match this filter." />
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <Fragment key={u.id}>
                  <tr>
                    <td className="small">{u.name}</td>
                    <td className="small">{u.email}</td>
                    <td className="small">{u.username}</td>
                    <td><span className={`badge ${u.role === "Admin" ? "bg-danger" : "bg-secondary"}`}>{u.role}</span></td>
                    <td><span className={`badge ${u.status === "Active" ? "bg-success" : "bg-secondary"}`}>{u.status}</span></td>
                    <td className="text-end">
                      {u.role === "Admin" ? (
                        <span className="text-muted small">Protected</span>
                      ) : u.status === "Active" ? (
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => setBanTargetId(banTargetId === u.id ? null : u.id)}
                          disabled={actionLoading === u.id}
                        >
                          Ban
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => handleUnban(u.id)}
                          disabled={actionLoading === u.id}
                        >
                          {actionLoading === u.id ? "Unbanning…" : "Unban"}
                        </button>
                      )}
                    </td>
                  </tr>
                  {banTargetId === u.id && (
                    <tr>
                      <td colSpan={6}>
                        <div className="d-flex gap-2 align-items-center py-2">
                          <input
                            className="form-control form-control-sm"
                            style={{ maxWidth: "320px" }}
                            placeholder="Reason for ban"
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                          />
                          <button className="btn btn-danger btn-sm" onClick={() => handleBan(u.id)} disabled={actionLoading === u.id}>
                            {actionLoading === u.id ? "Banning…" : "Confirm Ban"}
                          </button>
                          <button className="btn btn-outline-secondary btn-sm" onClick={() => { setBanTargetId(null); setBanReason(""); }}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav className="mt-3" aria-label="User pagination">
          <ul className="pagination pagination-sm justify-content-center">
            <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>&laquo; Previous</button>
            </li>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
              <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                <button className="page-link" onClick={() => setPage(p)}>{p}</button>
              </li>
            ))}
            <li className={`page-item ${page >= pagination.totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage((p) => p + 1)} disabled={page >= pagination.totalPages}>Next &raquo;</button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}