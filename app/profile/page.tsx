'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { Mail, User, Calendar, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-2">Manage your account information</p>
          </div>

          {/* Profile Card */}
          <div className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Profile Info */}
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <p className="text-lg text-foreground">{userProfile?.name}</p>
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <p className="text-lg text-foreground">{userProfile?.email}</p>
                </div>

                {/* Created Date */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    Member Since
                  </label>
                  <p className="text-lg text-foreground">
                    {userProfile?.createdAt && new Date(userProfile.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Role */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-muted-foreground mb-2">
                    <Shield className="w-4 h-4" />
                    Account Type
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg text-foreground capitalize">{userProfile?.role}</span>
                    {userProfile?.role === 'admin' && (
                      <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-semibold">
                        ADMIN
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-muted rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
                <a
                  href="/orders"
                  className="block bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-lg font-medium transition-colors text-center"
                >
                  View Orders
                </a>
                <a
                  href="/cart"
                  className="block bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-3 rounded-lg font-medium transition-colors text-center"
                >
                  Shopping Cart
                </a>
                {userProfile?.role === 'admin' && (
                  <a
                    href="/admin"
                    className="block bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-3 rounded-lg font-medium transition-colors text-center"
                  >
                    Admin Dashboard
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold text-foreground mb-6">Account Settings</h2>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Additional profile customization and security settings can be configured here in the future.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
