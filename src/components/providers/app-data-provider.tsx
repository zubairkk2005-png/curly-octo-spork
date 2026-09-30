"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { computeAnalytics, type Analytics } from "@/lib/analytics";
import type { ValidatedOrder } from "@/lib/csv/schema";
import { generateDemoOrders, generateDemoProducts } from "@/lib/demo-data";
import { convertOrder } from "@/lib/profit";
import { createClient } from "@/lib/supabase/client";
import type {
  CurrencyCode,
  CustomRange,
  DateRangePreset,
  Order,
  Product,
  ProductInput,
  Profile,
} from "@/lib/types";
import { CURRENCY_CODES } from "@/lib/types";

export type AppMode = "supabase" | "demo";
export interface ActionResult {
  ok: boolean;
  error?: string;
}

interface AppData {
  mode: AppMode;
  /** false until browser-only state (local workspace, prefs) has loaded */
  ready: boolean;
  /** true when showing the generated Demo Store */
  isDemo: boolean;
  /** true when the demo dataset was hidden by the user */
  demoHidden: boolean;
  profile: Profile;
  /** raw workspace, original currencies */
  orders: Order[];
  products: Product[];
  /** every order converted to the display currency */
  displayOrders: Order[];
  range: DateRangePreset;
  custom: CustomRange | null;
  currency: CurrencyCode;
  analytics: Analytics;
  now: number;
  setRange: (range: DateRangePreset, custom?: CustomRange | null) => void;
  setCurrency: (c: CurrencyCode) => void;
  importOrders: (rows: ValidatedOrder[]) => Promise<ActionResult & { imported?: number }>;
  saveProduct: (input: ProductInput, id?: string) => Promise<ActionResult>;
  deleteProduct: (id: string) => Promise<ActionResult>;
  saveProfile: (p: Pick<Profile, "full_name" | "business_name" | "currency">) => Promise<ActionResult>;
  setDemoHidden: (hidden: boolean) => void;
  deleteAllData: () => Promise<ActionResult>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AppData | null>(null);

export function useAppData(): AppData {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAppData must be used inside AppDataProvider");
  return v;
}

const WORKSPACE_KEY = "pp_workspace_v1";
const PREFS_KEY = "pp_prefs_v1";
const PROFILE_KEY = "pp_profile_v1";
const HIDE_DEMO_KEY = "pp_hide_demo";

function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full — the app keeps working in memory */
  }
}

const EMPTY_ORDERS: Order[] = [];
const EMPTY_PRODUCTS: Product[] = [];

const orderKey = (o: Pick<Order, "marketplace" | "external_order_id" | "sku">) =>
  `${o.marketplace}|${o.external_order_id}|${o.sku}`.toLowerCase();

async function callApi(url: string, method: string, body?: unknown): Promise<ActionResult & { json?: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) return { ok: false, error: typeof json.error === "string" ? json.error : "Something went wrong. Please try again." };
    return { ok: true, json };
  } catch {
    return { ok: false, error: "We couldn't reach the server. Check your connection and try again." };
  }
}

interface Props {
  mode: AppMode;
  initialOrders: Order[];
  initialProducts: Product[];
  initialProfile: Profile;
  children: ReactNode;
}

