import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import Catalog from "./pages/Catalog";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import { useEffect } from "react";
import { fetchSettings } from "./lib/settings";

export default function App() {
  useEffect(() => {
    fetchSettings();
  }, []);
  return (
    <>
      <Routes>
        <Route path="/" element={<Catalog />} />
        <Route path="/product/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Catalog />} />
      </Routes>
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </>
  );
}
