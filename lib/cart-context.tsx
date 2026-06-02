'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { useAuth } from './auth-context';
import { doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (product: CartProduct, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  // Keep a ref of current items for sync writes
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;

  useEffect(() => {
    if (!user || !db) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Real-time listener — cart always stays in sync across tabs/devices
    const unsub = onSnapshot(
      doc(db, 'carts', user.uid),
      (snap) => {
        setItems(snap.exists() ? (snap.data().items ?? []) : []);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Cart sync error:', err);
        setError(`Cart error: ${err.message}. Check Firestore rules.`);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [user?.uid]);

  const save = async (cartItems: CartItem[]) => {
    if (!user || !db) return;
    try {
      await setDoc(doc(db, 'carts', user.uid), {
        items: cartItems,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('Save cart error:', err);
      setError(`Failed to save cart: ${err.message}`);
      throw err;
    }
  };

  const addToCart = async (product: CartProduct, quantity: number) => {
    const current = [...itemsRef.current];
    const existing = current.find((i) => i.productId === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = current.map((i) =>
        i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i,
      );
    } else {
      updated = [...current, {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.image,
      }];
    }
    setItems(updated);
    await save(updated);
  };

  const removeFromCart = async (productId: string) => {
    const updated = itemsRef.current.filter((i) => i.productId !== productId);
    setItems(updated);
    await save(updated);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    const updated = itemsRef.current
      .map((i) => i.productId === productId ? { ...i, quantity } : i)
      .filter((i) => i.quantity > 0);
    setItems(updated);
    await save(updated);
  };

  const clearCart = async () => {
    setItems([]);
    if (user && db) {
      try {
        await deleteDoc(doc(db, 'carts', user.uid));
      } catch (err: any) {
        console.error('Clear cart error:', err);
      }
    }
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, loading, error,
      addToCart, removeFromCart, updateQuantity, clearCart,
      total, itemCount,
    }}>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-destructive text-destructive-foreground text-sm px-4 py-3 rounded-lg shadow-lg max-w-md text-center">
          ⚠️ {error}
        </div>
      )}
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
