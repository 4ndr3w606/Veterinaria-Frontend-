import { useEffect, useState } from "react";
import { readLocalStorageJson, setLocalStorageItem } from "@/lib/safeStorage";

const NO_WISHES: number[] = [];

export function useWishes(userKey: string) {
  const [allWishes, setAllWishes] = useState<Record<string, number[]>>(
    () => readLocalStorageJson("lumina:wishes", {}),
  );
  useEffect(() => { setLocalStorageItem("lumina:wishes", JSON.stringify(allWishes)); }, [allWishes]);

  function toggleWish(id: number) {
    setAllWishes((all) => {
      const current = all[userKey] ?? [];
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      return { ...all, [userKey]: next };
    });
  }

  return { wishes: allWishes[userKey] ?? NO_WISHES, toggleWish };
}
