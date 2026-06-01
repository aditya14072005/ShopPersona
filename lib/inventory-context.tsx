'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface InventoryItem {
  productId: string;
  stock: number;
  dynamicPrice: number;
  basePrice: number;
  priceChange: 'surge' | 'discount' | 'normal';
}

interface InventoryContextType {
  inventory: Record<string, InventoryItem>;
  getPrice: (productId: string, fallback: number) => number;
  getStock: (productId: string, fallback: number) => number;
  getPriceChange: (productId: string) => 'surge' | 'discount' | 'normal';
  decrementStock: (productId: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [inventory, setInventory] = useState<Record<string, InventoryItem>>({});

  useEffect(() => {
    fetch('/api/inventory')
      .then((r) => r.json())
      .then(({ inventory: items }: { inventory: InventoryItem[] }) => {
        const map: Record<string, InventoryItem> = {};
        items?.forEach((item) => { map[item.productId] = item; });
        setInventory(map);
      })
      .catch(() => {});
  }, []);

  const getPrice = (productId: string, fallback: number) =>
    inventory[productId]?.dynamicPrice ?? fallback;

  const getStock = (productId: string, fallback: number) =>
    inventory[productId]?.stock ?? fallback;

  const getPriceChange = (productId: string) =>
    inventory[productId]?.priceChange ?? 'normal';

  const decrementStock = async (productId: string) => {
    await fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, delta: -1 }),
    });
    setInventory((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      const newStock = Math.max(0, item.stock - 1);
      return {
        ...prev,
        [productId]: { ...item, stock: newStock },
      };
    });
  };

  return (
    <InventoryContext.Provider value={{ inventory, getPrice, getStock, getPriceChange, decrementStock }}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
}
