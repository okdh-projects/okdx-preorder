import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Product = {
  id: string;
  category: string;
  name: string;
  price: number;
  stock: number;
  sizes: string[];
  colors: string[];
  images: string[];
  description: string;
  variantLabel?: string; // for stickers/mugs (e.g. "330 мл" or "60×60 мм")
  variants?: string[];
};

export type CartItem = {
  id: string; // composite key: productId|size|color|variant
  productId: string;
  name: string;
  price: number;
  qty: number;
  size?: string;
  color?: string;
  variant?: string;
  image?: string;
};

export type OrderStatus = "pending" | "assembling" | "ready" | "delivered";

export type Order = {
  id: string;
  code: string;
  createdAt: number;
  status: OrderStatus;
  name: string;
  telegram: string;
  phone: string;
  items: CartItem[];
  total: number;
};

type State = {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addToCart: (item: Omit<CartItem, "id">) => void;
  updateQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  placeOrder: (info: { name: string; telegram: string; phone: string }) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
};

const seedProducts: Product[] = [
  {
    id: "p1",
    category: "Футболки",
    name: "Футболка VOID",
    price: 1490,
    stock: 24,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: ["Чёрный", "Белый"],
    images: ["./images/tshirt-void.jpg"],
    description:
      "Оверсайз-крой из 100% хлопка 240 г/м². Шелкография на груди, скошенные плечевые швы. Двойной шов на горловине.",
  },
  {
    id: "p2",
    category: "Футболки",
    name: "Футболка STATIC",
    price: 1290,
    stock: 18,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Чёрный"],
    images: ["./images/tshirt-static.jpg"],
    description: "Классический крой, плотный хлопок, минималистичный принт.",
  },
  {
    id: "p3",
    category: "Худи",
    name: "Худи SIGNAL",
    price: 3490,
    stock: 12,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Чёрный"],
    images: ["./images/hoodie-signal.jpg"],
    description: "Худи из плотного футера с начёсом. Прямой крой, глубокий капюшон.",
  },
  {
    id: "p4",
    category: "Кружки",
    name: "Кружка TRANSMISSION",
    price: 690,
    stock: 40,
    sizes: [],
    colors: ["Белый"],
    variantLabel: "Объём",
    variants: ["330 мл"],
    images: ["./images/mug-transmission.jpg"],
    description: "Керамическая кружка с матовой печатью. 330 мл.",
  },
  {
    id: "p5",
    category: "Кружки",
    name: "Кружка NOISE",
    price: 790,
    stock: 30,
    sizes: [],
    colors: ["Чёрный"],
    variantLabel: "Объём",
    variants: ["300 мл", "500 мл"],
    images: ["./images/mug-noise.jpg"],
    description: "Матовая керамика, устойчивая к посудомоечной машине.",
  },
  {
    id: "p6",
    category: "Значки",
    name: "Значок FREQUENCY",
    price: 150,
    stock: 100,
    sizes: [],
    colors: [],
    variantLabel: "Диаметр",
    variants: ["25 мм", "38 мм", "56 мм"],
    images: ["./images/badge-frequency.jpg"],
    description: "Металлический значок с булавкой.",
  },
  {
    id: "p7",
    category: "Значки",
    name: "Значок PULSE",
    price: 150,
    stock: 85,
    sizes: [],
    colors: [],
    variantLabel: "Диаметр",
    variants: ["25 мм", "38 мм"],
    images: ["./images/badge-pulse.jpg"],
    description: "Металлический значок с булавкой.",
  },
  {
    id: "p8",
    category: "Магниты",
    name: "Магнит VOID LOGO",
    price: 190,
    stock: 60,
    sizes: [],
    colors: [],
    variantLabel: "Размер",
    variants: ["60×40 мм"],
    images: ["./images/magnet-void.jpg"],
    description: "Виниловый магнит с плотной подложкой.",
  },
  {
    id: "p9",
    category: "Стикеры",
    name: "Стикер GLITCH",
    price: 90,
    stock: 200,
    sizes: [],
    colors: ["Прозрачный"],
    variantLabel: "Размер",
    variants: ["60×60 мм", "90×90 мм"],
    images: ["./images/sticker-glitch.jpg"],
    description: "Виниловый стикер с ламинацией.",
  },
  {
    id: "p10",
    category: "Стикеры",
    name: "Стикер-пак SYSTEM",
    price: 290,
    stock: 75,
    sizes: [],
    colors: ["Ассорти"],
    variantLabel: "Комплект",
    variants: ["Набор 6 шт"],
    images: ["./images/sticker-system.jpg"],
    description: "Набор из 6 виниловых стикеров.",
  },
];

