'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc, onSnapshot, increment, serverTimestamp } from 'firebase/firestore';
import { Eye, AlertTriangle } from 'lucide-react';

interface ProductPresenceProps {
  productId: string;
  stock?: number; // optional — if provided shows low stock warning
}

export function ProductPresence({ productId, stock }: ProductPresenceProps) {
  const [viewers, setViewers] = useState(1);

  useEffect(() => {
    const ref = doc(db, 'product_presence', productId);

    // Increment on mount
    setDoc(ref, { count: increment(1), updatedAt: serverTimestamp() }, { merge: true });

    // Listen for real-time updates
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) setViewers(snap.data().count ?? 1);
    });

    // Decrement on unmount
    return () => {
      unsub();
      setDoc(ref, { count: increment(-1), updatedAt: serverTimestamp() }, { merge: true });
    };
  }, [productId]);

  const isLowStock = stock !== undefined && stock <= 5;

  return (
    <div className="flex flex-col gap-2">
      {viewers > 1 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
          </div>
          <Eye className="w-4 h-4" />
          <span><strong className="text-foreground">{viewers}</strong> people viewing this right now</span>
        </div>
      )}
      {isLowStock && (
        <div className="flex items-center gap-2 text-sm text-destructive font-semibold">
          <AlertTriangle className="w-4 h-4" />
          Only {stock} left in stock — order soon!
        </div>
      )}
    </div>
  );
}
