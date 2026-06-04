'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useRecommendations } from '@/lib/recommendations-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, collection } from 'firebase/firestore';
import { Truck, Lock, MapPin, CreditCard, Banknote } from 'lucide-react';

const inputCls = 'w-full bg-muted text-foreground placeholder-muted-foreground px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm';

type PaymentMethod = 'stripe' | 'cod';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { trackPurchase } = useRecommendations();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', state: '', pincode: '', country: 'US',
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (userProfile?.role === 'admin') { router.push('/admin'); return; }
    if (items.length === 0) { router.push('/cart'); return; }
    loadPreferences();
  }, [user, userProfile, items, authLoading]);

  const loadPreferences = async () => {
    if (!user) return;

    // Pre-fill from profile
    setFormData((prev) => ({
      ...prev,
      firstName: userProfile?.name?.split(' ')[0] || '',
      lastName: userProfile?.name?.split(' ').slice(1).join(' ') || '',
      email: userProfile?.email || '',
    }));

    // Load saved default address
    const addrSnap = await getDoc(doc(db, 'user_addresses', user.uid));
    if (addrSnap.exists()) {
      const addresses = addrSnap.data().addresses ?? [];
      const def = addresses.find((a: { isDefault: boolean }) => a.isDefault) ?? addresses[0];
      if (def) {
        setFormData((prev) => ({
          ...prev,
          firstName: def.name?.split(' ')[0] || prev.firstName,
          lastName: def.name?.split(' ').slice(1).join(' ') || prev.lastName,
          phone: def.phone || prev.phone,
          address: def.address || '',
          city: def.city || '',
          state: def.state || '',
          pincode: def.pincode || '',
          country: def.country || 'US',
        }));
      }
    }

    // Load saved payment preference
    const paySnap = await getDoc(doc(db, 'user_payments', user.uid));
    if (paySnap.exists()) setPaymentMethod(paySnap.data().preference ?? 'stripe');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await trackPurchase(items.map((i) => i.productId));

      if (paymentMethod === 'cod') {
        // Save COD order directly to Firestore
        await addDoc(collection(db, 'orders'), {
          userId: user!.uid,
          items,
          total: total + 10 + total * 0.08,
          shipping: formData,
          paymentMethod: 'cod',
          status: 'confirmed',
          isTestOrder: userProfile?.role === 'admin',
          createdAt: new Date().toISOString(),
        });
        await clearCart();
        router.push('/order-success');
        return;
      }

      // Stripe
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, userId: user!.uid, shipping: formData }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      // Save pending order data so order-success can write it to Firestore
      localStorage.setItem('pending_order', JSON.stringify({
        userId: user!.uid,
        items,
        total: total + 10 + total * 0.08,
        shipping: formData,
      }));
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
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-3xl font-bold text-foreground">Checkout</h1>

            {error && (
              <div className="bg-destructive/10 border border-destructive/50 rounded-lg p-4 text-destructive text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Contact */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="font-bold text-foreground flex items-center gap-2"><Truck className="w-4 h-4" />Contact Information</h2>
                <div className="grid grid-cols-2 gap-3">
                  <input name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className={inputCls} />
                  <input name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required className={inputCls} />
                </div>
                <input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required className={inputCls} />
                <input name="phone" type="tel" placeholder="Phone Number" value={formData.phone} onChange={handleChange} required className={inputCls} />
              </div>

              {/* Shipping */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="font-bold text-foreground flex items-center gap-2"><MapPin className="w-4 h-4" />Shipping Address</h2>
                <input name="address" placeholder="Street Address" value={formData.address} onChange={handleChange} required className={inputCls} />
                <div className="grid grid-cols-2 gap-3">
                  <input name="city" placeholder="City" value={formData.city} onChange={handleChange} required className={inputCls} />
                  <input name="state" placeholder="State / Province" value={formData.state} onChange={handleChange} required className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input name="pincode" placeholder="PIN / ZIP Code" value={formData.pincode} onChange={handleChange} required className={inputCls} />
                  <input name="country" placeholder="Country" value={formData.country} onChange={handleChange} required className={inputCls} />
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <h2 className="font-bold text-foreground flex items-center gap-2"><CreditCard className="w-4 h-4" />Payment Method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Stripe */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('stripe')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <CreditCard className={`w-5 h-5 flex-shrink-0 ${paymentMethod === 'stripe' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Card / Stripe</p>
                      <p className="text-xs text-muted-foreground">Visa, Mastercard, Amex</p>
                    </div>
                  </button>

                  {/* COD */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <Banknote className={`w-5 h-5 flex-shrink-0 ${paymentMethod === 'cod' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when you receive</p>
                    </div>
                  </button>
                </div>

                {paymentMethod === 'stripe' && (
                  <div className="flex items-start gap-2 bg-muted rounded-lg p-3">
                    <Lock className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">You'll be redirected to Stripe's secure payment page to enter your card details.</p>
                  </div>
                )}
                {paymentMethod === 'cod' && (
                  <div className="flex items-start gap-2 bg-muted rounded-lg p-3">
                    <Banknote className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">Keep exact change ready. Our delivery partner will collect payment at your door.</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3.5 rounded-xl transition-colors text-base"
              >
                {isLoading
                  ? (paymentMethod === 'cod' ? 'Placing Order...' : 'Redirecting to Stripe...')
                  : paymentMethod === 'cod'
                    ? `Place Order — $${finalTotal.toFixed(2)} (COD)`
                    : `Pay $${finalTotal.toFixed(2)} with Stripe →`}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-5 sticky top-24">
              <h2 className="text-xl font-bold text-foreground">Order Summary</h2>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{item.name}</p>
                      <p className="text-muted-foreground">×{item.quantity}</p>
                    </div>
                    <span className="font-semibold text-foreground whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-foreground"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
                <div className="flex justify-between text-foreground"><span>Shipping</span><span>${shippingCost.toFixed(2)}</span></div>
                <div className="flex justify-between text-foreground"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
              </div>

              <div className="border-t border-border pt-4 flex justify-between items-center">
                <span className="text-lg font-bold text-foreground">Total</span>
                <span className="text-2xl font-bold text-accent">${finalTotal.toFixed(2)}</span>
              </div>

              <Link href="/cart" className="block w-full text-center text-primary hover:text-primary/80 text-sm font-medium transition-colors">
                ← Back to Cart
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
