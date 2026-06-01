'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './firebase';
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { useAuth } from './auth-context';
import { PRODUCTS, type Product } from './products';

interface RecommendationsContextType {
  recommendations: Product[];
  trackView: (productId: string) => void;
  trackPurchase: (productIds: string[]) => void;
}

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

export function RecommendationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  useEffect(() => {
    if (user) loadAndCompute();
    else setRecommendations(PRODUCTS.slice(0, 4));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getUserBehavior = async () => {
    if (!user) return { viewed: [] as string[], purchased: [] as string[] };
    const snap = await getDoc(doc(db, 'user_behavior', user.uid));
    if (!snap.exists()) return { viewed: [] as string[], purchased: [] as string[] };
    return snap.data() as { viewed: string[]; purchased: string[] };
  };

  const loadAndCompute = async () => {
    const { viewed, purchased } = await getUserBehavior();
    setRecommendations(computeRecommendations(viewed, purchased));
  };

  const computeRecommendations = (viewed: string[], purchased: string[]): Product[] => {
    const interacted = [...new Set([...viewed, ...purchased])];

    if (interacted.length === 0) return PRODUCTS.slice(0, 4);

    // Find categories the user has shown interest in
    const categoryScores: Record<string, number> = {};
    interacted.forEach((id) => {
      const product = PRODUCTS.find((p) => p.id === id);
      if (product) {
        categoryScores[product.category] = (categoryScores[product.category] || 0) +
          (purchased.includes(id) ? 3 : 1); // purchases weigh more
      }
    });

    // Score all products not yet purchased
    const scored = PRODUCTS
      .filter((p) => !purchased.includes(p.id))
      .map((p) => ({
        product: p,
        score: (categoryScores[p.category] || 0) + p.rating * 0.5,
      }))
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, 4).map((s) => s.product);
  };

  const trackView = async (productId: string) => {
    if (!user) return;
    const ref = doc(db, 'user_behavior', user.uid);
    await setDoc(ref, { viewed: arrayUnion(productId) }, { merge: true });
    const { viewed, purchased } = await getUserBehavior();
    setRecommendations(computeRecommendations([...viewed, productId], purchased));
  };

  const trackPurchase = async (productIds: string[]) => {
    if (!user) return;
    const ref = doc(db, 'user_behavior', user.uid);
    await setDoc(ref, { purchased: arrayUnion(...productIds) }, { merge: true });
    const { viewed, purchased } = await getUserBehavior();
    setRecommendations(computeRecommendations(viewed, [...purchased, ...productIds]));
  };

  return (
    <RecommendationsContext.Provider value={{ recommendations, trackView, trackPurchase }}>
      {children}
    </RecommendationsContext.Provider>
  );
}

export function useRecommendations() {
  const ctx = useContext(RecommendationsContext);
  if (!ctx) throw new Error('useRecommendations must be used within RecommendationsProvider');
  return ctx;
}
