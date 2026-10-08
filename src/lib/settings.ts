import { create } from "zustand";
import { supabase } from "./supabase";

export type HeroSlide = { tag: string; title: string; subtitle: string; bgImage?: string; link?: string };

export type SiteContent = {
  heroSlides: HeroSlide[];
  preorderTitle: string;
  preorderSubtitle: string;
  preorderButton: string;
  footerTagline: string;
  footerCopyright: string;
  cartConfirm1: string;
  cartConfirm2: string;
  orderMessageTemplate: string;
};

export const DEFAULT_CONTENT: SiteContent = {
  heroSlides: [
    { tag: "Добро пожаловать", title: "OKDX.Merch", subtitle: "Ограниченные дропы. Только свой мерч." },
    { tag: "Новинки", title: "Новый дроп", subtitle: "Коллекция VOID уже в продаже." },
    { tag: "Аксессуары", title: "Стикеры & значки", subtitle: "Мелочи, которые говорят громко." },
  ],
  preorderTitle: "К сожалению, предзаказ мерча закончился",
  preorderSubtitle: "Следите за новостями в нашем Instagram — там мы объявляем следующие дропы.",
  preorderButton: "Открыть Instagram",
  footerTagline: "Ограниченные дропы. Только свой мерч.",
  footerCopyright: "© 2024 OKDX.Merch",
  cartConfirm1: "Я подтверждаю правильность заказа и введённых данных",
  cartConfirm2: "Я согласен на обработку введённых мною персональных данных",
  orderMessageTemplate:
    "Здравствуйте, {name}!\n\nВаш заказ в OKDX.Merch:\n{items}\n\nИтого к оплате: {total}\n\nПодтвердите, пожалуйста, что всё верно.",
};

type SettingsState = {
  preorderClosed: boolean;
  content: SiteContent;
  loaded: boolean;
  setPreorderClosed: (v: boolean) => void;
  setContent: (c: SiteContent) => void;
};

export const useSettings = create<SettingsState>((set) => ({
  preorderClosed: false,
  content: DEFAULT_CONTENT,
  loaded: false,
  setPreorderClosed: (v) => set({ preorderClosed: v }),
  setContent: (c) => set({ content: c }),
}));

export async function fetchSettings() {
  const { data } = await supabase.from("app_settings").select("key, value");
  const rows = data ?? [];
  const map = new Map(rows.map((r: { key: string; value: unknown }) => [r.key, r.value]));

  const preorderRaw = map.get("preorder_closed");
  const contentRaw = map.get("site_content");
  let content: SiteContent = DEFAULT_CONTENT;
  if (contentRaw) {
    try {
      const parsed = typeof contentRaw === "string" ? JSON.parse(contentRaw) : contentRaw;
      content = { ...DEFAULT_CONTENT, ...parsed };
      if (!Array.isArray(content.heroSlides) || content.heroSlides.length === 0) {
        content.heroSlides = DEFAULT_CONTENT.heroSlides;
      }
    } catch {
      content = DEFAULT_CONTENT;
    }
  }

  useSettings.setState({
    preorderClosed: preorderRaw === "true" || preorderRaw === true,
    content,
    loaded: true,
  });
}

export async function savePreorderClosed(closed: boolean) {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "preorder_closed", value: String(closed) });
  if (error) throw error;
  useSettings.setState({ preorderClosed: closed });
}

export async function saveContent(content: SiteContent) {
  const { error } = await supabase
    .from("app_settings")
    .upsert({ key: "site_content", value: JSON.stringify(content) });
  if (error) throw error;
  useSettings.setState({ content });
}

// Realtime subscription for cross-device sync
export function subscribeSettings() {
  const ch = supabase
    .channel("app_settings-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_settings" },
      () => fetchSettings(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(ch);
  };
}
