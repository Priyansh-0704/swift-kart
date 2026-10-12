import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../api/api";
import { useAuth } from "./useAuth";
import CartContext from "./cartContextValue";

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchCart = useCallback(async () => {
    if (!localStorage.getItem("token")) {
      setCart({ items: [], total: 0 });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/cart");
      setCart({
        items: Array.isArray(data.items) ? data.items : [],
        total: typeof data.total === "number" ? data.total : 0,
      });
    } catch (err) {
      setError(err.message || "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (user) {
      api.get("/cart")
        .then((data) => {
          if (active) {
            setCart({
              items: Array.isArray(data.items) ? data.items : [],
              total: typeof data.total === "number" ? data.total : 0,
            });
          }
        })
        .catch((err) => {
          if (active) setError(err.message || "Failed to load cart.");
        });
    } else {
      Promise.resolve().then(() => {
        if (active) {
          setCart({ items: [], total: 0 });
          setError("");
        }
      });
    }
    return () => {
      active = false;
    };
  }, [user, refreshTrigger]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    setActionLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const data = await api.post("/cart", { productId: Number(productId), quantity: Number(quantity) });
      setRefreshTrigger((t) => t + 1);
      return data;
    } finally {
      setActionLoading((prev) => ({ ...prev, [productId]: false }));
    }
  }, []);

  const updateQuantity = useCallback(async (productId, quantity) => {
    setActionLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const data = await api.put(`/cart/${productId}`, { quantity: Number(quantity) });
      setRefreshTrigger((t) => t + 1);
      return data;
    } finally {
      setActionLoading((prev) => ({ ...prev, [productId]: false }));
    }
  }, []);

  const removeFromCart = useCallback(async (productId) => {
    setActionLoading((prev) => ({ ...prev, [productId]: true }));
    try {
      const data = await api.delete(`/cart/${productId}`);
      setRefreshTrigger((t) => t + 1);
      return data;
    } finally {
      setActionLoading((prev) => ({ ...prev, [productId]: false }));
    }
  }, []);

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.delete("/cart");
      setCart({ items: [], total: 0 });
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const itemCount = useMemo(() => {
    return (cart.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [cart.items]);

  const value = useMemo(() => ({
    cart,
    itemCount,
    loading,
    error,
    actionLoading,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  }), [cart, itemCount, loading, error, actionLoading, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}