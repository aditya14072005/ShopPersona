'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import {
  collection, query, where, onSnapshot, addDoc, updateDoc, doc, orderBy,
} from 'firebase/firestore';
import {
  RefreshCw, Package, CheckCircle, Clock, XCircle, Truck, MessageSquare,
  ChevronDown, ChevronUp, CalendarDays, Send, AlertCircle,
} from 'lucide-react';

interface OrderItem { name: string; quantity: number; }
interface Order { id: string; items: OrderItem[]; total: number; status: string; createdAt: string; }
interface ReturnMsg { id: string; sender: 'user' | 'admin'; text: string; createdAt: string; }
interface ReturnRequest {
  id: string; orderId: string; itemName: string; reason: string; details?: string;
  type: 'return' | 'exchange'; status: string; createdAt: string;
  adminNote?: string; exchangeDate?: string; pickupDate?: string;
}

const REASONS = [
  'Wrong item received', 'Damaged / defective', 'Not as described',
  'Changed my mind', 'Size / fit issue', 'Missing parts', 'Other',
];

// ─── Status timeline steps ────────────────────────────────────────────────────
const RETURN_STEPS = [
  { key: 'pending',   label: 'Submitted',     icon: Clock },
  { key: 'approved',  label: 'Approved',       icon: CheckCircle },
  { key: 'pickup',    label: 'Pickup Scheduled', icon: Truck },
  { key: 'completed', label: 'Completed',      icon: CheckCircle },
];

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Under Review',       cls: 'bg-yellow-500/20 text-yellow-400' },
  approved:  { label: 'Approved',           cls: 'bg-green-500/20 text-green-400' },
  rejected:  { label: 'Rejected',           cls: 'bg-red-500/20 text-red-400' },
  pickup:    { label: 'Pickup Scheduled',   cls: 'bg-blue-500/20 text-blue-400' },
  completed: { label: 'Completed',          cls: 'bg-accent/20 text-accent' },
};

