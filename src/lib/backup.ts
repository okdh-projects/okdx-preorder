import { supabase } from "./supabase";
import { tgSendDocument } from "./telegram";

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

const KEY = "okdx-last-backup";

export async function maybeAutoBackup(): Promise<void> {
  try {
    const last = localStorage.getItem(KEY);
    const today = todayStr();
    if (last === today) return;
    const data = await collectBackup();
    const json = JSON.stringify(data);
    const ok = await tgSendDocument(
      `backup_${today}.json`,
      json,
      `Автобэкап OKDX.Merch — ${today}`,
    );
    if (ok) localStorage.setItem(KEY, today);
  } catch {
    /* ignore */
  }
}
