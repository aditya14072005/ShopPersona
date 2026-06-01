'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from './firebase';
import { useAuth } from './auth-context';
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

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
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Load cart from Firestore when user changes
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      setItems([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadCart = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const cartDocRef = doc(db, 'carts', user.uid);
      const cartDocSnap = await getDoc(cartDocRef);

      if (cartDocSnap.exists()) {
        setItems(cartDocSnap.data().items || []);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error('Error loading cart:', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const saveCart = async (cartItems: CartItem[]) => {
    if (!user) return;
    try {
      const cartDocRef = doc(db, 'carts', user.uid);
      await setDoc(cartDocRef, { items: cartItems, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Error saving cart:', err);
    }
  };

  const addToCart = async (product: CartProduct, quantity: number) => {
    const newItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity,
      image: product.image,
    };

    const updatedItems = [...items];
    const existingItem = updatedItems.find((item) => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      updatedItems.push(newItem);
    }

    setItems(updatedItems);
    await saveCart(updatedItems);
  };

  const removeFromCart = async (productId: string) => {
    const updatedItems = items.filter((item) => item.productId !== productId);
    setItems(updatedItems);
    await saveCart(updatedItems);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    const updatedItems = items
      .map((item) => (item.productId === productId ? { ...item, quantity } : item))
      .filter((item) => item.quantity > 0);

    setItems(updatedItems);
    await saveCart(updatedItems);
  };

  const clearCart = async () => {
    setItems([]);
    if (user) {
      try {
        await deleteDoc(doc(db, 'carts', user.uid));
      } catch (err) {
        console.error('Error clearing cart:', err);
      }
    }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextType = {
    items,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total,
    itemCount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