function ReturnTimeline({ status }: { status: string }) {
  if (status === 'rejected') return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
      <span className="text-sm font-semibold text-red-400">Request Rejected</span>
    </div>
  );
  const currentIdx = RETURN_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-start mt-3 pt-3 border-t border-border overflow-x-auto pb-1">
      {RETURN_STEPS.map((step, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors
                ${done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                ${active ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className={`text-xs font-semibold mt-1 whitespace-nowrap ${done ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.label}
              </p>
            </div>
            {i < RETURN_STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 ${i < currentIdx ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Per-request chat ─────────────────────────────────────────────────────────
function ReturnChat({ returnId, userId }: { returnId: string; userId: string }) {
  const [messages, setMessages] = useState<ReturnMsg[]>([]);
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'returns', returnId, 'messages'), orderBy('createdAt', 'asc')),
      (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReturnMsg))),
    );
    return unsub;
  }, [returnId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!msg.trim()) return;
    setSending(true);
    await addDoc(collection(db, 'returns', returnId, 'messages'), {
      sender: 'user', text: msg.trim(), createdAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'returns', returnId), { hasUnread: true });
    setMsg('');
    setSending(false);
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        <MessageSquare className="w-3.5 h-3.5" /> Messages with Support
      </p>
      <div className="bg-muted/30 rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">No messages yet. Ask anything about your request.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs ${
              m.sender === 'user'
                ? 'bg-primary text-primary-foreground rounded-br-none'
                : 'bg-card border border-border text-foreground rounded-bl-none'
            }`}>
              {m.sender === 'admin' && <p className="font-semibold text-primary mb-0.5">Support</p>}
              <p>{m.text}</p>
              <p className="opacity-60 text-right mt-0.5">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input value={msg} onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          className="flex-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <button onClick={send} disabled={sending || !msg.trim()}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50">
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Single return card ───────────────────────────────────────────────────────
function ReturnCard({ r, userId }: { r: ReturnRequest; userId: string }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[r.status] || { label: r.status, cls: 'bg-muted text-muted-foreground' };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full text-left px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{r.itemName}</p>
              <p className="text-xs text-muted-foreground capitalize">{r.type} · {r.reason}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.cls}`}>{meta.label}</span>
            {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Submitted {new Date(r.createdAt).toLocaleDateString()} · Order {r.orderId.slice(0, 12)}…
        </p>
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 space-y-1">
          <ReturnTimeline status={r.status} />

          {/* Exchange / pickup date */}
          {r.exchangeDate && (
            <div className="flex items-center gap-2 mt-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
              <CalendarDays className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <p className="text-sm text-blue-400 font-medium">
                Exchange scheduled: <span className="font-bold">{new Date(r.exchangeDate).toLocaleDateString()}</span>
              </p>
            </div>
          )}
          {r.pickupDate && (
            <div className="flex items-center gap-2 mt-2 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
              <Truck className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <p className="text-sm text-purple-400 font-medium">
                Pickup scheduled: <span className="font-bold">{new Date(r.pickupDate).toLocaleDateString()}</span>
              </p>
            </div>
          )}

          {/* Admin note */}
          {r.adminNote && (
            <div className="flex items-start gap-2 mt-2 bg-muted/50 border border-border rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Admin note</p>
                <p className="text-sm text-foreground">{r.adminNote}</p>
              </div>
            </div>
          )}

          {r.details && (
            <p className="text-sm text-muted-foreground mt-2">
              <span className="font-medium text-foreground">Details:</span> {r.details}
            </p>
          )}

          <ReturnChat returnId={r.id} userId={userId} />
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReturnsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [form, setForm] = useState({
    orderId: '', itemName: '', reason: '', details: '', type: 'return' as 'return' | 'exchange',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (!loading && !user) router.push('/login'); }, [user, loading, router]);

  // Live orders (delivered only)
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, 'orders'), where('userId', '==', user.uid)),
      (snap) => {
        setOrders(
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
            .filter((o) => o.status === 'delivered')
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        );
      },
    );
    return unsub;
  }, [user]);

  // Live returns
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(
      query(collection(db, 'returns'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snap) => setReturns(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ReturnRequest))),
    );
    return unsub;
  }, [user]);

  const selectedOrder = orders.find((o) => o.id === form.orderId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orderId || !form.itemName || !form.reason) return;
    setSubmitting(true);
    await addDoc(collection(db, 'returns'), {
      ...form,
      userId: user!.uid,
      status: 'pending',
      hasUnread: false,
      createdAt: new Date().toISOString(),
    });
    setSuccess(true);
    setForm({ orderId: '', itemName: '', reason: '', details: '', type: 'return' });
    setSubmitting(false);
    setTimeout(() => setSuccess(false), 4000);
  };

  if (loading) return (
    <div className="min-h-screen bg-background"><Navbar />
      <div className="flex items-center justify-center py-24 text-muted-foreground">Loading…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Returns & Exchanges</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Only delivered orders are eligible. Track your request status and chat with support below.
          </p>
        </div>

        {/* Submit form */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" /> New Request
          </h2>

          {orders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No delivered orders eligible for return yet.</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {success && (
                <div className="flex items-center gap-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg p-3 text-sm font-medium">
                  <CheckCircle className="w-4 h-4" /> Request submitted! We'll review it within 3–5 business days.
                </div>
              )}

              {/* Type toggle */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Request Type</label>
                <div className="flex gap-3">
                  {(['return', 'exchange'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors capitalize
                        ${form.type === t ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground border-border hover:bg-muted/80'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Order select */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Order</label>
                <select value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value, itemName: '' })} required
                  className="w-full bg-muted text-foreground px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                  <option value="">— Select order —</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id.slice(0, 12)}… · ${o.total?.toFixed(2)} · {new Date(o.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item select */}
              {selectedOrder && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Item</label>
                  <select value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} required
                    className="w-full bg-muted text-foreground px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                    <option value="">— Select item —</option>
                    {selectedOrder.items.map((item, i) => (
                      <option key={i} value={item.name}>{item.name} × {item.quantity}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Reason</label>
                <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required
                  className="w-full bg-muted text-foreground px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                  <option value="">— Select reason —</option>
                  {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Details */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Additional details <span className="text-xs opacity-60">(optional)</span>
                </label>
                <textarea rows={3} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })}
                  placeholder="Describe the issue in more detail…"
                  className="w-full bg-muted text-foreground px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" />
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors text-sm">
                {submitting ? 'Submitting…' : `Submit ${form.type === 'exchange' ? 'Exchange' : 'Return'} Request`}
              </button>
            </form>
          )}
        </div>

        {/* Past requests */}
        {returns.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" /> My Requests ({returns.length})
            </h2>
            {returns.map((r) => <ReturnCard key={r.id} r={r} userId={user!.uid} />)}
          </div>
        )}
      </div>
    </div>
  );
}
