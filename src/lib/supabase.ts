import { createClient } from "@supabase/supabase-js";

// Values come from build-time env vars (GitHub Actions secrets → VITE_*).
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

export const SUPABASE_CONFIGURED = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;

export const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder",
  { auth: { persistSession: true, autoRefreshToken: true, storageKey: "okdx-auth" } },
);

// Columns visitors are allowed to read (price is admin-only).
export const PUBLIC_PRODUCT_COLS = "id,category,name,sizes,images,description,variant_label,variants,created_at";

export type ProductRow = {
  id: string;
  category: string;
  name: string;
  price?: number;
  sizes: string[];
  images: string[];
  description: string;
  variant_label: string | null;
  variants: string[] | null;
  created_at?: string;
};

export type CartItemPersisted = {
  productId: string;
  name: string;
  price: number;
  qty: number;
  size?: string;
  variant?: string;
  image?: string;
};

export type OrderRow = {
  id: string;
  created_at: string;
  client_name: string;
  client_contact: string;
  items: CartItemPersisted[];
  total_price: number;
  status: OrderStatus;
  packaging: PackagingType | null;
};

// Compact storage format for order items: {p:id, q:qty, s?:size, v?:variant, n?:name, r?:price}
export type CompactItem = { p: string; q: number; s?: string; v?: string; n?: string; r?: number };

export function encodeItem(i: Partial<CartItemPersisted> & { productId: string; qty: number }): CompactItem {
  const o: CompactItem = { p: i.productId, q: i.qty };
  if (i.size) o.s = i.size;
  if (i.variant) o.v = i.variant;
  if (i.name) o.n = i.name;
  if (i.price != null) o.r = Number(i.price);
  return o;
}

export function decodeItem(c: CompactItem | CartItemPersisted): CartItemPersisted {
  if ("productId" in c) return c; // legacy format
  return { productId: c.p, qty: c.q, size: c.s, variant: c.v, name: c.n ?? "?", price: Number(c.r ?? 0) };
}

export function decodeOrder(row: Record<string, unknown>): OrderRow {
  const items = Array.isArray(row.items) ? (row.items as CompactItem[]).map(decodeItem) : [];
  return { ...(row as unknown as OrderRow), items, total_price: Number(row.total_price ?? 0) };
}

export const ORDER_STATUSES = ["Новый", "Связались", "Оплачен", "Собран", "Вручен"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PACKAGING_TYPES = ["Конверт", "Мелкий пакет", "Большой пакет"] as const;
export type PackagingType = (typeof PACKAGING_TYPES)[number];

export const statusColors: Record<string, string> = {
  Новый: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Связались: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Оплачен: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Собран: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Вручен: "bg-green-500/20 text-green-400 border-green-500/30",
};

export const CURRENCY = "BYN";
export function formatMoney(n: number): string {
  return `${Number(n).toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${CURRENCY}`;
}
