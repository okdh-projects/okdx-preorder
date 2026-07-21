import { createFileRoute } from "@tanstack/react-router";
import { Check, Eye, Package, Pencil, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Layout } from "../components/Layout";
import { Logo } from "../components/Logo";
import {
  nextStatus,
  nextStatusLabel,
  statusColors,
  statusLabels,
  useStore,
  type OrderStatus,
  type Product,
} from "../lib/store";

export const Route = createFileRoute("/panel")({
  component: PanelPage,
});

type Tab = "orders" | "products";

function PanelPage() {
  const [tab, setTab] = useState<Tab>("orders");
  const orders = useStore((s) => s.orders);
  const activeCount = orders.filter((o) => o.status !== "delivered").length;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center gap-4">
          <Logo size={48} />
          <div className="border-l border-border pl-4">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Панель управления
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {activeCount} активных заказов
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-6 border-b border-border">
          <button
            onClick={() => setTab("orders")}
            className={`flex items-center gap-2 border-b-2 pb-3 font-mono text-xs uppercase tracking-widest transition-colors ${
              tab === "orders"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShoppingBag size={14} /> Заказы
          </button>
          <button
            onClick={() => setTab("products")}
            className={`flex items-center gap-2 border-b-2 pb-3 font-mono text-xs uppercase tracking-widest transition-colors ${
              tab === "products"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Package size={14} /> Товары
          </button>
        </div>

        {tab === "orders" ? <OrdersTab /> : <ProductsTab />}
      </div>
    </Layout>
  );
}

const statusFilters: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "Все" },
  { key: "pending", label: "Ожидает" },
  { key: "assembling", label: "Комплектуется" },
  { key: "ready", label: "Готов к выдаче" },
  { key: "delivered", label: "Выдан" },
];

function OrdersTab() {
  const orders = useStore((s) => s.orders);
  const updateStatus = useStore((s) => s.updateOrderStatus);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => {
          const count =
            f.key === "all" ? orders.length : orders.filter((o) => o.status === f.key).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md border px-4 py-2 font-mono text-xs transition-colors ${
                filter === f.key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        {filtered.map((order) => {
          const date = new Date(order.createdAt).toLocaleDateString("ru-RU");
          const nxt = nextStatus[order.status];
          return (
            <div key={order.id} className="rounded-lg border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      #{order.code}
                    </span>
                    <span
                      className={`rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${statusColors[order.status]}`}
                    >
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <div className="mt-2 text-lg font-bold">{order.name}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    {order.telegram} · {order.phone}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xl font-bold">
                    {order.total.toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">{date}</div>
                </div>
              </div>

              <div className="mt-4 space-y-1 border-t border-border pt-4">
                {order.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex justify-between font-mono text-xs text-muted-foreground"
                  >
                    <div>
                      {it.name}
                      {[it.color, it.size, it.variant].filter(Boolean).length > 0 && (
                        <>
                          {" · "}
                          {[it.color, it.size, it.variant].filter(Boolean).join(" · ")}
                        </>
                      )}
                    </div>
                    <div>
                      {it.qty} × {it.price.toLocaleString("ru-RU")} ₽
                    </div>
                  </div>
                ))}
              </div>

              {order.status === "delivered" ? (
                <div className="mt-4 flex items-center gap-1 font-mono text-xs text-muted-foreground">
                  <Check size={14} /> Выдан
                </div>
              ) : nxt ? (
                <button
                  onClick={() => updateStatus(order.id, nxt)}
                  className="mt-4 rounded-md border border-border px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
                >
                  {nextStatusLabel[order.status]} →
                </button>
              ) : null}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-border py-12 text-center font-mono text-sm text-muted-foreground">
            Заказов нет
          </div>
        )}
      </div>
    </div>
  );
}

function ProductsTab() {
  const products = useStore((s) => s.products);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm text-muted-foreground">
          {products.length} товаров
        </div>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 font-mono text-xs uppercase tracking-widest text-black hover:opacity-90"
        >
          <Plus size={14} /> Добавить товар
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-900">
              {p.images[0] && (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <div className="font-bold">{p.name}</div>
                <div className="font-mono text-xs text-muted-foreground">{p.category}</div>
              </div>
              <div className="mt-1 font-mono text-xs text-muted-foreground">
                {p.price.toLocaleString("ru-RU")} ₽ · {p.stock} шт
                {p.sizes.length > 0 && ` · ${p.sizes.join(", ")}`}
                {p.variants && p.variants.length > 0 && ` · ${p.variants.join(", ")}`}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <a
                href={`./product/${p.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  window.location.hash = `#/product/${p.id}`;
                }}
                className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
                aria-label="Просмотр"
              >
                <Eye size={16} />
              </a>
              <button
                onClick={() => setEditing(p)}
                className="rounded-md border border-border p-2 text-muted-foreground hover:text-foreground"
                aria-label="Изменить"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Удалить «${p.name}»?`)) deleteProduct(p.id);
                }}
                className="rounded-md border border-border p-2 text-muted-foreground hover:text-red-400"
                aria-label="Удалить"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {(creating || editing) && (
        <ProductModal
          product={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function ProductModal({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const addProduct = useStore((s) => s.addProduct);
  const updateProduct = useStore((s) => s.updateProduct);

  const [category, setCategory] = useState(product?.category ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price ?? 0);
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [sizes, setSizes] = useState(product?.sizes.join(", ") ?? "");
  const [colors, setColors] = useState(product?.colors.join(", ") ?? "");
  const [images, setImages] = useState(product?.images.join(", ") ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [variantLabel, setVariantLabel] = useState(product?.variantLabel ?? "");
  const [variants, setVariants] = useState(product?.variants?.join(", ") ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      category: category.trim(),
      name: name.trim(),
      price: Number(price) || 0,
      stock: Number(stock) || 0,
      sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean),
      colors: colors.split(",").map((s) => s.trim()).filter(Boolean),
      images: images.split(",").map((s) => s.trim()).filter(Boolean),
      description: description.trim(),
      variantLabel: variantLabel.trim() || undefined,
      variants: variants
        ? variants.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined,
    };
    if (product) updateProduct(product.id, data);
    else addProduct(data);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">{product ? "Изменить товар" : "Новый товар"}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <Field label="Категория" value={category} onChange={setCategory} required />
          <Field
            label="Название"
            value={name}
            onChange={setName}
            placeholder="Футболка OKDX"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Цена (₽)" value={String(price)} onChange={(v) => setPrice(Number(v))} type="number" />
            <Field label="Остаток на складе" value={String(stock)} onChange={(v) => setStock(Number(v))} type="number" />
          </div>
          <Field
            label="Размеры (через запятую)"
            value={sizes}
            onChange={setSizes}
            placeholder="S, M, L, XL"
          />
          <Field
            label="Цвета (через запятую)"
            value={colors}
            onChange={setColors}
            placeholder="Чёрный, Белый"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Название варианта"
              value={variantLabel}
              onChange={setVariantLabel}
              placeholder="Объём / Размер"
            />
            <Field
              label="Варианты (через запятую)"
              value={variants}
              onChange={setVariants}
              placeholder="330 мл, 500 мл"
            />
          </div>
          <Field
            label="URL фото (через запятую)"
            value={images}
            onChange={setImages}
            placeholder="./images/... или https://..."
          />
          <div>
            <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-md bg-white py-3 font-bold text-black hover:opacity-90"
          >
            {product ? "Сохранить" : "Добавить"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-6 py-3 font-mono text-xs uppercase tracking-widest hover:bg-muted"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-sm placeholder:text-muted-foreground focus:border-neutral-500 focus:outline-none"
      />
    </div>
  );
}
