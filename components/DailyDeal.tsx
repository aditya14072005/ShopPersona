'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRecommendations } from '@/lib/recommendations-context';
import { PRODUCTS, type Product } from '@/lib/products';
import { Tag, Clock } from 'lucide-react';

interface DealData {
  product: Product;
  discountPercent: number;
  discountedPrice: number;
  secondsLeft: number;
}

export function DailyDeal() {
  const { recommendations } = useRecommendations();
  const [deal, setDeal] = useState<DealData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // Determine top category from recommendations
    const topCategory = recommendations[0]?.category ?? null;
    const url = topCategory ? `/api/daily-deal?category=${encodeURIComponent(topCategory)}` : '/api/daily-deal';

    fetch(url)
      .then((r) => r.json())
      .then((data: DealData) => {
        setDeal(data);
        setTimeLeft(data.secondsLeft);
      });
  }, [recommendations]);

  // Countdown tick
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!deal) return null;

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
            <span className="text-sm">{deal.product.name}</span>
            <span className="ml-2 line-through opacity-70 text-sm">${deal.product.price}</span>
            <span className="ml-1 font-bold text-sm">${deal.discountedPrice}</span>
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
            href={`/product/${deal.product.id}`}
            className="bg-primary-foreground text-primary text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-primary-foreground/90 transition-colors whitespace-nowrap"
          >
            Grab Deal
          </Link>
        </div>
      </div>
    </div>
  );
}
