import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";

export default function ProductCard({ product }) {
  const { user } = useAuth();
  const { addToCart, actionLoading } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [imageError, setImageError] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }

  const unavailable = product.status === "Unavailable";
  const hasDiscount = Number(product.discount) > 0;
  const isAdding = Boolean(actionLoading[product.id]);

  async function handleAddToCart(e) {
    e.preventDefault();
    e.stopPropagation();

    if (unavailable || isAdding) return;

    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setFeedback(null);
    try {
      await addToCart(product.id, 1);
      setFeedback({ type: "success", text: "Added to cart" });
      setTimeout(() => setFeedback(null), 2500);
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Could not add to cart" });
      setTimeout(() => setFeedback(null), 3500);
    }
  }

  return (
    <div className="card h-100 shadow-sm border-0 product-card">
      <Link to={`/products/${product.id}`} className="text-decoration-none text-dark d-block">
        <div className="product-img-wrap bg-light position-relative">
          {product.imageUrl && !imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="product-img"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          ) : (
            <div className="product-img-placeholder d-flex align-items-center justify-content-center text-secondary">
              <i className="bi bi-image" style={{ fontSize: "2.5rem" }}></i>
            </div>
          )}

          {unavailable && (
            <span className="badge bg-secondary position-absolute top-0 end-0 m-2">
              Unavailable
            </span>
          )}

          {hasDiscount && !unavailable && (
            <span className="badge bg-danger position-absolute top-0 start-0 m-2">
              {Number(product.discount).toFixed(0)}% OFF
            </span>
          )}
        </div>
      </Link>

      <div className="card-body p-3 d-flex flex-column">
        <Link
          to={`/products/${product.id}`}
          className="text-decoration-none text-dark fw-semibold product-name mb-2"
          title={product.name}
        >
          {product.name}
        </Link>

        <div className="mb-3">
          {hasDiscount ? (
            <div className="d-flex align-items-baseline gap-2">
              <span className="fw-bold fs-5 text-dark">
                ₹{Number(product.finalPrice).toFixed(2)}
              </span>
              <span className="text-muted text-decoration-line-through small">
                ₹{Number(product.price).toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="fw-bold fs-5 text-dark">
              ₹{Number(product.price).toFixed(2)}
            </span>
          )}
        </div>

        {feedback && (
          <div
            className={`alert ${feedback.type === "success" ? "alert-success" : "alert-danger"} py-1 px-2 small mb-2 text-center`}
            role="alert"
          >
            {feedback.text}
          </div>
        )}

        <div className="mt-auto d-grid gap-2">
          {unavailable ? (
            <button className="btn btn-secondary btn-sm" disabled>
              Out of Stock
            </button>
          ) : (
            <button
              className="btn btn-dark btn-sm d-flex align-items-center justify-content-center gap-1"
              onClick={handleAddToCart}
              disabled={isAdding}
              type="button"
            >
              {isAdding ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Adding…</span>
                </>
              ) : (
                <>
                  <i className="bi bi-cart-plus"></i>
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          )}

          <Link
            to={`/products/${product.id}`}
            className="btn btn-outline-secondary btn-sm"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}