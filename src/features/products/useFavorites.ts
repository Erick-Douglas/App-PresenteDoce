import React, { useCallback, useState } from "react";

import { activeStoreId, pilotStoreId } from "./storeContext";
const STORAGE_KEY = () =>
  activeStoreId() === pilotStoreId
    ? "pd_favorites"
    : "pd_favorites:" + activeStoreId();

function loadFavorites(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY()) ?? "[]");
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  const toggleFavorite = useCallback(
    (productId: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setFavorites((prev) => {
        const next = prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];
        try {
          localStorage.setItem(STORAGE_KEY(), JSON.stringify(next));
        } catch {
          /* Favorites remain usable in this session when storage is unavailable. */
        }
        return next;
      });
    },
    [],
  );

  return { favorites, toggleFavorite };
}
