'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Package, CheckCircle, Truck, Box, Clock } from 'lucide-react';

interface Order {
  id: string;
  items: { name: string; quantity: number }[];
  total: number;
  status: string;
  createdAt: string;
}

const STATUS_STEPS = [
  { key: 'confirmed',   label: 'Confirmed',   icon: CheckCircle, description: 'Order received' },
  { key: 'processing',  label: 'Processing',  icon: Clock,       description: 'Being prepared' },
  { key: 'shipped',     label: 'Shipped',     icon: Truck,       description: 'On the way' },
  { key: 'delivered',   label: 'Delivered',   icon: Box,         description: 'Delivered!' },
];

function OrderTimeline({ status }: { status: string }) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);

  return (
    <div className="flex items-start gap-0 mt-4 pt-4 border-t border-border overflow-x-auto pb-2">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              } ${active ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className={`text-xs font-semibold mt-1 whitespace-nowrap ${done ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
              <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 transition-colors ${i < currentIndex ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      } finally {
        setOrdersLoading(false);
      }
    })();
  }, [user]);

  if (loading || ordersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-muted-foreground">Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">My Orders</h1>
            <p className="text-muted-foreground mt-2">Track your order status in real time</p>
          </div>

          {orders.length === 0 ? (
            <div className="bg-card border border-border rounded-lg p-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">You haven&apos;t placed any orders yet</p>
              <a href="/" className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors">
                Continue Shopping
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Order ID</p>
                      <p className="text-sm font-mono text-foreground">{order.id.slice(0, 14)}...</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Date</p>
                      <p className="text-sm text-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Total</p>
                      <p className="text-lg font-bold text-accent">${order.total?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Items</p>
                      <p className="text-sm text-foreground">{order.items?.length ?? 0} item(s)</p>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="mt-3 space-y-1">
                    {order.items?.slice(0, 2).map((item, idx) => (
                      <p key={idx} className="text-sm text-foreground">
                        {item.name} <span className="text-muted-foreground">× {item.quantity}</span>
                      </p>
                    ))}
                    {(order.items?.length ?? 0) > 2 && (
                      <p className="text-sm text-muted-foreground">+{order.items.length - 2} more items</p>
                    )}
                  </div>

                  {/* Tracking Timeline */}
                  <OrderTimeline status={order.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
