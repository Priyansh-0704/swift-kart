import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { api } from "../api/api";
import { useAuth } from "../context/useAuth";
import { useCart } from "../context/useCart";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { addToCart, actionLoading } = useCart();

  const [data, setData] = useState({ id: null, product: null, error: "" });
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  useEffect(() => {
    let active = true;
    api.get(`/products/${id}`)
      .then((res) => {
        if (active) {
          setData({ id, product: res.product, error: "" });
          setImageError(false);
          setQuantity(1);
          setFeedback(null);
        }
      })
      .catch((err) => {
        if (active) {
          setData({
            id,
            product: null,
            error: err.status === 404 ? "Product not found." : err.message || "Failed to load product.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  const loading = data.id !== id && !data.error;
  const product = data.product;
  const error = data.error;
  const isAdding = Boolean(product && actionLoading[product.id]);

  if (loading) {
    return <LoadingSpinner message="Loading product details…" />;
  }

  if (error) {
    return (
      <div className="container py-5">
        <ErrorMessage message={error} />
        <Link to="/products" className="btn btn-outline-dark btn-sm">
          &larr; Back to Catalog
        </Link>
      </div>
    );
  }

  if (!product) return null;

  const unavailable = product.status === "Unavailable";
  const hasDiscount = Number(product.discount) > 0;

  async function handleAddToCart(e) {
    e.preventDefault();
    if (unavailable || isAdding) return;

    if (!user) {
      navigate("/login", { state: { from: location } });
      return;
    }

    setFeedback(null);
    try {
      await addToCart(product.id, quantity);
      setFeedback({ type: "success", message: `Added ${quantity} item${quantity > 1 ? "s" : ""} to your cart.` });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Could not add to cart." });
    }
  }

  function handleQuantityChange(delta) {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > 20) return 20;
      return next;
    });
  }

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb" className="mb-3">
        <ol className="breadcrumb small mb-0">
          <li className="breadcrumb-item">
            <Link to="/" className="text-decoration-none">Home</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/products" className="text-decoration-none">Products</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="row g-4 mt-1">
        {/* Product Image */}
        <div className="col-12 col-md-5">
          <div className="bg-light d-flex align-items-center justify-content-center rounded border p-3" style={{ minHeight: "340px" }}>
            {product.imageUrl && !imageError ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="img-fluid"
                style={{ maxHeight: "360px", objectFit: "contain" }}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="text-center text-secondary py-5">
                <i className="bi bi-image" style={{ fontSize: "4.5rem" }}></i>
                <p className="small mb-0 mt-2 text-muted">No image available</p>
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="col-12 col-md-7">
          <div className="d-flex align-items-center gap-2 mb-2">
            {unavailable ? (
              <span className="badge bg-secondary">Currently Unavailable</span>
            ) : (
              <span className="badge bg-success">In Stock</span>
            )}
            {hasDiscount && !unavailable && (
              <span className="badge bg-danger">
                {Number(product.discount).toFixed(0)}% OFF
              </span>
            )}
          </div>

          <h3 className="fw-bold mb-2">{product.name}</h3>

          {/* Pricing */}
          <div className="mb-3">
            {hasDiscount ? (
              <div className="d-flex align-items-baseline gap-2">
                <span className="fs-3 fw-bold text-dark">
                  ₹{Number(product.finalPrice).toFixed(2)}
                </span>
                <span className="fs-5 text-muted text-decoration-line-through">
                  ₹{Number(product.price).toFixed(2)}
                </span>
                <span className="text-success small fw-medium">
                  Save ₹{(Number(product.price) - Number(product.finalPrice)).toFixed(2)}
                </span>
              </div>
            ) : (
              <span className="fs-3 fw-bold text-dark">
                ₹{Number(product.price).toFixed(2)}
              </span>
            )}
          </div>

          <hr />

          {/* Description */}
          <div className="mb-4">
            <h6 className="fw-semibold text-secondary text-uppercase small">Description</h6>
            <p className="text-muted" style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
              {product.description || "No description provided for this product."}
            </p>
          </div>

          {feedback && (
            <div
              className={`alert ${feedback.type === "success" ? "alert-success" : "alert-danger"} py-2 mb-3`}
              role="alert"
            >
              {feedback.message}
            </div>
          )}

          {/* Cart Actions */}
          {!unavailable && (
            <div className="card p-3 bg-light border-0 mb-3">
              <div className="d-flex flex-wrap align-items-center gap-3">
                <div className="d-flex align-items-center">
                  <span className="me-2 small fw-semibold text-secondary">Qty:</span>
                  <div className="input-group input-group-sm" style={{ width: "120px" }}>
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1 || isAdding}
                    >
                      <i className="bi bi-dash"></i>
                    </button>
                    <input
                      type="text"
                      className="form-control text-center bg-white"
                      value={quantity}
                      readOnly
                      aria-label="Quantity"
                    />
                    <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= 20 || isAdding}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  </div>
                </div>

                <button
                  className="btn btn-dark d-flex align-items-center gap-2 px-4"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  type="button"
                >
                  {isAdding ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Adding to Cart…</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cart-plus"></i>
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
              <small className="text-muted mt-2 d-block">
                Maximum 20 units per order
              </small>
            </div>
          )}

          <div className="pt-2">
            <Link to="/products" className="btn btn-link text-decoration-none p-0 text-muted small">
              &larr; Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
