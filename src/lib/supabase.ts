import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://aouemjawqprkbnyavuaq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvdWVtamF3cXBya2JueWF2dWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzM3NzgsImV4cCI6MjEwMDIwOTc3OH0.tV2d5QRaJVBlnR39d3om2OY_oFzDi4JLTRIS8fC24eg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: "okdx-auth" },
});

export type ProductRow = {
  id: string;
  category: string;
  name: string;
  price: number;
  sale_price: number | null;
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
  promo_code: string | null;
};

export type PromoDiscountType = "percent" | "sale_price";
export type PromoCodeRow = {
  id: string;
  code: string;
  is_active: boolean;
  discount_type: PromoDiscountType;
  discount_percent: number | null;
  created_at?: string;
};

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
