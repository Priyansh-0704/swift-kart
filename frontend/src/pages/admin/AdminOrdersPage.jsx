import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";
import OrderStatusBadge from "../../components/OrderStatusBadge";

const NEXT_STATUSES = {
  Pending: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const queryKey = `${page}:${status}:${reloadCount}`;
  const [data, setData] = useState({ key: null, orders: [], pagination: null, error: "" });
  const [updatingId, setUpdatingId] = useState(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), limit: "10" });
    if (status) params.set("status", status);

    api.get(`/admin/orders?${params.toString()}`)
      .then((res) => {
        if (active) {
          setData({ key: queryKey, orders: Array.isArray(res.orders) ? res.orders : [], pagination: res.pagination || null, error: "" });
        }
      })
      .catch((err) => {
        if (active) setData({ key: queryKey, orders: [], pagination: null, error: err.message || "Failed to load orders." });
      });

    return () => { active = false; };
  }, [page, status, reloadCount, queryKey]);

  const refresh = useCallback(() => setReloadCount((c) => c + 1), []);

  async function handleStatusChange(order, newStatus) {
    if (!newStatus) return;
    setUpdatingId(order.id);
    setActionError("");
    try {
      await api.patch(`/admin/orders/${order.id}/status`, { status: newStatus });
      refresh();
    } catch (err) {
      setActionError(err.message || "Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  }

  const { orders, pagination, error } = data;
  const loading = data.key !== queryKey;

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Manage Orders</h2>

      <div className="mb-3" style={{ maxWidth: "220px" }}>
        <select
          className="form-select form-select-sm"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {error && <ErrorMessage message={error} onRetry={refresh} />}
      {actionError && <ErrorMessage message={actionError} />}

      {loading ? (
        <LoadingSpinner message="Loading orders…" />
      ) : orders.length === 0 ? (
        <EmptyState icon="bi-bag" title="No orders found" description="No orders match this filter." />
      ) : (
        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>Order</th>
                <th>User ID</th>
                <th>Placed</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th className="text-end">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const nextOptions = NEXT_STATUSES[order.status] || [];
                return (
                  <tr key={order.id}>
                    <td className="small fw-medium">#{order.id}</td>
                    <td className="small">{order.userId}</td>
                    <td className="small">{new Date(order.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="small fw-semibold">₹{Number(order.cost).toFixed(2)}</td>
                    <td className="small">{order.paymentStatus}</td>
                    <td><OrderStatusBadge status={order.status} /></td>
                    <td className="text-end">
                      {nextOptions.length > 0 ? (
                        <select
                          className="form-select form-select-sm d-inline-block"
                          style={{ width: "160px" }}
                          value=""
                          disabled={updatingId === order.id}
                          onChange={(e) => handleStatusChange(order, e.target.value)}
                        >
                          <option value="">Change to…</option>
                          {nextOptions.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-muted small">No actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <nav className="mt-3" aria-label="Order pagination">
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