'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { Suspense } from 'react';
import { CheckCircle, Package, MapPin, Mail, Loader2 } from 'lucide-react';


interface SessionData {
  customerEmail: string;
  amountTotal: number;
  currency: string;
  shipping: {
    name: string;
    address: {
      line1: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  } | null;
  paymentStatus: string;
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const { clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }

    const pending = localStorage.getItem('pending_order');
    let pendingOrder: object | null = null;
    if (pending) {
      try { pendingOrder = JSON.parse(pending); } catch {}
    }

    // Write order server-side via Admin SDK — no client auth needed
    fetch('/api/confirm-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, pendingOrder }),
    }).then(() => localStorage.removeItem('pending_order')).catch(() => {});

    fetch(`/api/order-session?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setSession(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Clear cart only after auth has rehydrated so Firestore write has proper uid
  useEffect(() => {
    if (!authLoading && user && sessionId) {
      clearCart();
    }
  }, [authLoading, user, sessionId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="space-y-6">

          {/* Success Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Order Confirmed!</h1>
            <p className="text-muted-foreground text-lg">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
          </div>

          {/* Order Details Card */}
          {loading ? (
            <div className="bg-card border border-border rounded-xl p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : session ? (
            <div className="bg-card border border-border rounded-xl divide-y divide-border">

              {/* Payment Info */}
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <p className="font-semibold text-foreground capitalize">{session.paymentStatus}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Amount Paid</p>
                  <p className="text-2xl font-bold text-accent">
                    ${(session.amountTotal / 100).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Email */}
              {session.customerEmail && (
                <div className="p-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmation sent to</p>
                    <p className="font-semibold text-foreground">{session.customerEmail}</p>
                  </div>
                </div>
              )}

              {/* Shipping Address */}
              {session.shipping && (
                <div className="p-6 flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Shipping to</p>
                    <p className="font-semibold text-foreground">{session.shipping.name}</p>
                    <p className="text-sm text-muted-foreground">{session.shipping.address.line1}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.shipping.address.city}, {session.shipping.address.state} {session.shipping.address.postal_code}
                    </p>
                    <p className="text-sm text-muted-foreground">{session.shipping.address.country}</p>
                  </div>
                </div>
              )}

              {/* Track Order */}
              <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">What&apos;s next?</p>
                  <p className="font-semibold text-foreground">Track your order in My Orders</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
              Order placed successfully. Check your email for confirmation.
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/orders"
              className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-colors text-center"
            >
              View My Orders
            </Link>
            <Link
              href="/"
              className="block w-full bg-card text-foreground border border-border hover:bg-muted font-semibold py-3 rounded-lg transition-colors text-center"
            >
              Continue Shopping
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
