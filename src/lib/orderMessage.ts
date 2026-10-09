import { formatMoney, type OrderRow } from "./supabase";

export function buildOrderMessage(template: string, o: OrderRow): string {
  const items = o.items
    .map((i) => {
      const opts = [i.size ? `размер ${i.size}` : "", i.variant ?? ""].filter(Boolean).join(", ");
      return `— ${i.name}${opts ? ` (${opts})` : ""} × ${i.qty} шт — ${formatMoney(i.price * i.qty)}`;
    })
    .join("\n");
  return template
    .replaceAll("{name}", o.client_name)
    .replaceAll("{items}", items)
    .replaceAll("{total}", formatMoney(o.total_price))
    .replaceAll("{contact}", o.client_contact)
    .replaceAll("{packaging}", o.packaging ?? "не выбрана");
}
