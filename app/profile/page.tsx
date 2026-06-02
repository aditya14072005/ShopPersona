'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Mail, Calendar, Shield, Package, MapPin, CreditCard, RefreshCw, Heart, LayoutDashboard, Edit2, Check, X } from 'lucide-react';

const SECTIONS = [
  { href: '/orders',    icon: Package,     label: 'My Orders',           desc: 'Track, return or buy again' },
  { href: '/wishlist',  icon: Heart,       label: 'Wishlist',            desc: 'Your saved items' },
  { href: '/addresses', icon: MapPin,      label: 'Saved Addresses',     desc: 'Manage delivery addresses' },
  { href: '/payments',  icon: CreditCard,  label: 'Payment Methods',     desc: 'Cards and COD preference' },
  { href: '/returns',   icon: RefreshCw,   label: 'Returns & Exchanges', desc: 'Start a return or exchange' },
];

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (userProfile) setNewName(userProfile.name);
  }, [user, loading, userProfile]);

  const saveName = async () => {
    if (!user || !newName.trim()) return;
    setSaving(true);
    await updateDoc(doc(db, 'users', user.uid), { name: newName.trim() });
    setSaving(false);
    setEditingName(false);
    // Reload to reflect name change
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold flex-shrink-0">
            {userProfile?.avatar
              ? <img src={userProfile.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
              : (userProfile?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?')}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hello, {userProfile?.name?.split(' ')[0]}!</h1>
            <p className="text-muted-foreground text-sm">{userProfile?.email}</p>
          </div>
        </div>

        {/* Account sections grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 hover:shadow-md hover:border-primary/40 transition-all group"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{label}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </Link>
          ))}
          {userProfile?.role === 'admin' && (
            <Link
              href="/admin"
              className="bg-primary/5 border border-primary/30 rounded-xl p-5 flex items-start gap-4 hover:shadow-md hover:border-primary transition-all group"
            >
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <LayoutDashboard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-primary">Admin Dashboard</p>
                <p className="text-sm text-muted-foreground mt-0.5">Manage store, orders & users</p>
              </div>
            </Link>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-bold text-foreground">Account Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase mb-2">
                <User className="w-3.5 h-3.5" />Full Name
              </label>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="flex-1 bg-muted text-foreground px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                  <button onClick={saveName} disabled={saving} className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditingName(false)} className="p-2 bg-muted text-foreground rounded-lg hover:bg-muted/80">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-foreground">{userProfile?.name}</p>
                  <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase mb-2">
                <Mail className="w-3.5 h-3.5" />Email Address
              </label>
              <p className="text-foreground">{userProfile?.email}</p>
            </div>

            {/* Member since */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase mb-2">
                <Calendar className="w-3.5 h-3.5" />Member Since
              </label>
              <p className="text-foreground">
                {userProfile?.createdAt && new Date(userProfile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Role */}
            <div>
              <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase mb-2">
                <Shield className="w-3.5 h-3.5" />Account Type
              </label>
              <div className="flex items-center gap-2">
                <p className="text-foreground capitalize">{userProfile?.role}</p>
                {userProfile?.role === 'admin' && (
                  <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-xs font-bold">ADMIN</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
