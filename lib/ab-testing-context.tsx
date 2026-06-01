'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './auth-context';
import { db } from './firebase';
import { doc, setDoc, increment, getDoc } from 'firebase/firestore';

export type ABVariant = 'A' | 'B';

// A = category-based recommendations (existing)
// B = collaborative filtering recommendations (new)
export interface ABTestResult {
  variant: ABVariant;
  experimentId: string;
}

interface ABTestingContextType {
  variant: ABVariant;
  trackConversion: (experimentId: string, productId: string) => Promise<void>;
  isVariantB: boolean;
}

const ABTestingContext = createContext<ABTestingContextType | undefined>(undefined);

// Deterministic hash so same user always gets same variant
function hashUserId(uid: string): ABVariant {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  return hash % 2 === 0 ? 'A' : 'B';
}

export function ABTestingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [variant, setVariant] = useState<ABVariant>('A');

  useEffect(() => {
    if (user) {
      const v = hashUserId(user.uid);
      setVariant(v);
      // Record assignment
      setDoc(
        doc(db, 'ab_assignments', user.uid),
        { variant: v, experimentId: 'rec_strategy_v1', assignedAt: new Date().toISOString() },
        { merge: true },
      ).catch(() => {});
    }
  }, [user]);

  const trackConversion = async (experimentId: string, productId: string) => {
    if (!user) return;
    const ref = doc(db, 'ab_results', `${experimentId}_${variant}`);
    await setDoc(ref, {
      variant,
      experimentId,
      conversions: increment(1),
      [`product_${productId}`]: increment(1),
    }, { merge: true });
  };

  return (
    <ABTestingContext.Provider value={{ variant, trackConversion, isVariantB: variant === 'B' }}>
      {children}
    </ABTestingContext.Provider>
  );
}

export function useABTesting() {
  const ctx = useContext(ABTestingContext);
  if (!ctx) throw new Error('useABTesting must be used within ABTestingProvider');
  return ctx;
}
