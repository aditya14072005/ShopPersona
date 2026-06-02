'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { useRef } from 'react';
import {
  Package, CheckCircle, Truck, Box, Clock, ChevronDown, ChevronUp,
  CreditCard, Banknote, XCircle, LifeBuoy, RefreshCw, Printer, MapPin,
} from 'lucide-react';

interface OrderItem { name: string; quantity: number; price: number; productId: string; image?: string; }
interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  paymentMethod?: string;
  stripeSessionId?: string;
  shipping?: { firstName: string; lastName: string; email: string; phone?: string; address?: string; city?: string; state?: string; pincode?: string; country?: string; };
}
interface SupportMessage { id: string; sender: 'user' | 'admin'; text: string; createdAt: string; }

// ─── Status timeline ──────────────────────────────────────────────────────────
const STATUS_STEPS = [
  { key: 'confirmed',  label: 'Confirmed',  icon: CheckCircle, description: 'Order received' },
  { key: 'processing', label: 'Processing', icon: Clock,       description: 'Being prepared' },
  { key: 'shipped',    label: 'Shipped',    icon: Truck,       description: 'On the way' },
  { key: 'delivered',  label: 'Delivered',  icon: Box,         description: 'Delivered!' },
];

const STATUS_COLORS: Record<string, string> = {
  confirmed:              'bg-blue-500/20 text-blue-400',
  processing:             'bg-yellow-500/20 text-yellow-400',
  shipped:                'bg-purple-500/20 text-purple-400',
  delivered:              'bg-green-500/20 text-green-400',
  cancelled:              'bg-red-500/20 text-red-400',
  cancellation_requested:  'bg-orange-500/20 text-orange-400',
  cancellation_rejected:    'bg-yellow-500/20 text-yellow-400',
};

