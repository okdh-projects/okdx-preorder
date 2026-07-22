import { create } from "zustand";
import { supabase } from "./supabase";

type SettingsState = {
  preorderClosed: boolean;
  loaded: boolean;
  setPreorderClosed: (v: boolean) => void;
};

export const useSettings = create<SettingsState>((set) => ({
  preorderClosed: false,
  loaded: false,
  setPreorderClosed: (v) => set({ preorderClosed: v }),
}));

export async function fetchSettings() {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "preorder_closed")
    .maybeSingle();
  useSettings.setState({
    preorderClosed: data?.value === "true" || data?.value === true,
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
