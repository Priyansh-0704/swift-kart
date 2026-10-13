import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/useCart";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

function CartItemRow({ item, onUpdateQuantity, onRemove, disabled }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="card mb-3 border shadow-sm">
      <div className="card-body p-3">
        <div className="row align-items-center g-3">
          {/* Thumbnail */}
          <div className="col-3 col-sm-2">
            <Link to={`/products/${item.productId}`}>
              <div
                className="bg-light rounded d-flex align-items-center justify-content-center overflow-hidden border"
                style={{ height: "70px", width: "100%" }}
              >
                {item.imageUrl && !imageError ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="img-fluid"
                    style={{ maxHeight: "65px", objectFit: "contain" }}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <i className="bi bi-image text-secondary" style={{ fontSize: "1.5rem" }}></i>
                )}
              </div>
            </Link>
          </div>

          {/* Details */}
          <div className="col-9 col-sm-4">
            <Link
              to={`/products/${item.productId}`}
              className="text-decoration-none text-dark fw-semibold small d-block mb-1 text-truncate"
              title={item.name}
            >
              {item.name}
            </Link>
            <div className="small text-muted">
              Unit Price: <span className="fw-medium text-dark">₹{Number(item.price).toFixed(2)}</span>
            </div>
            {item.status === "Unavailable" && (
              <span className="badge bg-secondary mt-1">Currently Unavailable</span>
            )}
          </div>

          {/* Quantity Controls */}
          <div className="col-6 col-sm-3">
            <div className="input-group input-group-sm" style={{ maxWidth: "120px" }}>
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                disabled={disabled}
                aria-label="Decrease quantity"
              >
                <i className="bi bi-dash"></i>
              </button>
              <input
                type="text"
                className="form-control text-center bg-white"
                value={item.quantity}
                readOnly
                aria-label="Quantity"
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                disabled={disabled || item.quantity >= 20}
                aria-label="Increase quantity"
              >
                <i className="bi bi-plus"></i>
              </button>
            </div>
            {item.quantity >= 20 && (
              <small className="text-muted d-block mt-1" style={{ fontSize: "0.75rem" }}>
                Max 20 reached
              </small>
            )}
          </div>

          {/* Line Total & Remove */}
          <div className="col-6 col-sm-3 text-end d-flex align-items-center justify-content-end gap-3">
            <div>
              <span className="fw-bold fs-6 d-block">
                ₹{Number(item.lineTotal).toFixed(2)}
              </span>
            </div>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={() => onRemove(item.productId)}
              disabled={disabled}
              title="Remove item"
              type="button"
            >
              <i className="bi bi-trash3"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const {
    cart,
    itemCount,
    loading,
    error,
    actionLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
    fetchCart,
  } = useCart();

  const navigate = useNavigate();

  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [operationError, setOperationError] = useState("");

  const items = cart.items || [];

  async function handleUpdateQuantity(productId, newQty) {
    setOperationError("");
    if (newQty < 1) {
      setConfirmRemoveId(productId);
      return;
    }
    if (newQty > 20) {
      setOperationError("Maximum quantity allowed per product is 20.");
      return;
    }
    try {
      await updateQuantity(productId, newQty);
    } catch (err) {
      setOperationError(err.message || "Failed to update item quantity.");
    }
  }

  async function handleConfirmRemove() {
    if (!confirmRemoveId) return;
    setOperationError("");
    try {
      await removeFromCart(confirmRemoveId);
      setConfirmRemoveId(null);
    } catch (err) {
      setOperationError(err.message || "Failed to remove item.");
    }
  }

  async function handleConfirmClear() {
    setOperationError("");
    try {
      await clearCart();
      setConfirmClear(false);
    } catch (err) {
      setOperationError(err.message || "Failed to clear cart.");
    }
  }

  if (loading && items.length === 0) {
    return <LoadingSpinner message="Loading your shopping cart…" />;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Your Shopping Cart</h2>
          <p className="text-muted small mb-0">
            {itemCount > 0
              ? `You have ${itemCount} item${itemCount > 1 ? "s" : ""} in your cart`
              : "Review your selected items"}
          </p>
        </div>

        {items.length > 0 && (
          <button
            className="btn btn-outline-danger btn-sm"
            onClick={() => setConfirmClear(true)}
            type="button"
          >
            <i className="bi bi-trash3 me-1"></i>Clear Cart
          </button>
        )}
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchCart} />}
      {operationError && <ErrorMessage message={operationError} />}

      {/* Confirmation Modal for Item Deletion */}
      {confirmRemoveId && (
        <div className="alert alert-warning border d-flex flex-wrap align-items-center justify-content-between mb-3 py-2 px-3">
          <span className="small">Remove this item from your cart?</span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-danger btn-sm"
              onClick={handleConfirmRemove}
              disabled={Boolean(actionLoading[confirmRemoveId])}
            >
              Yes, Remove
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setConfirmRemoveId(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing Cart */}
      {confirmClear && (
        <div className="alert alert-warning border d-flex flex-wrap align-items-center justify-content-between mb-3 py-2 px-3">
          <span className="small">Are you sure you want to remove all items from your cart?</span>
          <div className="d-flex gap-2">
            <button
              className="btn btn-danger btn-sm"
              onClick={handleConfirmClear}
            >
              Yes, Clear All
            </button>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setConfirmClear(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon="bi-cart-x"
          title="Your cart is empty"
          description="Looks like you haven't added any products to your shopping cart yet."
          actionLabel="Start Shopping"
          actionLink="/products"
        />
      ) : (
        <div className="row g-4">
          {/* Cart Items List */}
          <div className="col-12 col-lg-8">
            {items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={(id) => setConfirmRemoveId(id)}
                disabled={Boolean(actionLoading[item.productId])}
              />
            ))}

            <div className="mt-3">
              <Link to="/products" className="btn btn-link text-decoration-none p-0 text-muted small">
                &larr; Continue shopping
              </Link>
            </div>
          </div>

          {/* Cart Order Summary */}
          <div className="col-12 col-lg-4">
            <div className="card border shadow-sm p-3">
              <h5 className="fw-bold mb-3">Order Summary</h5>

              <div className="d-flex justify-content-between text-muted mb-2 small">
                <span>Items Subtotal ({itemCount})</span>
                <span>₹{Number(cart.total).toFixed(2)}</span>
              </div>

              <div className="d-flex justify-content-between text-muted mb-3 small">
                <span>Estimated Shipping</span>
                <span className="text-success fw-medium">Free</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
                <span>Total Amount</span>
                <span>₹{Number(cart.total).toFixed(2)}</span>
              </div>

              <button className="btn btn-accent w-100 py-2 d-flex align-items-center justify-content-center gap-2 mb-2" type="button" onClick={() => navigate("/checkout")} disabled={items.some((item) => item.status === "Unavailable")}>
                <span>Proceed to Checkout</span>
                <i className="bi bi-arrow-right"></i>
              </button>

              {items.some((item) => item.status === "Unavailable") && (
                <div className="alert alert-warning py-2 px-3 small text-center mb-0 mt-2">
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Remove unavailable items before checking out.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}