function OrderTimeline({ status }: { status: string }) {
  const currentIndex = STATUS_STEPS.findIndex((s) => s.key === status);
  if (status === 'cancelled') return (
    <div className="mt-4 pt-4 border-t border-border space-y-1">
      <span className="text-sm font-semibold text-red-400 flex items-center gap-2"><XCircle className="w-4 h-4" /> Order Cancelled</span>
      <p className="text-xs text-muted-foreground">Your cancellation request was approved by admin.</p>
    </div>
  );
  if (status === 'cancellation_rejected') return (
    <div className="mt-4 pt-4 border-t border-border space-y-1">
      <span className="text-sm font-semibold text-yellow-400 flex items-center gap-2"><XCircle className="w-4 h-4" /> Cancellation Request Rejected</span>
      <p className="text-xs text-muted-foreground">Admin reviewed and rejected your cancellation request. Your order is still active.</p>
    </div>
  );
  return (
    <div className="flex items-start mt-4 pt-4 border-t border-border overflow-x-auto pb-1">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const active = i === currentIndex;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} ${active ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className={`text-xs font-semibold mt-1 whitespace-nowrap ${done ? 'text-primary' : 'text-muted-foreground'}`}>{step.label}</p>
              <p className="text-xs text-muted-foreground hidden sm:block">{step.description}</p>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 ${i < currentIndex ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Support modal ────────────────────────────────────────────────────────────
function SupportModal({ order, userId, onClose }: { order: Order; userId: string; onClose: () => void }) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Find or create ticket, then subscribe to messages
  useEffect(() => {
    let unsub: () => void;
    (async () => {
      const q = query(collection(db, 'support_tickets'), where('orderId', '==', order.id), where('userId', '==', userId));
      const snap = await import('firebase/firestore').then(({ getDocs }) => getDocs(q));
      let id: string;
      if (!snap.empty) {
        id = snap.docs[0].id;
      } else {
        const ref = await addDoc(collection(db, 'support_tickets'), {
          orderId: order.id, userId, status: 'open', createdAt: new Date().toISOString(),
        });
        id = ref.id;
      }
      setTicketId(id);
      unsub = onSnapshot(
        query(collection(db, 'support_tickets', id, 'messages'), orderBy('createdAt', 'asc')),
        (s) => setMessages(s.docs.map((d) => ({ id: d.id, ...d.data() } as SupportMessage))),
      );
    })();
    return () => { unsub?.(); };
  }, [order.id, userId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if (!msg.trim() || !ticketId) return;
    setSending(true);
    await addDoc(collection(db, 'support_tickets', ticketId, 'messages'), {
      sender: 'user', text: msg.trim(), createdAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'support_tickets', ticketId), { status: 'open', updatedAt: new Date().toISOString() });
    setMsg('');
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl w-full max-w-md flex flex-col" style={{ maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2"><LifeBuoy className="w-4 h-4 text-primary" /> Support — Order {order.id.slice(0, 10)}…</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-[200px]">
          {messages.length === 0 && <p className="text-xs text-muted-foreground text-center pt-6">No messages yet. Describe your issue below.</p>}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                m.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted text-foreground rounded-bl-none'
              }`}>
                {m.sender === 'admin' && <p className="text-xs font-semibold mb-0.5 text-primary">Support</p>}
                <p>{m.text}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        {/* Input */}
        <div className="px-4 py-3 border-t border-border flex gap-2">
          <input value={msg} onChange={(e) => setMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message…"
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          <button onClick={handleSend} disabled={sending || !msg.trim()}
            className="px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">Send</button>
        </div>
      </div>
    </div>
  );
}

// ─── Invoice print ────────────────────────────────────────────────────────────
function printInvoice(order: Order) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>Invoice — ${order.id.slice(0, 10)}</title>
    <style>body{font-family:sans-serif;padding:40px;color:#111}table{width:100%;border-collapse:collapse}td,th{padding:8px 12px;border:1px solid #ddd;text-align:left}th{background:#f5f5f5}.total{font-size:1.2rem;font-weight:bold}</style>
    </head><body>
    <h2>ShopPersona — Invoice</h2>
    <p><b>Order ID:</b> ${order.id}</p>
    <p><b>Date:</b> ${new Date(order.createdAt).toLocaleString()}</p>
    <p><b>Status:</b> ${order.status}</p>
    <p><b>Payment:</b> ${order.paymentMethod === 'stripe' ? 'Card / Stripe' : 'Cash on Delivery'}</p>
    ${order.shipping ? `<p><b>Ship to:</b> ${order.shipping.firstName} ${order.shipping.lastName}, ${order.shipping.address || ''}, ${order.shipping.city || ''}, ${order.shipping.country || ''}</p>` : ''}
    <table><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
    ${(order.items || []).map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>$${i.price?.toFixed(2) ?? '—'}</td><td>$${((i.price || 0) * i.quantity).toFixed(2)}</td></tr>`).join('')}
    </table>
    <p class="total" style="margin-top:16px">Total: $${order.total?.toFixed(2)}</p>
    <script>window.print();window.close();</script>
    </body></html>
  `);
  win.document.close();
}

// ─── Order card ───────────────────────────────────────────────────────────────
function OrderCard({ order, userId, onCancelled }: { order: Order; userId: string; onCancelled: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const canRequestCancel = ['confirmed', 'processing'].includes(order.status);

  const handleRequestCancel = async () => {
    if (!confirm('Request cancellation? An admin will review and approve it.')) return;
    setRequesting(true);
    await updateDoc(doc(db, 'orders', order.id), { status: 'cancellation_requested' });
    onCancelled(order.id); // reuse to trigger local status update
    setRequesting(false);
  };

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-colors">
        {/* Clickable header row */}
        <button onClick={() => setOpen(!open)} className="w-full text-left px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase">Order</p>
                <p className="text-sm font-mono text-foreground">{order.id.slice(0, 16)}…</p>
              </div>
            </div>
            <div className="hidden sm:block">
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-sm text-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-accent">${order.total?.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[order.status] || 'bg-muted text-muted-foreground'}`}>
                {order.status === 'cancellation_requested' ? 'Cancel Requested'
                  : order.status === 'cancellation_rejected' ? 'Cancel Rejected'
                  : order.status}
              </span>
              {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>

          {/* Items preview when collapsed */}
          {!open && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5">
              {order.items?.slice(0, 3).map((item, i) => (
                <p key={i} className="text-xs text-muted-foreground">{item.name} × {item.quantity}</p>
              ))}
              {(order.items?.length ?? 0) > 3 && <p className="text-xs text-muted-foreground">+{order.items.length - 3} more</p>}
            </div>
          )}
        </button>

        {/* Expanded details */}
        {open && (
          <div className="border-t border-border px-6 pb-6 space-y-5">
            {/* Timeline */}
            <OrderTimeline status={order.status} />

            {/* All items */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Items Ordered</p>
              <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 bg-muted/30">
                    {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground whitespace-nowrap">
                      ${((item.price || 0) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment + Shipping info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Payment Info
                </p>
                <p className="text-sm text-foreground font-medium flex items-center gap-2">
                  {order.paymentMethod === 'stripe'
                    ? <><CreditCard className="w-4 h-4 text-purple-400" /> Card / Stripe</>
                    : <><Banknote className="w-4 h-4 text-yellow-400" /> Cash on Delivery</>}
                </p>
                {order.stripeSessionId && (
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    Session: {order.stripeSessionId.slice(0, 24)}…
                  </p>
                )}
                <p className="text-sm font-bold text-accent">
                  {order.status === 'cancelled'
                    ? order.stripeSessionId ? `Refund due: $${order.total?.toFixed(2)}` : 'No charge (COD — cancelled)'
                    : `${order.stripeSessionId ? 'Total paid' : 'Total (COD)'}: $${order.total?.toFixed(2)}`
                  }
                </p>
              </div>

              {order.shipping && (
                <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Shipping Address
                  </p>
                  <p className="text-sm font-medium text-foreground">{order.shipping.firstName} {order.shipping.lastName}</p>
                  {order.shipping.email && <p className="text-xs text-muted-foreground">{order.shipping.email}</p>}
                  {order.shipping.phone && <p className="text-xs text-muted-foreground">{order.shipping.phone}</p>}
                  {order.shipping.address && <p className="text-xs text-muted-foreground">{order.shipping.address}</p>}
                  {order.shipping.city && (
                    <p className="text-xs text-muted-foreground">
                      {order.shipping.city}{order.shipping.state ? `, ${order.shipping.state}` : ''} {order.shipping.pincode}
                    </p>
                  )}
                  {order.shipping.country && <p className="text-xs text-muted-foreground">{order.shipping.country}</p>}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              {canRequestCancel && (
                <button onClick={handleRequestCancel} disabled={requesting}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 disabled:opacity-50 transition-colors">
                  <XCircle className="w-3.5 h-3.5" />{requesting ? 'Requesting…' : 'Request Cancellation'}
                </button>
              )}
              {order.status === 'cancellation_requested' && (
                <span className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-orange-500/10 text-orange-400">
                  <Clock className="w-3.5 h-3.5" /> Cancellation Pending Admin Approval
                </span>
              )}
              {order.status === 'cancellation_rejected' && (
                <span className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-yellow-500/10 text-yellow-400">
                  <XCircle className="w-3.5 h-3.5" /> Cancellation Rejected by Admin
                </span>
              )}
              {order.status === 'delivered' && (
                <a href="/returns"
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" /> Return / Exchange
                </a>
              )}
                      <button onClick={(e) => { e.stopPropagation(); setShowSupport(true); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                <LifeBuoy className="w-3.5 h-3.5" /> Support
              </button>
              <button onClick={() => printInvoice(order)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
                <Printer className="w-3.5 h-3.5" /> Invoice
              </button>
            </div>
          </div>
        )}
      </div>

      {showSupport && <SupportModal order={order} userId={userId} onClose={() => setShowSupport(false)} />}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);



  const handleCancelled = (id: string) =>
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: 'cancellation_requested' } : o));

  // Switch to live listener so admin status changes (reject/approve) reflect instantly
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      );
      setOrdersLoading(false);
    });
    return unsub;
  }, [user]);

  if (loading || ordersLoading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center py-24 text-muted-foreground">Loading orders…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground mt-1 text-sm">Click any order to see full details, track, cancel or get support</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">You haven&apos;t placed any orders yet</p>
            <a href="/" className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium transition-colors">
              Continue Shopping
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} userId={user!.uid} onCancelled={handleCancelled} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
