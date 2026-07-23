import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ShoppingCart } from "lucide-react";
import { Logo } from "./Logo";
import { useCartCount } from "../lib/store";
import { useSettings } from "../lib/settings";

export function Header() {
  const loc = useLocation();
  const count = useCartCount();
  const { preorderClosed } = useSettings();
  const isCatalog = loc.pathname === "/";
  const isAdmin = loc.pathname.startsWith("/admin");
  const showBackOnly =
    !isAdmin && (loc.pathname.startsWith("/cart") || loc.pathname.startsWith("/product"));
  const showCart = !preorderClosed && isCatalog && !isAdmin;

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <Logo size={36} />
          <span className="font-bold tracking-tight">OKDX.Merch</span>
        </Link>

        {showBackOnly && (
          <Link
            to="/"
            className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={14} /> Назад в каталог
          </Link>
        )}

        {showCart && (
          <Link
            to="/cart"
            className="relative flex items-center gap-2 rounded-md border border-border px-3 py-2 font-mono text-xs uppercase tracking-widest hover:bg-muted"
          >
            <ShoppingCart size={16} />
            {count > 0 ? (
              <>
                <span>{count} шт</span>
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-black">
                  {count}
                </span>
              </>
            ) : (
              <span>Корзина</span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
