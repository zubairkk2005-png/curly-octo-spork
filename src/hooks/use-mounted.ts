"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** false during SSR/hydration, true afterwards. Used to render charts client-side only. */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
