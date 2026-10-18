export const brl = (value) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value) || 0,
  );
export function safeReturn(value) {
  return typeof value === "string" &&
    /^\/(?!\/)[^\\]*$/.test(value) &&
    !value.startsWith("/auth/") &&
    !value.startsWith("/marketplace/auth/")
    ? value
    : "/";
}
export function safeImage(value) {
  if (!value) return "";
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}
export function contactLink(number, message = "") {
  let n = String(number).replace(/\D/g, "");
  if (n.length === 10 || n.length === 11) n = "55" + n;
  return /^\d{10,15}$/.test(n)
    ? `https://wa.me/${n}?text=${encodeURIComponent(message)}`
    : "";
}
export function subtotal(item) {
  const p = item.product,
    q = item.quantity;
  const tier =
    p.sale_mode !== "COMBO" && p.price_tiers?.find((t) => t.quantity === q);
  const amount = p.sale_mode === "KG" ? p.average_weight * q : q;
  const option =
    p.sale_mode === "COMBO"
      ? null
      : p.options?.find((o) => o.id === item.option_id) || p.options?.[0];
  const fee =
    Number(option?.fee_per_kg || 0) +
    (option?.id === "ticado"
      ? Number(p.options?.find((o) => o.id === "escamado")?.fee_per_kg || 0)
      : 0);
  const cents = (value) => Math.round((value + Number.EPSILON) * 100);
  return (
    (cents(tier ? tier.total_price : p.price * amount) + cents(fee * amount)) /
    100
  );
}
export function validCart(items) {
  return (
    Array.isArray(items) &&
    items.length <= 100 &&
    items.every(
      (i) =>
        typeof i.key === "string" &&
        typeof i.business_slug === "string" &&
        i.product &&
        typeof i.product.id === "string" &&
        typeof i.product.name === "string" &&
        ["KG", "UNIT", "COMBO"].includes(i.product.sale_mode) &&
        Number.isFinite(i.product.average_weight) &&
        i.product.average_weight > 0 &&
        Array.isArray(i.product.options) &&
        Array.isArray(i.product.price_tiers) &&
        typeof i.option_id === "string" &&
        Number.isFinite(i.product.price) &&
        i.product.price >= 0 &&
        Number.isInteger(i.quantity) &&
        i.quantity >= 1 &&
        i.quantity <= 999 &&
        typeof i.notes === "string" &&
        i.notes.length <= 500,
    )
  );
}
export function readCart(storage, key) {
  try {
    const data = JSON.parse(storage.getItem(key) || "[]");
    return validCart(data) ? data : [];
  } catch {
    return [];
  }
}
export function distanceLabel(value) {
  return value == null
    ? ""
    : value < 1
      ? `${Math.round(value * 1000)} m`
      : `${Number(value).toFixed(1).replace(".", ",")} km`;
}
export const orderStatus = {
  PENDING_REVIEW: "Recebido",
  WAITING_CUSTOMER_CONFIRMATION: "Aguardando confirmação",
  WAITING_PAYMENT: "Aguardando pagamento",
  PAID: "Pagamento confirmado",
  SEPARATING: "Em preparo",
  READY_FOR_PICKUP: "Pronto para retirada",
  OUT_FOR_DELIVERY: "Saiu para entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
};
export const verificationStatus = {
  DRAFT: "Rascunho",
  PENDING: "Em análise",
  VERIFIED: "Verificado",
  REJECTED: "Reprovado",
  SUSPENDED: "Suspenso",
};
