import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

export default function HomePage() {
  const [data, setData] = useState({ products: [], loading: true, error: "" });

  useEffect(() => {
    let active = true;
    api.get("/products?limit=4")
      .then((res) => {
        if (active) {
          setData({
            products: Array.isArray(res.products) ? res.products : [],
            loading: false,
            error: "",
          });
        }
      })
      .catch((err) => {
        if (active) {
          setData({
            products: [],
            loading: false,
            error: err.message || "Failed to load featured products.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function handleRetry() {
    setData((prev) => ({ ...prev, loading: true, error: "" }));
    api.get("/products?limit=4")
      .then((res) => {
        setData({
          products: Array.isArray(res.products) ? res.products : [],
          loading: false,
          error: "",
        });
      })
      .catch((err) => {
        setData({
          products: [],
          loading: false,
          error: err.message || "Failed to load featured products.",
        });
      });
  }

  return (
    <div className="container py-4">
      {/* Storefront Intro Section */}
      <section className="p-4 p-md-5 mb-4 bg-light rounded-3 border">
        <div className="container-fluid py-2">
          <h1 className="display-6 fw-bold text-dark">Welcome to SwiftKart</h1>
          <p className="col-md-9 fs-6 text-muted mb-4">
            A straightforward, reliable shopping platform. Browse our curated selection of
            available products with clear pricing, direct cart management, and seamless order handling.
          </p>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/products" className="btn btn-dark btn-md">
              <i className="bi bi-grid me-2"></i>Browse All Products
            </Link>
            <Link to="/cart" className="btn btn-outline-secondary btn-md">
              <i className="bi bi-cart3 me-2"></i>View Cart
            </Link>
          </div>
        </div>
      </section>

      {/* Featured / Recently Added Products Section */}
      <section className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h4 className="fw-bold mb-0">Featured Products</h4>
            <p className="text-muted small mb-0">Recently added items to our store catalog</p>
          </div>
          <Link to="/products" className="btn btn-outline-dark btn-sm">
            View All <i className="bi bi-arrow-right ms-1"></i>
          </Link>
        </div>

        {data.loading && <LoadingSpinner message="Loading products…" />}

        {!data.loading && data.error && (
          <ErrorMessage message={data.error} onRetry={handleRetry} />
        )}

        {!data.loading && !data.error && data.products.length === 0 && (
          <EmptyState
            icon="bi-box-seam"
            title="No products available"
            description="Check back soon for new arrivals."
            actionLabel="Refresh Catalog"
            onAction={handleRetry}
          />
        )}

        {!data.loading && !data.error && data.products.length > 0 && (
          <div className="row g-3">
            {data.products.map((product) => (
              <div key={product.id} className="col-6 col-md-4 col-lg-3">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
