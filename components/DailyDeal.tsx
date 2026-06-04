'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { PRODUCTS } from '@/lib/products';
import { Tag, Clock } from 'lucide-react';

interface DealData {
  productId: string;
  discountPercent: number;
  expiresAt: string;
}

export function DailyDeal() {
  const [deal, setDeal] = useState<DealData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Live Firestore listener — updates instantly when admin changes the deal
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'daily_deal', 'active'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as DealData;
        const secondsLeft = Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000);
        if (secondsLeft > 0) {
          setDeal(data);
          setTimeLeft(secondsLeft);
          return;
        }
      }
      // No active admin deal — fall back to auto/date-seeded deal
      const now = new Date();
      const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
      const product = PRODUCTS[seed % PRODUCTS.length];
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      setDeal({ productId: product.id, discountPercent: 20, expiresAt: tomorrow.toISOString() });
      setTimeLeft(Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
    });
    return unsub;
  }, []);

  // Countdown tick
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!deal) return null;

  const product = PRODUCTS.find((p) => p.id === deal.productId);
  if (!product) return null;

  const discountedPrice = +(product.price * (1 - deal.discountPercent / 100)).toFixed(2);
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-foreground/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm">⚡ Daily Deal — {deal.discountPercent}% OFF: </span>
            <span className="text-sm">{product.name}</span>
            <span className="ml-2 line-through opacity-70 text-sm">${product.price}</span>
            <span className="ml-1 font-bold text-sm">${discountedPrice}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm font-mono">
            <Clock className="w-4 h-4 opacity-80" />
            <span className="bg-primary-foreground/20 px-2 py-0.5 rounded font-bold">{pad(hours)}</span>
            <span className="font-bold">:</span>
            <span className="bg-primary-foreground/20 px-2 py-0.5 rounded font-bold">{pad(minutes)}</span>
            <span className="font-bold">:</span>
            <span className="bg-primary-foreground/20 px-2 py-0.5 rounded font-bold">{pad(seconds)}</span>
          </div>
          <Link
            href={`/product/${product.id}`}
            className="bg-primary-foreground text-primary text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-primary-foreground/90 transition-colors whitespace-nowrap"
          >
            Grab Deal
          </Link>
        </div>
      </div>
    </div>
  );
}
