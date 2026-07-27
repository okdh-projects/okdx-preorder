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

export async function restoreBackup(json: string): Promise<string> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Не удалось прочитать JSON");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("Неверный формат бэкапа");
  const p = parsed as {
    products?: unknown[];
    orders?: unknown[];
    promo_codes?: unknown[];
  };
  const products = Array.isArray(p.products) ? p.products : [];
  const orders = Array.isArray(p.orders) ? p.orders : [];
  const promo = Array.isArray(p.promo_codes) ? p.promo_codes : [];

  const results: string[] = [];
  if (products.length) {
    const { error } = await supabase.from("products").upsert(products as never);
    if (error) throw new Error(`products: ${error.message}`);
    results.push(`${products.length} товар(ов)`);
  }
  if (promo.length) {
    const { error } = await supabase.from("promo_codes").upsert(promo as never);
    if (error) throw new Error(`promo_codes: ${error.message}`);
    results.push(`${promo.length} промокод(ов)`);
  }
  if (orders.length) {
    const { error } = await supabase.from("orders").upsert(orders as never);
    if (error) throw new Error(`orders: ${error.message}`);
    results.push(`${orders.length} заказ(ов)`);
  }
  return results.length ? results.join(", ") : "пусто";
}

