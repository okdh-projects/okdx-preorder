import { Link, useNavigate } from "react-router-dom";
import { Check, Lock, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Layout } from "../components/Layout";
import { useCart } from "../lib/store";
import { supabase, formatMoney, type ProductRow } from "../lib/supabase";
import { fetchSettings, useSettings } from "../lib/settings";
import { pushRemoteOrderLog } from "../lib/npoint";

function makeCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

export default function Cart() {
  const nav = useNavigate();
  const cart = useCart((s) => s.cart);
  const updateQty = useCart((s) => s.updateQty);
  const removeFromCart = useCart((s) => s.removeFromCart);
  const clearCart = useCart((s) => s.clearCart);
  const { preorderClosed, loaded } = useSettings();

  const [name, setName] = useState("");
  const [telegram, setTelegram] = useState("");
  const [phone, setPhone] = useState("");
  const [placed, setPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [confirmOrder, setConfirmOrder] = useState(false);
  const [consentPd, setConsentPd] = useState(false);
  const [captcha, setCaptcha] = useState(makeCaptcha());
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  // Promo
  const [promoInput, setPromoInput] = useState("");
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [salePrices, setSalePrices] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    const { data } = await supabase
      .from("promo_codes")
      .select("code, is_active")
      .eq("code", code)
      .eq("is_active", true)
      .maybeSingle();
    if (!data) {
      setPromoLoading(false);
      toast.error("Промокод не найден или не активен");
      return;
    }
    // Load sale_prices for cart products
    const ids = Array.from(new Set(cart.map((c) => c.productId)));
    const { data: prods } = await supabase
      .from("products")
      .select("id, sale_price")
      .in("id", ids);
    const sp: Record<string, number> = {};
    (prods ?? []).forEach((p: Pick<ProductRow, "id" | "sale_price">) => {
      if (p.sale_price != null) sp[p.id] = Number(p.sale_price);
    });
    setSalePrices(sp);
    setPromoCode(code);
    setPromoLoading(false);
    toast.success(`Промокод ${code} применён`);
  };

  const removePromo = () => {
    setPromoCode(null);
    setSalePrices({});
  };

  const linePrice = (productId: string, basePrice: number) =>
    promoCode && salePrices[productId] != null ? salePrices[productId] : basePrice;

  const total = useMemo(
    () => cart.reduce((a, b) => a + linePrice(b.productId, b.price) * b.qty, 0),
    [cart, promoCode, salePrices],
  );
  const baseTotal = useMemo(() => cart.reduce((a, b) => a + b.price * b.qty, 0), [cart]);
  const discount = baseTotal - total;

  const captchaOk = Number(captchaAnswer) === captcha.answer;
  const canSubmit =
    name.trim().length > 1 &&
    telegram.trim().startsWith("@") &&
    telegram.trim().length > 2 &&
    phone.trim().length >= 10 &&
    confirmOrder &&
    consentPd &&
    captchaOk &&
    !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const items = cart.map((c) => ({
      productId: c.productId,
      name: c.name,
      price: linePrice(c.productId, c.price),
      qty: c.qty,
      size: c.size,
      variant: c.variant,
      image: c.image,
    }));
    const payload = {
      client_name: name.trim(),
      client_contact: `${telegram.trim()} | ${phone.trim()}`,
      items,
      total_price: total,
      status: "Новый",
      packaging: null,
      promo_code: promoCode,
    };
    const { error } = await supabase.from("orders").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error("Не удалось оформить заказ", { description: error.message });
      return;
    }

    // Telegram notification about the new order
    const itemsList = items
      .map(
        (i) =>
          `• ${escapeHtml(i.name)}${i.size ? ` [${escapeHtml(i.size)}]` : ""}${
            i.variant ? ` (${escapeHtml(i.variant)})` : ""
          } × ${i.qty} — ${formatMoney(i.price * i.qty)}`,
      )
      .join("\n");
    const msg =
      `🆕 <b>Новый предзаказ</b>\n` +
      `<b>Имя:</b> ${escapeHtml(name.trim())}\n` +
      `<b>Контакт:</b> ${escapeHtml(telegram.trim())} | ${escapeHtml(phone.trim())}\n\n` +
      `<b>Состав:</b>\n${itemsList}\n\n` +
      `<b>Итого:</b> ${formatMoney(total)}\n` +
      `<b>Промокод:</b> ${promoCode ? escapeHtml(promoCode) : "—"}`;
    tgSendMessage(msg);

    setPlaced(true);
    clearCart();
    setName("");
    setTelegram("");
    setPhone("");
    setConfirmOrder(false);
    setConsentPd(false);
    setCaptcha(makeCaptcha());
    setCaptchaAnswer("");
    setPromoCode(null);
    setSalePrices({});
    toast.success("Заказ оформлен!", { description: "Мы напишем вам в Telegram." });
  };

  if (loaded && preorderClosed) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
          <Lock className="text-muted-foreground" size={32} />
          <h1 className="mt-4 text-2xl font-bold">Предзаказ закрыт</h1>
          <button
            onClick={() => nav("/")}
            className="mt-6 rounded-md border border-border px-4 py-2 font-mono text-xs uppercase"
          >
            На главную
          </button>
        </div>
      </Layout>
    );
  }

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
              {cart.map((item) => {
                const lp = linePrice(item.productId, item.price);
                const hasDiscount = lp < item.price;
                return (
                  <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
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
                    <div className="min-w-0 flex-1">
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
                      <div className={`font-mono font-bold ${hasDiscount ? "text-red-400" : ""}`}>
                        {formatMoney(lp * item.qty)}
                      </div>
                      {hasDiscount && (
                        <div className="font-mono text-[11px] text-muted-foreground line-through">
                          {formatMoney(item.price * item.qty)}
                        </div>
                      )}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="mt-2 text-muted-foreground hover:text-red-400"
                        aria-label="Удалить"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Promo */}
            <div className="mt-6 rounded-lg border border-border bg-card p-4">
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Промокод
              </div>
              {promoCode ? (
                <div className="mt-2 flex items-center justify-between">
                  <div className="font-mono font-bold text-green-400">✓ {promoCode}</div>
                  <button
                    onClick={removePromo}
                    className="rounded-md border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-widest hover:bg-muted"
                  >
                    Убрать
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex gap-2">
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="OKDX10"
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm uppercase"
                  />
                  <button
                    onClick={applyPromo}
                    disabled={promoLoading || !promoInput.trim()}
                    className="rounded-md bg-white px-4 py-2 font-mono text-xs uppercase tracking-widest text-black disabled:opacity-50"
                  >
                    {promoLoading ? "…" : "Применить"}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 space-y-1 border-t border-border pt-6">
              {discount > 0 && (
                <div className="flex justify-between font-mono text-xs text-muted-foreground">
                  <span>Скидка</span>
                  <span className="text-red-400">− {formatMoney(discount)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  Итого
                </span>
                <span className="font-mono text-3xl font-bold">{formatMoney(total)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-border bg-card p-6">
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
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm"
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
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm"
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
                    placeholder="+375 29 000-00-00"
                    maxLength={20}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm"
                  />
                </div>

                {/* Captcha */}
                <div>
                  <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    Проверка: {captcha.a} + {captcha.b} = ?
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      className="w-32 rounded-md border border-border bg-background px-3 py-2.5 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCaptcha(makeCaptcha());
                        setCaptchaAnswer("");
                      }}
                      className="rounded-md border border-border px-3 font-mono text-xs uppercase tracking-widest hover:bg-muted"
                    >
                      Обновить
                    </button>
                  </div>
                </div>

                {/* Checkboxes */}
                <label className="flex items-start gap-2 font-mono text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={confirmOrder}
                    onChange={(e) => setConfirmOrder(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-white"
                  />
                  <span>Я подтверждаю правильность заказа и введённых данных</span>
                </label>
                <label className="flex items-start gap-2 font-mono text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={consentPd}
                    onChange={(e) => setConsentPd(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-white"
                  />
                  <span>Я согласен на обработку введённых мною персональных данных</span>
                </label>

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
