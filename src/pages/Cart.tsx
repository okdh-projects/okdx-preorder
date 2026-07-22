import { Link } from "react-router-dom";
import { Check, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useCart } from "../lib/store";
import { supabase } from "../lib/supabase";

export default function Cart() {
  const cart = useCart((s) => s.cart);
  const updateQty = useCart((s) => s.updateQty);
  const removeFromCart = useCart((s) => s.removeFromCart);
  const clearCart = useCart((s) => s.clearCart);

  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [placed, setPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total = cart.reduce((a, b) => a + b.price * b.qty, 0);
  const canSubmit =
    name.trim().length > 1 &&
    telegram.trim().startsWith("@") &&
    telegram.trim().length > 2 &&
    phone.trim().length >= 10 &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const payload = {
      client_name: name.trim(),
      client_contact: `${telegram.trim()} | ${phone.trim()}`,
      delivery_address: address.trim() || null,
      items: cart.map((c) => ({
        productId: c.productId,
        name: c.name,
        price: c.price,
        qty: c.qty,
        size: c.size,
        variant: c.variant,
        image: c.image,
      })),
      total_price: total,
      status: "Новый",
    };
    const { error } = await supabase.from("orders").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error("Не удалось оформить заказ", { description: error.message });
      return;
    }
    setPlaced(true);
    clearCart();
    setName("");
    setTelegram("");
    setPhone("");
    setAddress("");
    toast.success("Заказ оформлен!", {
      description: "Мы напишем вам в Telegram в ближайшее время.",
    });
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight">Корзина</h1>

        {placed && (
          <div className="mt-6 flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 font-mono text-sm text-green-400">
            <Check size={16} /> Заказ оформлен! Мы напишем вам в Telegram.
          </div>
        )}

        {cart.length === 0 && !placed && (
          <div className="mt-16 flex flex-col items-center gap-4 text-muted-foreground">
            <ShoppingCart size={48} />
            <div className="font-mono">Корзина пуста</div>
            <Link
              to="/"
              className="rounded-md border border-border px-5 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
            >
              В каталог
            </Link>
          </div>
        )}

        {cart.length > 0 && (
          <>
            <div className="mt-6 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-neutral-900">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{item.name}</div>
                    <div className="mt-1 font-mono text-xs text-muted-foreground">
                      {[item.size, item.variant].filter(Boolean).join(" · ")}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="rounded-md border border-border p-1 hover:bg-muted"
                        aria-label="Меньше"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center font-mono">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="rounded-md border border-border p-1 hover:bg-muted"
                        aria-label="Больше"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold">
                      {(item.price * item.qty).toLocaleString("ru-RU")} ₽
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="mt-2 text-muted-foreground hover:text-red-400"
                      aria-label="Удалить"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-baseline justify-between border-t border-border pt-6">
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Итого
              </span>
              <span className="font-mono text-3xl font-bold">{total.toLocaleString("ru-RU")} ₽</span>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 rounded-lg border border-border bg-card p-6"
            >
              <h2 className="text-xl font-bold">Данные для заказа</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Имя
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Иванов Иван Иванович"
                    maxLength={100}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm placeholder:text-muted-foreground focus:border-neutral-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Telegram
                  </label>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => {
                      const v = e.target.value;
                      setTelegram(v.startsWith("@") || v === "" ? v : "@" + v);
                    }}
                    placeholder="@username"
                    maxLength={40}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm placeholder:text-muted-foreground focus:border-neutral-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 900 000-00-00"
                    maxLength={20}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm placeholder:text-muted-foreground focus:border-neutral-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!canSubmit || cart.length === 0}
                  className="w-full rounded-md bg-white py-4 font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
                >
                  {submitting ? "Отправка…" : "Оформить заказ"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Layout>
  );
}
