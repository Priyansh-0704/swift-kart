import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import OrderStatusBadge from "../components/OrderStatusBadge";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState({ id: null, order: null, error: "" });
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    let active = true;
    api.get(`/orders/${id}`)
      .then((res) => {
        if (active) setData({ id, order: res.order, error: "" });
      })
      .catch((err) => {
        if (active) {
          setData({
            id,
            order: null,
            error: err.status === 404 ? "Order not found." : err.message || "Failed to load order.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  const loading = data.id !== id && !data.error;
  const { order, error } = data;

  async function handleCancel() {
    setCanceling(true);
    try {
      await api.patch(`/orders/${id}/cancel`);
      setData((prev) => ({ ...prev, order: { ...prev.order, status: "Cancelled" } }));
    } catch (err) {
      setData((prev) => ({ ...prev, error: err.message || "Failed to cancel order." }));
    } finally {
      setCanceling(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading order details…" />;
  }

  if (error) {
    return (
      <div className="container py-5">
        <ErrorMessage message={error} />
        <Link to="/orders" className="btn btn-outline-dark btn-sm">&larr; Back to Orders</Link>
      </div>
    );
  }

  if (!order) return null;

  const items = order.OrderItems || [];

  return (
    <div className="container py-4">
      <button className="btn btn-link text-decoration-none p-0 text-muted small mb-3" onClick={() => navigate("/orders")}>
        &larr; Back to Orders
      </button>

      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Order #{order.id}</h2>
          <div className="text-muted small">
            Placed on {new Date(order.createdAt).toLocaleString("en-IN")}
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card border shadow-sm mb-4">
            <div className="card-header bg-light py-3">
              <h5 className="mb-0 fw-semibold">Items</h5>
            </div>
            <ul className="list-group list-group-flush">
              {items.map((oi) => (
                <li key={oi.id} className="list-group-item d-flex align-items-center gap-3 px-3">
                  <div
                    className="bg-light rounded d-flex align-items-center justify-content-center overflow-hidden border flex-shrink-0"
                    style={{ height: "56px", width: "56px" }}
                  >
                    {oi.Product?.imageUrl ? (
                      <img src={oi.Product.imageUrl} alt={oi.Product.name} className="img-fluid" style={{ maxHeight: "50px", objectFit: "contain" }} />
                    ) : (
                      <i className="bi bi-image text-secondary"></i>
                    )}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-medium small">{oi.Product?.name || "Product no longer listed"}</div>
                    <div className="text-muted small">Qty {oi.quantity} × ₹{Number(oi.priceAtPurchase).toFixed(2)}</div>
                  </div>
                  <span className="fw-semibold">₹{(Number(oi.priceAtPurchase) * oi.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card border shadow-sm">
            <div className="card-header bg-light py-3">
              <h5 className="mb-0 fw-semibold">Shipping Address</h5>
            </div>
            <div className="card-body p-3 small text-muted">
              {order.shippingAddress}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card border shadow-sm p-3">
            <h5 className="fw-bold mb-3">Order Summary</h5>
            <div className="d-flex justify-content-between text-muted mb-2 small">
              <span>Order Total</span>
              <span>₹{Number(order.cost).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between text-muted mb-2 small">
              <span>Payment Status</span>
              <span>{order.paymentStatus}</span>
            </div>
            {order.razorpayPaymentId && (
              <div className="d-flex justify-content-between text-muted mb-2 small">
                <span>Payment ID</span>
                <span className="text-truncate" style={{ maxWidth: "160px" }}>{order.razorpayPaymentId}</span>
              </div>
            )}
            <hr />
            <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
              <span>Total</span>
              <span>₹{Number(order.cost).toFixed(2)}</span>
            </div>

            {order.status === "Pending" && (
              <button className="btn btn-outline-danger w-100" onClick={handleCancel} disabled={canceling}>
                {canceling ? "Cancelling…" : "Cancel Order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}