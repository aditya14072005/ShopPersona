'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { PRODUCTS, type Product } from '@/lib/products';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user) load();
  }, [user, loading]);

  const load = async () => {
    const snap = await getDoc(doc(db, 'wishlists', user!.uid));
    if (snap.exists()) setWishlistIds(snap.data().productIds ?? []);
  };

  const remove = async (productId: string) => {
    try {
      const updated = wishlistIds.filter((id) => id !== productId);
      await setDoc(doc(db, 'wishlists', user!.uid), { productIds: updated });
      setWishlistIds(updated);
    } catch (err) {
      console.error('Remove wishlist error:', err);
    }
  };

  const handleAddToCart = async (product: Product) => {
    setAdding(product.id);
    await addToCart(product, 1);
    setAdding(null);
  };

  const products = PRODUCTS.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Wishlist</h1>
          <p className="text-muted-foreground text-sm mt-1">{products.length} item{products.length !== 1 ? 's' : ''} saved</p>
        </div>

        {products.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-16 text-center">
            <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-semibold text-foreground text-lg mb-2">Your wishlist is empty</p>
            <p className="text-muted-foreground text-sm mb-6">Save items you love by clicking the heart icon on any product</p>
            <Link href="/search" className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                <Link href={`/product/${product.id}`} className="relative block h-48 bg-muted overflow-hidden">
                  <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                </Link>
                <div className="p-4 space-y-3">
                  <Link href={`/product/${product.id}`}>
                    <p className="font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">{product.name}</p>
                  </Link>
                  <p className="text-lg font-bold text-accent">${product.price}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleAddToCart(product)} disabled={adding === product.id}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-sm font-semibold py-2 rounded-lg transition-colors">
                      <ShoppingCart className="w-4 h-4" />{adding === product.id ? 'Adding...' : 'Add to Cart'}
                    </button>
                    <button onClick={() => remove(product.id)}
                      className="p-2 bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
