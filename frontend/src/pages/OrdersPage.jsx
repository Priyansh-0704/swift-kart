import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";
import OrderStatusBadge from "../components/OrderStatusBadge";

export default function OrdersPage() {
  const [data, setData] = useState({ orders: [], loading: true, error: "" });
  const [reloadCount, setReloadCount] = useState(0);
  const [cancelingId, setCancelingId] = useState(null);

  useEffect(() => {
    let active = true;
    api.get("/orders")
      .then((res) => {
        if (active) setData({ orders: Array.isArray(res.orders) ? res.orders : [], loading: false, error: "" });
      })
      .catch((err) => {
        if (active) setData({ orders: [], loading: false, error: err.message || "Failed to load orders." });
      });
    return () => {
      active = false;
    };
  }, [reloadCount]);

  const fetchOrders = useCallback(() => {
    setData((prev) => ({ ...prev, loading: true, error: "" }));
    setReloadCount((c) => c + 1);
  }, []);

  async function handleCancel(id) {
    setCancelingId(id);
    try {
      await api.patch(`/orders/${id}/cancel`);
      fetchOrders();
    } catch (err) {
      setData((prev) => ({ ...prev, error: err.message || "Failed to cancel order." }));
    } finally {
      setCancelingId(null);
    }
  }

  const { orders, loading, error } = data;

  if (loading) {
    return <LoadingSpinner message="Loading your orders…" />;
  }

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">My Orders</h2>

      {error && <ErrorMessage message={error} onRetry={fetchOrders} />}

      {!error && orders.length === 0 ? (
        <EmptyState
          icon="bi-bag"
          title="No orders yet"
          description="Your placed orders will show up here."
          actionLabel="Start Shopping"
          actionLink="/products"
        />
      ) : (
        <div className="d-flex flex-column gap-3">
          {orders.map((order) => {
            const itemCount = (order.OrderItems || []).reduce((sum, oi) => sum + oi.quantity, 0);
            return (
              <div key={order.id} className="card border shadow-sm">
                <div className="card-body p-3">
                  <div className="d-flex flex-wrap justify-content-between align-items-start gap-2">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <span className="fw-semibold">Order #{order.id}</span>
                        <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="text-muted small">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                        {" · "}{itemCount} item{itemCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold fs-5">₹{Number(order.cost).toFixed(2)}</div>
                      <div className="text-muted small">Payment: {order.paymentStatus}</div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-3">
                    {order.status === "Pending" && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleCancel(order.id)}
                        disabled={cancelingId === order.id}
                      >
                        {cancelingId === order.id ? "Cancelling…" : "Cancel Order"}
                      </button>
                    )}
                    <Link to={`/orders/${order.id}`} className="btn btn-outline-dark btn-sm">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}