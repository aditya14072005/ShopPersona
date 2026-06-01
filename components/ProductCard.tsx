'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star, ShoppingCart, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Product } from '@/lib/products';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useInventory } from '@/lib/inventory-context';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { getPrice, getStock, getPriceChange, decrementStock } = useInventory();
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const dynamicPrice = getPrice(product.id, product.price);
  const stock = getStock(product.id, product.stock);
  const priceChange = getPriceChange(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push('/login'); return; }
    if (stock === 0) return;
    setIsAdding(true);
    try {
      await addToCart({ ...product, price: dynamicPrice }, 1);
      await decrementStock(product.id);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col group">
        <div className="relative w-full h-48 bg-muted overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {stock <= 3 && stock > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Only {stock} left
            </span>
          )}
          {stock === 0 && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="bg-muted text-muted-foreground text-sm font-semibold px-3 py-1 rounded-full">Out of Stock</span>
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{product.description}</p>

          <div className="flex items-center gap-1 mb-3">
            <Star className="w-4 h-4 fill-accent text-accent" />
            <span className="text-sm font-medium text-foreground">{product.rating}</span>
          </div>

          <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-accent">${dynamicPrice}</span>
              {priceChange === 'surge' && <TrendingUp className="w-3.5 h-3.5 text-red-500" title="High demand pricing" />}
              {priceChange === 'discount' && <TrendingDown className="w-3.5 h-3.5 text-green-500" title="Discount pricing" />}
              {dynamicPrice !== product.basePrice && (
                <span className="text-xs text-muted-foreground line-through">${product.basePrice}</span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isAdding || stock === 0}
              className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground p-2 rounded-md transition-all duration-200 hover:scale-110 active:scale-95"
              title={stock === 0 ? 'Out of stock' : user ? 'Add to cart' : 'Login to add to cart'}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