const seedOrders: Order[] = [
  {
    id: "o1",
    code: "ND9FF3U",
    createdAt: new Date("2026-07-21").getTime(),
    status: "delivered",
    name: "з",
    telegram: "@z",
    phone: "+7 900 000-00-00",
    items: [
      {
        id: "ci1",
        productId: "p2",
        name: "Футболка STATIC",
        price: 1290,
        qty: 1,
        size: "S",
        color: "Чёрный",
      },
    ],
    total: 1290,
  },
  {
    id: "o2",
    code: "A3F7B2",
    createdAt: new Date("2024-11-18").getTime(),
    status: "pending",
    name: "Антон Серов",
    telegram: "@antonserov",
    phone: "+7 916 234-56-78",
    items: [
      {
        id: "ci2",
        productId: "p1",
        name: "Футболка VOID",
        price: 1490,
        qty: 1,
        size: "L",
        color: "Чёрный",
      },
    ],
    total: 1490,
  },
  {
    id: "o3",
    code: "C8D1E9",
    createdAt: new Date("2024-11-17").getTime(),
    status: "assembling",
    name: "Мария Ильина",
    telegram: "@maryilina",
    phone: "+7 903 111-22-33",
    items: [
      {
        id: "ci3",
        productId: "p3",
        name: "Худи SIGNAL",
        price: 3490,
        qty: 1,
        size: "M",
        color: "Чёрный",
      },
      {
        id: "ci4",
        productId: "p9",
        name: "Стикер GLITCH",
        price: 90,
        qty: 2,
        variant: "60×60 мм",
        color: "Прозрачный",
      },
    ],
    total: 3670,
  },
  {
    id: "o4",
    code: "F2A4C0",
    createdAt: new Date("2024-11-16").getTime(),
    status: "ready",
    name: "Дмитрий Кузнецов",
    telegram: "@dkuznetsov",
    phone: "+7 925 777-88-99",
    items: [
      {
        id: "ci5",
        productId: "p4",
        name: "Кружка TRANSMISSION",
        price: 690,
        qty: 2,
        color: "Белый",
        variant: "330 мл",
      },
    ],
    total: 1380,
  },
  {
    id: "o5",
    code: "B9E3A1",
    createdAt: new Date("2024-11-14").getTime(),
    status: "delivered",
    name: "Светлана Попова",
    telegram: "@svpopova",
    phone: "+7 916 500-10-20",
    items: [
      {
        id: "ci6",
        productId: "p10",
        name: "Стикер-пак SYSTEM",
        price: 290,
        qty: 1,
        color: "Ассорти",
        variant: "Набор 6 шт",
      },
    ],
    total: 290,
  },
];

function randomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      cart: [],
      orders: seedOrders,
      addProduct: (p) =>
        set((s) => ({ products: [...s.products, { ...p, id: "p" + Date.now() }] })),
      updateProduct: (id, p) =>
        set((s) => ({
          products: s.products.map((x) => (x.id === id ? { ...x, ...p } : x)),
        })),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((x) => x.id !== id) })),
      addToCart: (item) => {
        const key = `${item.productId}|${item.size ?? ""}|${item.color ?? ""}|${item.variant ?? ""}`;
        set((s) => {
          const existing = s.cart.find((c) => c.id === key);
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                c.id === key ? { ...c, qty: c.qty + item.qty } : c,
              ),
            };
          }
          return { cart: [...s.cart, { ...item, id: key }] };
        });
      },
      updateQty: (id, qty) =>
        set((s) => ({
          cart: s.cart
            .map((c) => (c.id === id ? { ...c, qty } : c))
            .filter((c) => c.qty > 0),
        })),
      removeFromCart: (id) =>
        set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),
      clearCart: () => set({ cart: [] }),
      placeOrder: (info) => {
        const items = get().cart;
        const total = items.reduce((a, b) => a + b.price * b.qty, 0);
        const order: Order = {
          id: "o" + Date.now(),
          code: randomCode(),
          createdAt: Date.now(),
          status: "pending",
          name: info.name,
          telegram: info.telegram,
          phone: info.phone,
          items,
          total,
        };
        set((s) => ({ orders: [order, ...s.orders], cart: [] }));
        return order;
      },
      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),
    }),
    { name: "okdx-merch-store" },
  ),
);

export const statusLabels: Record<OrderStatus, string> = {
  pending: "Ожидает",
  assembling: "Комплектуется",
  ready: "Готов к выдаче",
  delivered: "Выдан",
};

export const statusColors: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  assembling: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  ready: "bg-green-500/20 text-green-400 border-green-500/30",
  delivered: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
};

export const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  pending: "assembling",
  assembling: "ready",
  ready: "delivered",
  delivered: null,
};

export const nextStatusLabel: Record<OrderStatus, string> = {
  pending: "Начать сборку",
  assembling: "Готов к выдаче",
  ready: "Выдать заказ",
  delivered: "",
};

export function useCartCount() {
  return useStore((s) => s.cart.reduce((a, b) => a + b.qty, 0));
}
