import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/api";
import LoadingSpinner from "../../components/LoadingSpinner";
import ErrorMessage from "../../components/ErrorMessage";
import EmptyState from "../../components/EmptyState";
import ProductForm from "../../components/admin/ProductForm";

export default function AdminProductsPage() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [reloadCount, setReloadCount] = useState(0);
    const queryKey = `${page}:${search}:${reloadCount}`;
    const [data, setData] = useState({ key: null, products: [], pagination: null, error: "" });

    const [mode, setMode] = useState(null); // null | "add" | product object
    const [toggling, setToggling] = useState(null);
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        let active = true;
        const params = new URLSearchParams({ page: String(page), limit: "10" });
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
                if (active) setData({ key: queryKey, products: [], pagination: null, error: err.message || "Failed to load products." });
            });

        return () => {
            active = false;
        };
    }, [page, search, reloadCount, queryKey]);

    const refresh = useCallback(() => setReloadCount((c) => c + 1), []);

    function handleSearch(e) {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    }

    async function handleToggleAvailability(product) {
        setToggling(product.id);
        setActionError("");
        try {
            await api.patch(`/products/${product.id}/availability`);
            refresh();
        } catch (err) {
            setActionError(err.message || "Failed to update product availability.");
        } finally {
            setToggling(null);
        }
    }

    function handleFormDone() {
        setMode(null);
        refresh();
    }

    const { products, pagination, error } = data;
    const loading = data.key !== queryKey;

    return (
        <div className="container py-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                <div>
                    <h2 className="fw-bold mb-1">Manage Products</h2>
                    <p className="text-muted small mb-0">Create, edit, and control availability of catalog items</p>
                </div>
                {!mode && (
                    <button className="btn btn-dark btn-sm d-flex align-items-center gap-1" onClick={() => setMode("add")}>
                        <i className="bi bi-plus-lg"></i>
                        <span>New Product</span>
                    </button>
                )}
            </div>

            {mode && (
                <ProductForm
                    product={mode === "add" ? null : mode}
                    onDone={handleFormDone}
                    onCancel={() => setMode(null)}
                />
            )}

            {error && <ErrorMessage message={error} onRetry={refresh} />}
            {actionError && <ErrorMessage message={actionError} />}

            {!mode && (
                <form onSubmit={handleSearch} className="d-flex mb-3" style={{ maxWidth: "400px" }}>
                    <div className="input-group">
                        <input
                            className="form-control"
                            placeholder="Search products by name…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <button className="btn btn-dark" type="submit">
                            <i className="bi bi-search"></i>
                        </button>
                    </div>
                </form>
            )}

            {loading ? (
                <LoadingSpinner message="Loading products…" />
            ) : products.length === 0 ? (
                <EmptyState icon="bi-box-seam" title="No products found" description="Create your first product to populate the catalog." />
            ) : (
                <div className="table-responsive">
                    <table className="table align-middle">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Discount</th>
                                <th>Final Price</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="bg-light rounded border d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "44px", height: "44px" }}>
                                                {p.imageUrl ? (
                                                    <img src={p.imageUrl} alt={p.name} style={{ maxWidth: "40px", maxHeight: "40px", objectFit: "contain" }} />
                                                ) : (
                                                    <i className="bi bi-image text-secondary"></i>
                                                )}
                                            </div>
                                            <span className="fw-medium small">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="small">₹{Number(p.price).toFixed(2)}</td>
                                    <td className="small">{Number(p.discount) > 0 ? `${Number(p.discount)}%` : "-"}</td>
                                    <td className="small fw-semibold">₹{Number(p.finalPrice).toFixed(2)}</td>
                                    <td>
                                        <span className={`badge ${p.status === "Available" ? "bg-success" : "bg-secondary"}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="text-end">
                                        <div className="btn-group btn-group-sm">
                                            <button className="btn btn-outline-secondary" onClick={() => setMode(p)} disabled={Boolean(mode)}>
                                                <i className="bi bi-pencil"></i>
                                            </button>
                                            <button
                                                className="btn btn-outline-secondary"
                                                onClick={() => handleToggleAvailability(p)}
                                                disabled={Boolean(mode) || toggling === p.id}
                                                title={p.status === "Available" ? "Mark unavailable" : "Mark available"}
                                            >
                                                {toggling === p.id ? (
                                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                                ) : (
                                                    <i className={`bi ${p.status === "Available" ? "bi-eye-slash" : "bi-eye"}`}></i>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {pagination && pagination.totalPages > 1 && (
                <nav className="mt-3" aria-label="Product pagination">
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