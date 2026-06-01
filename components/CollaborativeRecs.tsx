'use client';

import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { useAuth } from '@/lib/auth-context';
import { useABTesting } from '@/lib/ab-testing-context';
import type { Product } from '@/lib/products';

export function CollaborativeRecs() {
  const { user } = useAuth();
  const { trackConversion } = useABTesting();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`/api/collaborative?userId=${user.uid}`)
      .then((r) => r.json())
      .then(({ results }) => setProducts(results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || loading || products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Customers Like You Also Bought</h2>
            <p className="text-sm text-muted-foreground">Based on purchase patterns from shoppers with similar taste</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} onClick={() => trackConversion('rec_strategy_v1', product.id)}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
