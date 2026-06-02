'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';

export default function CartPage() {
  const { items, total, removeFromCart, updateQuantity, loading } = useCart();
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && userProfile?.role === 'admin') { router.push('/admin'); return; }
  }, [user, userProfile, authLoading, router]);

  const cartItems = items;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-lg">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8">Start shopping to add items to your cart</p>
            <Link
              href="/search"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-lg p-6 flex gap-4 hover:shadow-lg transition-shadow"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                    
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        disabled={loading}
                        className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-semibold min-w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        disabled={loading}
                        className="p-1 hover:bg-muted rounded transition-colors disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Price & Remove */}
                  <div className="text-right flex flex-col items-end justify-between">
                    <div>
                      <p className="text-lg font-bold text-accent">${(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Subtotal</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      disabled={loading}
                      className="text-destructive hover:bg-destructive/10 p-2 rounded transition-colors disabled:opacity-50"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-card border border-border rounded-lg p-6 h-fit sticky top-24">
              <h3 className="text-xl font-bold text-foreground mb-6">Order Summary</h3>
              
              <div className="space-y-3 mb-6 pb-6 border-b border-border">
                <div className="flex justify-between text-foreground">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-foreground">
                  <span>Shipping</span>
                  <span>{total > 0 ? '$10.00' : '$0.00'}</span>
                </div>
                <div className="flex justify-between text-foreground">
                  <span>Tax</span>
                  <span>${(total * 0.08).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold text-foreground mb-6">
                <span>Total</span>
                <span className="text-accent">${(total + (total > 0 ? 10 : 0) + total * 0.08).toFixed(2)}</span>
              </div>

              {total > 0 ? (
                <>
                  <Link
                    href="/checkout"
                    className="block w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-colors duration-200 mb-3"
                  >
                    Proceed to Checkout
                  </Link>
                  <Link
                    href="/search"
                    className="block w-full text-center bg-card text-foreground border border-border hover:bg-muted py-3 rounded-lg font-semibold transition-colors duration-200"
                  >
                    Continue Shopping
                  </Link>
                </>
              ) : (
                <Link
                  href="/search"
                  className="block w-full text-center bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-colors duration-200"
                >
                  Start Shopping
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
