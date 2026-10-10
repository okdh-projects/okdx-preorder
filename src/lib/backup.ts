import { supabase, encodeItem, decodeItem } from "./supabase";

async function collectBackup() {
  const [orders, products, charts] = await Promise.all([
    supabase.from("orders").select("*"),
    supabase.from("products").select("*"),
    supabase.from("app_settings").select("key,value"),
  ]);
  return {
    created_at: new Date().toISOString(),
    orders: orders.data ?? [],
    products: products.data ?? [],
    size_charts: (charts.data ?? []).filter((row) => /^[a-f\d]{32}$/i.test(row.key)),
  };
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export async function manualBackupDownload(): Promise<void> {
  const data = await collectBackup();
  const json = JSON.stringify(data);
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
    size_charts?: { key: string; value: string }[];
  };
  const products = Array.isArray(p.products) ? p.products : [];
  const orders = Array.isArray(p.orders) ? p.orders : [];
  const results: string[] = [];
  if (products.length) {
    const cleanP = (products as Record<string, unknown>[]).map((x) => {
      const { sale_price: _s, ...rest } = x;
      void _s;
      return rest;
    });
    const { error } = await supabase.from("products").upsert(cleanP as never);
    if (error) throw new Error(`products: ${error.message}`);
    results.push(`${products.length} товар(ов)`);
  }
  if (Array.isArray(p.size_charts) && p.size_charts.length) {
    const charts = p.size_charts.filter((row) => typeof row.key === "string" && /^[a-f\d]{32}$/i.test(row.key) && typeof row.value === "string");
    if (charts.length !== p.size_charts.length) throw new Error("Неверный формат размерных сеток");
    const { error } = await supabase.from("app_settings").upsert(charts);
    if (error) throw new Error(`Размерные сетки: ${error.message}`);
    results.push(`${charts.length} размерных сеток`);
  }
  if (orders.length) {
    // Convert legacy orders to compact format, drop removed columns.
    const clean = (orders as Record<string, unknown>[]).map((o) => {
      const { promo_code: _p, delivery_address: _d, ...rest } = o;
      void _p; void _d;
      const items = Array.isArray(rest.items)
        ? (rest.items as never[]).map((i) => encodeItem(decodeItem(i)))
        : [];
      return { ...rest, items };
    });
    const { error } = await supabase.from("orders").upsert(clean as never);
    if (error) throw new Error(`orders: ${error.message}`);
    results.push(`${orders.length} заказ(ов)`);
  }
  return results.length ? results.join(", ") : "пусто";
}