export function AppDataProvider({ mode, initialOrders, initialProducts, initialProfile, children }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(mode === "supabase");
  const [now] = useState(() => Date.now());
  const [local, setLocal] = useState<{ orders: Order[]; products: Product[] }>({ orders: [], products: [] });
  const [localProfile, setLocalProfile] = useState<Profile>(initialProfile);
  const [demoHidden, setDemoHiddenState] = useState(false);
  const [range, setRangeState] = useState<DateRangePreset>("30d");
  const [custom, setCustom] = useState<CustomRange | null>(null);
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialProfile.currency);

  // Load browser-only state after mount (keeps SSR and first client render identical).
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const prefs = readJSON<{ range?: DateRangePreset; custom?: CustomRange | null; currency?: CurrencyCode }>(PREFS_KEY);
    if (prefs?.range && ["today", "7d", "30d", "90d", "custom"].includes(prefs.range)) setRangeState(prefs.range);
    if (prefs?.custom) setCustom(prefs.custom);
    if (prefs?.currency && CURRENCY_CODES.includes(prefs.currency)) setCurrencyState(prefs.currency);
    setDemoHiddenState(window.localStorage.getItem(HIDE_DEMO_KEY) === "1");
    if (mode === "demo") {
      const ws = readJSON<{ orders: Order[]; products: Product[] }>(WORKSPACE_KEY);
      if (ws) setLocal({ orders: ws.orders ?? [], products: ws.products ?? [] });
      const p = readJSON<Profile>(PROFILE_KEY);
      if (p) {
        setLocalProfile(p);
        if (!prefs?.currency) setCurrencyState(p.currency);
      }
      setReady(true);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [mode]);

  const realOrders = mode === "supabase" ? initialOrders : local.orders;
  const realProducts = mode === "supabase" ? initialProducts : local.products;
  const profile = mode === "supabase" ? initialProfile : localProfile;
  const hasReal = realOrders.length > 0 || realProducts.length > 0;

  const demoOrders = useMemo(() => generateDemoOrders(now), [now]);
  const demoProducts = useMemo(() => generateDemoProducts(), []);
  const isDemo = !hasReal && !demoHidden;

  const orders = hasReal ? realOrders : isDemo ? demoOrders : EMPTY_ORDERS;
  const products = hasReal ? realProducts : isDemo ? demoProducts : EMPTY_PRODUCTS;

  const displayOrders = useMemo(() => orders.map((o) => convertOrder(o, currency)), [orders, currency]);
  const analytics = useMemo(
    () => computeAnalytics(orders, { range, custom, currency, now }),
    [orders, range, custom, currency, now],
  );

  const persistPrefs = useCallback((next: { range: DateRangePreset; custom: CustomRange | null; currency: CurrencyCode }) => {
    writeJSON(PREFS_KEY, next);
  }, []);

  const setRange = useCallback(
    (r: DateRangePreset, c?: CustomRange | null) => {
      const nextCustom = c === undefined ? custom : c;
      setRangeState(r);
      setCustom(nextCustom);
      persistPrefs({ range: r, custom: nextCustom, currency });
    },
    [custom, currency, persistPrefs],
  );

  const setCurrency = useCallback(
    (c: CurrencyCode) => {
      setCurrencyState(c);
      persistPrefs({ range, custom, currency: c });
    },
    [range, custom, persistPrefs],
  );

  const saveLocal = useCallback((next: { orders: Order[]; products: Product[] }) => {
    setLocal(next);
    writeJSON(WORKSPACE_KEY, next);
  }, []);

  const importOrders = useCallback<AppData["importOrders"]>(
    async (rows) => {
      if (mode === "supabase") {
        const res = await callApi("/api/orders/import", "POST", { orders: rows });
        if (!res.ok) return res;
        router.refresh();
        return { ok: true, imported: Number(res.json?.imported ?? rows.length) };
      }
      const byKey = new Map(local.orders.map((o) => [orderKey(o), o]));
      for (const r of rows) {
        const o: Order = {
          id: crypto.randomUUID(),
          external_order_id: r.order_id,
          marketplace: r.marketplace,
          order_date: r.order_date,
          sku: r.sku,
          product_name: r.product_name,
          quantity: r.quantity,
          sale_price: r.sale_price,
          product_cost: r.product_cost,
          marketplace_fee: r.marketplace_fee,
          shipping_cost: r.shipping_cost,
          ad_cost: r.ad_cost,
          refund_amount: r.refund_amount,
          currency: r.currency,
        };
        const existing = byKey.get(orderKey(o));
        byKey.set(orderKey(o), existing ? { ...o, id: existing.id } : o);
      }
      const knownSkus = new Set(local.products.map((p) => p.sku.toLowerCase()));
      const newProducts = [...local.products];
      for (const r of rows) {
        if (knownSkus.has(r.sku.toLowerCase())) continue;
        knownSkus.add(r.sku.toLowerCase());
        newProducts.push({
          id: crypto.randomUUID(),
          sku: r.sku,
          name: r.product_name,
          marketplace: r.marketplace,
          product_cost: r.product_cost,
          default_shipping_cost: r.shipping_cost,
          default_fee: r.marketplace_fee,
          default_ad_cost: r.ad_cost,
        });
      }
      saveLocal({ orders: [...byKey.values()], products: newProducts });
      return { ok: true, imported: rows.length };
    },
    [mode, local, router, saveLocal],
  );

  const saveProduct = useCallback<AppData["saveProduct"]>(
    async (input, id) => {
      if (mode === "supabase") {
        const res = await callApi(id ? `/api/products/${id}` : "/api/products", id ? "PUT" : "POST", input);
        if (res.ok) router.refresh();
        return res;
      }
      const clash = local.products.some((p) => p.sku.toLowerCase() === input.sku.toLowerCase() && p.id !== id);
      if (clash) return { ok: false, error: "You already have a product with that SKU." };
      if (id && local.products.some((p) => p.id === id)) {
        saveLocal({ ...local, products: local.products.map((p) => (p.id === id ? { ...p, ...input } : p)) });
      } else {
        saveLocal({ ...local, products: [...local.products, { id: crypto.randomUUID(), ...input }] });
      }
      return { ok: true };
    },
    [mode, local, router, saveLocal],
  );

  const deleteProduct = useCallback<AppData["deleteProduct"]>(
    async (id) => {
      if (mode === "supabase") {
        const res = await callApi(`/api/products/${id}`, "DELETE");
        if (res.ok) router.refresh();
        return res;
      }
      saveLocal({ ...local, products: local.products.filter((p) => p.id !== id) });
      return { ok: true };
    },
    [mode, local, router, saveLocal],
  );

  const saveProfile = useCallback<AppData["saveProfile"]>(
    async (p) => {
      if (mode === "supabase") {
        const res = await callApi("/api/profile", "PUT", p);
        if (res.ok) router.refresh();
        return res;
      }
      const next = { ...localProfile, ...p };
      setLocalProfile(next);
      writeJSON(PROFILE_KEY, next);
      return { ok: true };
    },
    [mode, localProfile, router],
  );

  const setDemoHidden = useCallback((hidden: boolean) => {
    setDemoHiddenState(hidden);
    try {
      if (hidden) window.localStorage.setItem(HIDE_DEMO_KEY, "1");
      else window.localStorage.removeItem(HIDE_DEMO_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const deleteAllData = useCallback<AppData["deleteAllData"]>(async () => {
    if (mode === "supabase") {
      const res = await callApi("/api/data", "DELETE");
      if (res.ok) router.refresh();
      return res;
    }
    saveLocal({ orders: [], products: [] });
    return { ok: true };
  }, [mode, router, saveLocal]);

  const signOut = useCallback(async () => {
    if (mode === "supabase") {
      try {
        await createClient().auth.signOut();
      } catch (err) {
        console.error("signOut failed", err);
      }
      router.push("/login");
      router.refresh();
    } else {
      router.push("/");
    }
  }, [mode, router]);

  const value = useMemo<AppData>(
    () => ({
      mode, ready, isDemo, demoHidden, profile, orders, products, displayOrders, range, custom, currency,
      analytics, now, setRange, setCurrency, importOrders, saveProduct, deleteProduct, saveProfile,
      setDemoHidden, deleteAllData, signOut,
    }),
    [mode, ready, isDemo, demoHidden, profile, orders, products, displayOrders, range, custom, currency,
      analytics, now, setRange, setCurrency, importOrders, saveProduct, deleteProduct, saveProfile,
      setDemoHidden, deleteAllData, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
