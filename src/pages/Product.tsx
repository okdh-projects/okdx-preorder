import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { supabase, type ProductRow, PUBLIC_PRODUCT_COLS } from "../lib/supabase";
import { useCart } from "../lib/store";
import { fetchSettings, useSettings } from "../lib/settings";
import { fetchSizeChart, type SizeChart } from "../lib/sizeChart";
import { SizeChartTable } from "../components/SizeChart";

export default function Product() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [loading, setLoading] = useState(true);
  const cart = useCart((s) => s.cart);
  const addToCart = useCart((s) => s.addToCart);
  const { preorderClosed, loaded } = useSettings();

  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState<string | undefined>();
  const [variant, setVariant] = useState<string | undefined>();
  const [sizeChart, setSizeChart] = useState<SizeChart | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    setSizeChart(null);
    const load = () => fetchSizeChart(id).then((chart) => {
      if (active) setSizeChart(chart);
    }).catch(() => { if (active) setSizeChart(null); });
    load();
    const channel = supabase.channel(`size-chart-${id}`).on("postgres_changes", {
      event: "*", schema: "public", table: "app_settings", filter: `key=eq.${id.replaceAll("-", "")}`,
    }, load).subscribe();
    return () => { active = false; supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!id) return;
    supabase
      .from("products")
      .select(PUBLIC_PRODUCT_COLS)
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setProduct(data as ProductRow | null);
        setSize(data?.sizes?.[0]);
        setVariant(data?.variants?.[0]);
        setLoading(false);
      });
  }, [id]);

  if (loaded && preorderClosed) {
    return (
      <Layout>
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
          <Lock className="text-muted-foreground" size={32} />
          <h1 className="mt-4 text-2xl font-bold">Предзаказ закрыт</h1>
          <Link to="/" className="mt-6 rounded-md border border-border px-4 py-2 font-mono text-xs uppercase">
            На главную
          </Link>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted-foreground">Загрузка…</div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-muted-foreground">Товар не найден</p>
          <Link to="/" className="mt-4 inline-block underline">Назад в каталог</Link>
        </div>
      </Layout>
    );
  }

  const cartKey = `${product.id}|${size ?? ""}|${variant ?? ""}`;
  const inCart = cart.find((c) => c.id === cartKey);
  const imgs = product.images.length ? product.images : [""];

  const handleAdd = () => {
    addToCart({
      productId: product.id,
      name: product.name,
      price: 0,
      qty: 1,
      size,
      variant,
      image: product.images[0],
    });
  };

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mt-2 grid min-w-0 items-start gap-8 lg:grid-cols-2">
          <div className="relative self-start overflow-hidden rounded-lg border border-border bg-neutral-900">
            <div className="aspect-square">
              {imgs[imgIdx] ? (
                <img
                  src={imgs[imgIdx]}
                  alt={product.name}
                  className="h-full w-full object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              ) : null}
            </div>
            {imgs.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx((imgIdx - 1 + imgs.length) % imgs.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white backdrop-blur"
                  aria-label="Назад"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setImgIdx((imgIdx + 1) % imgs.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/70 p-2 text-white backdrop-blur"
                  aria-label="Вперёд"
                >
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>

          <div className="min-w-0">
            <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {product.category}
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
            <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>

            {product.sizes.length > 0 && (
              <div className="mt-6">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Размер</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`min-w-12 rounded-md border px-4 py-2 font-mono text-sm transition-colors ${
                        size === s
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-neutral-500"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.variants && product.variants.length > 0 && (
              <div className="mt-5">
                <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                  {product.variant_label ?? "Вариант"}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v}
                      onClick={() => setVariant(v)}
                      className={`rounded-md border px-4 py-2 font-mono text-sm transition-colors ${
                        variant === v
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-neutral-500"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {inCart && (
              <div className="mt-6 flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-4 py-3 font-mono text-sm text-green-400">
                <Check size={16} />В корзине: {inCart.qty} шт
              </div>
            )}


            <button
              onClick={handleAdd}
              className="mt-6 w-full rounded-md bg-white py-4 font-bold text-black transition-opacity hover:opacity-90"
            >
              Добавить в корзину
            </button>
            {inCart && (
              <button
                onClick={() => navigate("/cart")}
                className="mt-2 w-full rounded-md border border-border py-3 font-mono text-xs uppercase tracking-widest hover:bg-muted"
              >
                Перейти в корзину →
              </button>
            )}
            <SizeChartTable chart={sizeChart} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
