import { supabase } from "./supabase";

async function collectBackup() {
  const [orders, products, promo] = await Promise.all([
    supabase.from("orders").select("*"),
    supabase.from("products").select("*"),
    supabase.from("promo_codes").select("*"),
  ]);
  return {
    created_at: new Date().toISOString(),
    orders: orders.data ?? [],
    products: products.data ?? [],
    promo_codes: promo.data ?? [],
  };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function manualBackupDownload(): Promise<void> {
  const data = await collectBackup();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup_${todayStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type BackupPayload = {
  created_at?: string;
  orders?: unknown[];
  products?: unknown[];
  promo_codes?: unknown[];
};

export type RestoreResult = {
  products: number;
  orders: number;
  promo_codes: number;
};

// Wipe existing tables and re-insert everything from the uploaded backup.
export async function restoreFromBackup(file: File): Promise<RestoreResult> {
  const text = await file.text();
  let payload: BackupPayload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error("Файл не является корректным JSON");
  }
  if (typeof payload !== "object" || payload === null) {
    throw new Error("Неверный формат бэкапа");
  }

  const products = Array.isArray(payload.products) ? payload.products : [];
  const orders = Array.isArray(payload.orders) ? payload.orders : [];
  const promoCodes = Array.isArray(payload.promo_codes) ? payload.promo_codes : [];

  // Clear existing rows (delete-all requires a where clause).
  const del = async (table: string) => {
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    if (error) throw new Error(`${table}: ${error.message}`);
  };
  await del("orders");
  await del("promo_codes");
  await del("products");

  if (products.length) {
    const { error } = await supabase.from("products").insert(products);
    if (error) throw new Error(`products: ${error.message}`);
  }
  if (promoCodes.length) {
    const { error } = await supabase.from("promo_codes").insert(promoCodes);
    if (error) throw new Error(`promo_codes: ${error.message}`);
  }
  if (orders.length) {
    const { error } = await supabase.from("orders").insert(orders);
    if (error) throw new Error(`orders: ${error.message}`);
  }

  return {
    products: products.length,
    orders: orders.length,
    promo_codes: promoCodes.length,
  };
}
