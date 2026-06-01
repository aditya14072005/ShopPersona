'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Menu, X, User, LogOut } from 'lucide-react';
import { CATEGORIES } from '@/lib/products';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, userProfile, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:inline">ShopPersona</span>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md">
            <form onSubmit={handleSearch} className="w-full relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-muted text-foreground placeholder-muted-foreground pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </form>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/search" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              All Products
            </Link>
            {CATEGORIES.slice(1, 3).map((cat) => (
              <Link key={cat} href={`/search?category=${cat}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {cat}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">{userProfile?.name}</p>
                  {userProfile?.role === 'admin' && (
                    <Link href="/admin" className="text-primary text-xs hover:underline">
                      Admin
                    </Link>
                  )}
                </div>
                <button
                  onClick={() => logout()}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                <User className="w-5 h-5" />
              </Link>
            )}
            <Link href="/cart" className="relative text-muted-foreground hover:text-foreground transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-foreground p-2"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 space-y-3 border-t border-border pt-4 animate-slideDown">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <form onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-muted text-foreground placeholder-muted-foreground pl-10 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </form>
            </div>
            <Link href="/search" className="block text-foreground hover:text-primary py-2">
              All Products
            </Link>
            {CATEGORIES.slice(1).map((cat) => (
              <Link key={cat} href={`/search?category=${cat}`} className="block text-foreground hover:text-primary py-2">
                {cat}
              </Link>
            ))}
            <div className="pt-3 border-t border-border space-y-3">
              {user ? (
                <>
                  <Link href="/profile" className="block text-foreground hover:text-primary py-2">
                    Profile: {userProfile?.name}
                  </Link>
                  {userProfile?.role === 'admin' && (
                    <Link href="/admin" className="block text-foreground hover:text-primary py-2 font-semibold">
                      Admin Dashboard
                    </Link>
                  )}
                  <Link href="/orders" className="block text-foreground hover:text-primary py-2">
                    My Orders
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left text-foreground hover:text-primary py-2"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link href="/login" className="block text-foreground hover:text-primary py-2">
                  Login
                </Link>
              )}
              <Link href="/cart" className="block text-foreground hover:text-primary py-2">
                Cart {itemCount > 0 && `(${itemCount})`}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
