import { supabase } from "./supabase";

export type SizeChart = { title: string; columns: string[]; rows: string[][]; note: string };

export function newSizeChart(): SizeChart {
  return { title: "Размерная сетка", columns: ["Размер", "Ширина, см", "Длина, см"], rows: [["", "", ""]], note: "" };
}

// A UUID without hyphens fits the existing app_settings.key varchar(32).
export function sizeChartKey(productId: string): string {
  const key = productId.replaceAll("-", "");
  if (!/^[a-f\d]{32}$/i.test(key)) throw new Error("Некорректный идентификатор товара");
  return key;
}

export function parseSizeChart(value: unknown): SizeChart | null {
  try {
    const chart = typeof value === "string" ? JSON.parse(value) : value;
    if (!chart || typeof chart !== "object" || !Array.isArray(chart.columns) || !Array.isArray(chart.rows)) return null;
    if (!chart.columns.length || !chart.columns.every((c: unknown) => typeof c === "string")) return null;
    if (!chart.rows.every((r: unknown) => Array.isArray(r) && r.every((c: unknown) => typeof c === "string"))) return null;
    return {
      title: typeof chart.title === "string" ? chart.title : "Размерная сетка",
      columns: chart.columns,
      rows: chart.rows.map((row: string[]) => chart.columns.map((_: string, i: number) => row[i] ?? "")),
      note: typeof chart.note === "string" ? chart.note : "",
    };
  } catch {
    return null;
  }
}

export async function fetchSizeChart(productId: string): Promise<SizeChart | null> {
  const { data, error } = await supabase.from("app_settings").select("value").eq("key", sizeChartKey(productId)).maybeSingle();
  if (error) throw error;
  return parseSizeChart(data?.value);
}

export async function saveSizeChart(productId: string, chart: SizeChart | null): Promise<void> {
  const key = sizeChartKey(productId);
  const { error } = chart
    ? await supabase.from("app_settings").upsert({ key, value: JSON.stringify(chart) })
    : await supabase.from("app_settings").delete().eq("key", key);
  if (error) throw error;
}