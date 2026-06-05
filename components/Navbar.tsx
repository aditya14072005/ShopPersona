'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Menu, X, User, LogOut, Package, MapPin, CreditCard, RefreshCw, Heart, LayoutDashboard, ChevronDown } from 'lucide-react';
import { CATEGORIES } from '@/lib/products';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, userProfile, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push('/');
  };

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const menuItems = [
    { href: '/profile',   icon: User,          label: 'My Account' },
    { href: '/orders',    icon: Package,        label: 'My Orders' },
    { href: '/wishlist',  icon: Heart,          label: 'Wishlist' },
    { href: '/addresses', icon: MapPin,         label: 'Saved Addresses' },
    { href: '/payments',  icon: CreditCard,     label: 'Payment Methods' },
    { href: '/returns',   icon: RefreshCw,      label: 'Returns & Exchanges' },
  ];

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:inline">ShopPersona</span>
          </Link>

          {/* Desktop Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted text-foreground placeholder-muted-foreground pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </form>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-5">
            <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">All Products</Link>
            {CATEGORIES.slice(1, 3).map((cat) => (
              <Link key={cat} href={`/search?category=${cat}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{cat}</Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 hover:bg-muted rounded-lg px-2 py-1.5 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0">
                    {userProfile?.avatar
                      ? <img src={userProfile.avatar} alt="avatar" className="w-full h-full rounded-full object-cover" />
                      : initials}
                  </div>
                  <span className="text-sm font-medium text-foreground hidden lg:block max-w-[100px] truncate">
                    {userProfile?.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-border bg-muted/50">
                      <p className="font-semibold text-foreground text-sm truncate">{userProfile?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{userProfile?.email}</p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      {menuItems.map(({ href, icon: Icon, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors"
                        >
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          {label}
                        </Link>
                      ))}
                      {userProfile?.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary font-semibold hover:bg-muted transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-border py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <User className="w-5 h-5" />
                <span className="hidden lg:inline">Sign In</span>
              </Link>
            )}

            {/* Cart — hidden for admins */}
            {userProfile?.role !== 'admin' && (
              <Link href="/cart" className="relative text-muted-foreground hover:text-foreground transition-colors p-1">
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-foreground p-2">
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-3 pb-4 space-y-2 border-t border-border pt-4">
            <form onSubmit={handleSearch} className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-muted text-foreground placeholder-muted-foreground pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </form>
            <Link href="/search" onClick={() => setIsMenuOpen(false)} className="block text-foreground hover:text-primary py-2">All Products</Link>
            {CATEGORIES.slice(1).map((cat) => (
              <Link key={cat} href={`/search?category=${cat}`} onClick={() => setIsMenuOpen(false)} className="block text-foreground hover:text-primary py-2">{cat}</Link>
            ))}
            <div className="border-t border-border pt-3 space-y-2">
              {user ? (
                <>
                  {menuItems.map(({ href, icon: Icon, label }) => (
                    <Link key={href} href={href} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-foreground hover:text-primary py-2">
                      <Icon className="w-4 h-4" />{label}
                    </Link>
                  ))}
                  {userProfile?.role === 'admin' && (
                    <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 text-primary font-semibold py-2">
                      <LayoutDashboard className="w-4 h-4" />Admin Dashboard
                    </Link>
                  )}
                  <button onClick={handleLogout} className="flex items-center gap-3 text-destructive py-2 w-full">
                    <LogOut className="w-4 h-4" />Sign Out
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block text-foreground hover:text-primary py-2">Sign In</Link>
              )}
              {userProfile?.role !== 'admin' && (
                <Link href="/cart" onClick={() => setIsMenuOpen(false)} className="block text-foreground hover:text-primary py-2">
                  Cart {itemCount > 0 && `(${itemCount})`}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
