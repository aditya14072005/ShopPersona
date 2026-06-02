'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { MapPin, Plus, Trash2, Check } from 'lucide-react';

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

const BLANK: Omit<Address, 'id' | 'isDefault'> = { name: '', phone: '', address: '', city: '', state: '', pincode: '', country: 'US' };
const inputCls = 'w-full bg-muted text-foreground placeholder-muted-foreground px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm';

export default function AddressesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (user) load();
  }, [user, loading]);

  const load = async () => {
    const snap = await getDoc(doc(db, 'user_addresses', user!.uid));
    if (snap.exists()) setAddresses(snap.data().addresses ?? []);
  };

  const save = async (updated: Address[]) => {
    await setDoc(doc(db, 'user_addresses', user!.uid), { addresses: updated });
    setAddresses(updated);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const newAddr: Address = { ...form, id: Date.now().toString(), isDefault: addresses.length === 0 };
    await save([...addresses, newAddr]);
    setForm(BLANK);
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await save(addresses.filter((a) => a.id !== id));
  };

  const handleSetDefault = async (id: string) => {
    await save(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Saved Addresses</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage your delivery addresses</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            <Plus className="w-4 h-4" />{showForm ? 'Cancel' : 'Add Address'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleAdd} className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-foreground">New Address</h3>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} />
              <input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className={inputCls} />
            </div>
            <input placeholder="Street Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required className={inputCls} />
            <div className="grid grid-cols-3 gap-3">
              <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required className={inputCls} />
              <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required className={inputCls} />
              <input placeholder="PIN/ZIP" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required className={inputCls} />
            </div>
            <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required className={inputCls} />
            <button type="submit" disabled={saving} className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors text-sm">
              {saving ? 'Saving...' : 'Save Address'}
            </button>
          </form>
        )}

        {/* Address cards */}
        {addresses.length === 0 && !showForm ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-semibold">No addresses saved yet</p>
            <p className="text-muted-foreground text-sm mt-1">Add an address to speed up checkout</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className={`bg-card border rounded-xl p-5 flex items-start justify-between gap-4 ${addr.isDefault ? 'border-primary' : 'border-border'}`}>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">{addr.name}</p>
                    {addr.isDefault && <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded">DEFAULT</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{addr.phone}</p>
                  <p className="text-sm text-foreground">{addr.address}, {addr.city}, {addr.state} {addr.pincode}, {addr.country}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!addr.isDefault && (
                    <button onClick={() => handleSetDefault(addr.id)} className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Check className="w-3 h-3" />Set Default
                    </button>
                  )}
                  <button onClick={() => handleDelete(addr.id)} className="flex items-center gap-1 text-xs text-destructive hover:underline">
                    <Trash2 className="w-3 h-3" />Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
