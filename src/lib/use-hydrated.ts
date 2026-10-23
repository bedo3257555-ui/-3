import { useEffect, useState } from "react";
import { useProtocol } from "@/lib/store";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const persistApi = useProtocol.persist;
    const unsub = persistApi.onFinishHydration(() => setHydrated(true));
    const pending = persistApi.rehydrate() as void | Promise<void>;
    if (pending && typeof pending.then === "function") void pending.then(() => setHydrated(true));
    else setHydrated(true);
    return () => {
      unsub();
    };
  }, []);
  return hydrated;
}
