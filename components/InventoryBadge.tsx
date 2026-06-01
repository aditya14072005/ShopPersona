'use client';

import { TrendingUp, TrendingDown, Package } from 'lucide-react';
import { useInventory } from '@/lib/inventory-context';

interface InventoryBadgeProps {
  productId: string;
  basePrice: number;
  showStock?: boolean;
}

export function InventoryBadge({ productId, basePrice, showStock = false }: InventoryBadgeProps) {
  const { getPrice, getStock, getPriceChange } = useInventory();
  const price = getPrice(productId, basePrice);
  const stock = getStock(productId, 10);
  const priceChange = getPriceChange(productId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-3xl font-bold text-accent">${price}</span>

      {priceChange === 'surge' && (
        <span className="flex items-center gap-1 text-xs bg-red-500/10 text-red-500 px-2 py-1 rounded-full font-semibold">
          <TrendingUp className="w-3 h-3" />
          High Demand
        </span>
      )}
      {priceChange === 'discount' && (
        <span className="flex items-center gap-1 text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full font-semibold">
          <TrendingDown className="w-3 h-3" />
          On Sale
        </span>
      )}
      {price !== basePrice && (
        <span className="text-sm text-muted-foreground line-through">${basePrice}</span>
      )}

      {showStock && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Package className="w-3 h-3" />
          {stock === 0 ? (
            <span className="text-destructive font-semibold">Out of stock</span>
          ) : stock <= 3 ? (
            <span className="text-red-500 font-semibold">Only {stock} left!</span>
          ) : stock <= 8 ? (
            <span className="text-yellow-500 font-semibold">Low stock ({stock})</span>
          ) : (
            <span>{stock} in stock</span>
          )}
        </div>
      )}
    </div>
  );
}
