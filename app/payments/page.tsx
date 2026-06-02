'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { CreditCard, Banknote, Check } from 'lucide-react';

type PaymentPreference = 'stripe' | 'cod';

export default function PaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [preference, setPreference] = useState<PaymentPreference>('stripe');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user) load();
  }, [user, loading]);

  const load = async () => {
    const snap = await getDoc(doc(db, 'user_payments', user!.uid));
    if (snap.exists()) setPreference(snap.data().preference ?? 'stripe');
  };

  const save = async () => {
    setSaving(true);
    await setDoc(doc(db, 'user_payments', user!.uid), { preference });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const OPTIONS = [
    { value: 'stripe' as const, icon: CreditCard, label: 'Credit / Debit Card', desc: 'Pay securely via Stripe. Visa, Mastercard, Amex accepted.' },
    { value: 'cod'    as const, icon: Banknote,   label: 'Cash on Delivery (COD)', desc: 'Pay in cash when your order arrives at your door.' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payment Methods</h1>
          <p className="text-muted-foreground text-sm mt-1">Set your preferred default payment method for checkout</p>
        </div>

        <div className="space-y-3">
          {OPTIONS.map(({ value, icon: Icon, label, desc }) => (
            <button
              key={value}
              onClick={() => setPreference(value)}
              className={`w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all ${
                preference === value ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                preference === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
              </div>
              {preference === value && <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />}
            </button>
          ))}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-lg transition-colors"
        >
          {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Preference'}
        </button>

        <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Note</p>
          <p>Your preference is applied automatically at checkout. You can always change it during checkout as well.</p>
        </div>
      </div>
    </div>
  );
}
