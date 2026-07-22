import { createClient } from "@supabase/supabase-js";

// Publishable anon key — safe for client bundles; RLS enforces access.
const SUPABASE_URL = "https://aouemjawqprkbnyavuaq.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvdWVtamF3cXBya2JueWF2dWFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MzM3NzgsImV4cCI6MjEwMDIwOTc3OH0.tV2d5QRaJVBlnR39d3om2OY_oFzDi4JLTRIS8fC24eg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "okdx-auth",
  },
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

export type OrderRow = {
  id: string;
  created_at: string;
  client_name: string;
  client_contact: string;
  delivery_address: string | null;
  items: CartItemPersisted[];
  total_price: number;
  status: string;
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

export type PromoCodeRow = {
  id: string;
  code: string;
  is_active: boolean;
  created_at?: string;
};

export const ORDER_STATUSES = ["Новый", "Оплачен", "Отправлен"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const statusColors: Record<string, string> = {
  Новый: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  Оплачен: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Отправлен: "bg-green-500/20 text-green-400 border-green-500/30",
};
