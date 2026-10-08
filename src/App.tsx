import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import Catalog from "./pages/Catalog";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import { useEffect } from "react";
import { fetchSettings } from "./lib/settings";
import { SUPABASE_CONFIGURED } from "./lib/supabase";

export default function App() {
  useEffect(() => {
    if (SUPABASE_CONFIGURED) fetchSettings();
  }, []);
  if (!SUPABASE_CONFIGURED) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">Сайт не настроен</h1>
          <p className="mt-3 font-mono text-sm text-muted-foreground">
            Не заданы ключи базы данных (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY). Добавьте их в секреты
            репозитория GitHub и перезапустите деплой.
          </p>
        </div>
      </div>
    );
  }
  return (
    <>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </>
  );
}
