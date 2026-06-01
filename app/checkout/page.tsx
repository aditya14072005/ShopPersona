'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useRecommendations } from '@/lib/recommendations-context';
import { Truck, Lock } from 'lucide-react';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const { trackPurchase } = useRecommendations();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    if (items.length === 0) { router.push('/cart'); return; }
    setFormData({
      firstName: userProfile?.name?.split(' ')[0] || '',
      lastName: userProfile?.name?.split(' ')[1] || '',
      email: userProfile?.email || '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, items]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Track purchases for AI recommendations
      await trackPurchase(items.map((i) => i.productId));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          userId: user!.uid,
          shipping: formData,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Clear cart then redirect to Stripe
      await clearCart();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
      setIsLoading(false);
    }
  };

  const shippingCost = 10;
  const tax = total * 0.08;
  const finalTotal = total + shippingCost + tax;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Checkout</h1>
              <p className="text-muted-foreground">Complete your purchase securely via Stripe</p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-card border border-border rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Contact Information
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="bg-muted text-foreground placeholder-muted-foreground px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="bg-muted text-foreground placeholder-muted-foreground px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-muted text-foreground placeholder-muted-foreground px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Lock className="w-5 h-5 text-primary" />
                  <p className="text-sm">
                    Payment is handled securely by <span className="font-semibold text-foreground">Stripe</span>.
                    You will be redirected to enter your card details on the next step.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3 rounded-lg transition-colors"
              >
                {isLoading ? 'Redirecting to Stripe...' : `Pay $${finalTotal.toFixed(2)} with Stripe`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6 sticky top-24">
              <h2 className="text-xl font-bold text-foreground">Order Summary</h2>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-foreground">{item.name}</span>
                    <span className="text-muted-foreground">x{item.quantity}</span>
                    <span className="font-semibold text-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-foreground">Subtotal</span>
                  <span className="font-semibold text-foreground">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">Shipping</span>
                  <span className="font-semibold text-foreground">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">Tax</span>
                  <span className="font-semibold text-foreground">${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-accent">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <Link href="/cart" className="block w-full text-center text-primary hover:text-primary/80 py-2 font-medium transition-colors">
                Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
