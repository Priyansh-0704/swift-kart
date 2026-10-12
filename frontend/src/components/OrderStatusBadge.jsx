const STATUS_STYLES = {
  Pending: "bg-warning text-dark",
  Shipped: "bg-info text-dark",
  Delivered: "bg-success",
  Cancelled: "bg-secondary",
};

export default function OrderStatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || "bg-secondary";
  return <span className={`badge ${cls}`}>{status}</span>;
}