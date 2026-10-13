import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import { loadRazorpayScript } from "../utils/razorpay";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, itemCount, fetchCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [addressId, setAddressId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");

  const items = cart.items || [];

  useEffect(() => {
    let active = true;
    api.get("/addresses")
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res.addresses) ? res.addresses : [];
        setAddresses(list);
        if (list.length > 0) setAddressId(list[0].id);
        setLoading(false);
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load addresses.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (!addressId) {
      setPlaceError("Please select a shipping address.");
      return;
    }

    setPlaceError("");
    setPlacing(true);

    try {
      const orderData = await api.post("/checkout/create-order", { addressId });
      await loadRazorpayScript();

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency,
        order_id: orderData.razorpayOrderId,
        name: "SwiftKart",
        description: "Order payment",
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
        },
        theme: { color: "#1C1A18" },
        handler: async (response) => {
          try {
            const result = await api.post("/checkout/verify", {
              addressId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await fetchCart();
            navigate(`/orders/${result.order.id}`, { replace: true });
          } catch (err) {
            setPlaceError(
              (err.message || "Payment was captured but the order could not be confirmed.") +
                " Keep this payment ID for support: " + response.razorpay_payment_id
            );
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => setPlacing(false),
        },
      });

      rzp.on("payment.failed", (resp) => {
        setPlaceError(resp.error?.description || "Payment failed. Please try again.");
        setPlacing(false);
      });

      rzp.open();
    } catch (err) {
      setPlaceError(err.message || "Failed to start checkout.");
      setPlacing(false);
    }
  }, [addressId, user, fetchCart, navigate]);

  if (loading) {
    return <LoadingSpinner message="Preparing checkout…" />;
  }

  if (items.length === 0) {
    return (
      <div className="container py-4">
        <EmptyState
          icon="bi-cart-x"
          title="Your cart is empty"
          description="Add items to your cart before checking out."
          actionLabel="Browse Products"
          actionLink="/products"
        />
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="fw-bold mb-4">Checkout</h2>

      {error && <ErrorMessage message={error} />}
      {placeError && <ErrorMessage message={placeError} />}

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <div className="card border shadow-sm mb-4">
            <div className="card-header bg-light py-3 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-semibold">Shipping Address</h5>
              <Link to="/addresses" className="small">Manage addresses</Link>
            </div>
            <div className="card-body p-3">
              {addresses.length === 0 ? (
                <EmptyState
                  icon="bi-geo-alt"
                  title="No saved addresses"
                  description="Add a shipping address to continue."
                  actionLabel="Add Address"
                  actionLink="/addresses"
                />
              ) : (
                <div className="row g-2">
                  {addresses.map((addr) => (
                    <div className="col-12" key={addr.id}>
                      <label
                        className={`d-flex gap-2 p-3 border rounded ${addressId === addr.id ? "border-dark" : ""}`}
                        style={{ cursor: "pointer" }}
                      >
                        <input
                          type="radio"
                          name="addressId"
                          className="form-check-input mt-1"
                          checked={addressId === addr.id}
                          onChange={() => setAddressId(addr.id)}
                        />
                        <div className="small">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="badge bg-secondary">{addr.label}</span>
                            <span className="fw-semibold">{addr.fullName}</span>
                          </div>
                          <div className="text-muted">
                            {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}
                            {addr.city}, {addr.state} - {addr.pincode}, {addr.country}
                          </div>
                          <div className="text-muted">
                            <i className="bi bi-telephone me-1"></i>{addr.phone}
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card border shadow-sm">
            <div className="card-header bg-light py-3">
              <h5 className="mb-0 fw-semibold">Order Items ({itemCount})</h5>
            </div>
            <ul className="list-group list-group-flush">
              {items.map((item) => (
                <li key={item.productId} className="list-group-item d-flex justify-content-between align-items-center px-3">
                  <div>
                    <div className="fw-medium small">{item.name}</div>
                    <div className="text-muted small">Qty {item.quantity} × ₹{Number(item.price).toFixed(2)}</div>
                  </div>
                  <span className="fw-semibold">₹{Number(item.lineTotal).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card border shadow-sm p-3">
            <h5 className="fw-bold mb-3">Order Summary</h5>
            <div className="d-flex justify-content-between text-muted mb-2 small">
              <span>Items Subtotal ({itemCount})</span>
              <span>₹{Number(cart.total).toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between text-muted mb-3 small">
              <span>Shipping</span>
              <span className="text-success fw-medium">Free</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
              <span>Total Payable</span>
              <span>₹{Number(cart.total).toFixed(2)}</span>
            </div>

            <button
              className="btn btn-accent w-100 py-2 d-flex align-items-center justify-content-center gap-2"
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing || !addressId}
            >
              {placing ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Processing…</span>
                </>
              ) : (
                <>
                  <i className="bi bi-lock-fill"></i>
                  <span>Pay ₹{Number(cart.total).toFixed(2)}</span>
                </>
              )}
            </button>

            <p className="text-muted small text-center mt-2 mb-0">
              Payments are securely processed by Razorpay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}