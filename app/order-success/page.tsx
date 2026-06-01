'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex items-center justify-center py-24 px-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center animate-slideUp">
              <CheckCircle className="w-10 h-10 text-secondary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Order Confirmed!</h1>
            <p className="text-lg text-muted-foreground">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-3 text-left">
            <p className="text-sm text-muted-foreground">
              An order confirmation email will be sent to your registered email address shortly.
            </p>
            <p className="text-sm text-muted-foreground">
              You can track your order status in the "My Orders" section of your account.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Link
              href="/orders"
              className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-colors text-center"
            >
              View Your Orders
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
