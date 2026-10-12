import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api/api";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

  const [prevSearch, setPrevSearch] = useState(search);
  const [searchInput, setSearchInput] = useState(search);

  // Sync search input if URL changes externally
  if (search !== prevSearch) {
    setPrevSearch(search);
    setSearchInput(search);
  }

  const queryKey = `${page}:${search}`;
  const [data, setData] = useState({
    key: null,
    products: [],
    pagination: null,
    error: "",
  });

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), limit: "12" });
    if (search) params.set("search", search);

    api.get(`/products?${params.toString()}`)
      .then((res) => {
        if (active) {
          setData({
            key: queryKey,
            products: Array.isArray(res.products) ? res.products : [],
            pagination: res.pagination || null,
            error: "",
          });
        }
      })
      .catch((err) => {
        if (active) {
          setData({
            key: queryKey,
            products: [],
            pagination: null,
            error: err.message || "Failed to load products.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [page, search, queryKey]);

  const loading = data.key !== queryKey && !data.error;
  const products = data.products;
  const pagination = data.pagination;
  const error = data.error;

  function handleSearch(e) {
    e.preventDefault();
    const trimmed = searchInput.trim();
    const next = new URLSearchParams();
    if (trimmed) next.set("search", trimmed);
    next.set("page", "1");
    setSearchParams(next);
  }

  function handleClearSearch() {
    setSearchInput("");
    setSearchParams({});
  }

  function goToPage(p) {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p));
    setSearchParams(next);
  }

  function handleRetry() {
    setData((prev) => ({ ...prev, key: null, error: "" }));
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Product Catalog</h2>
          <p className="text-muted small mb-0">Browse our complete collection of available items</p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="d-flex" style={{ maxWidth: "400px", width: "100%" }}>
          <div className="input-group">
            <input
              className="form-control"
              placeholder="Search products by name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search products"
            />
            {search && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClearSearch}
                title="Clear search"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
            <button className="btn btn-dark" type="submit">
              <i className="bi bi-search"></i>
            </button>
          </div>
        </form>
      </div>

      {search && (
        <div className="d-flex align-items-center justify-content-between alert alert-light border py-2 px-3 mb-3">
          <span className="small text-muted">
            Showing results for <strong>&ldquo;{search}&rdquo;</strong>
          </span>
          <button
            type="button"
            className="btn btn-link btn-sm text-decoration-none p-0"
            onClick={handleClearSearch}
          >
            Clear Filter
          </button>
        </div>
      )}

      {loading && <LoadingSpinner message="Loading catalog…" />}

      {!loading && error && (
        <ErrorMessage message={error} onRetry={handleRetry} />
      )}

      {!loading && !error && products.length === 0 && (
        <EmptyState
          icon="bi-search"
          title="No products found"
          description={
            search
              ? `No products matched your search for "${search}". Try different keywords.`
              : "There are currently no products in the catalog."
          }
          actionLabel={search ? "Clear Search" : undefined}
          onAction={search ? handleClearSearch : undefined}
        />
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <div className="row g-3">
            {products.map((product) => (
              <div key={product.id} className="col-6 col-md-4 col-lg-3">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <nav className="mt-4" aria-label="Catalog pagination">
              <ul className="pagination pagination-sm justify-content-center">
                <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    aria-label="Previous page"
                  >
                    &laquo; Previous
                  </button>
                </li>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <li key={p} className={`page-item ${p === page ? "active" : ""}`}>
                    <button className="page-link" onClick={() => goToPage(p)}>
                      {p}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${page >= pagination.totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= pagination.totalPages}
                    aria-label="Next page"
                  >
                    Next &raquo;
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
