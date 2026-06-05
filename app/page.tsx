'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { CollaborativeRecs } from '@/components/CollaborativeRecs';
import { useRecommendations } from '@/lib/recommendations-context';
import { useAuth } from '@/lib/auth-context';
import { useABTesting } from '@/lib/ab-testing-context';
import { subscribeProducts, PRODUCTS as FALLBACK_PRODUCTS } from '@/lib/products';
import type { Product } from '@/lib/products';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Tag, Flame, Star, Zap } from 'lucide-react';

// ─── Hero Slideshow ───────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 'deal',
    badge: '⚡ Today\'s Deal',
    badgeColor: 'bg-red-500',
    headline: 'Up to 40% Off',
    sub: 'Premium Wireless Headphones — limited time only',
    cta: 'Grab Deal',
    href: '/product/1',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&h=500&fit=crop',
    gradient: 'from-violet-900/80 to-violet-600/40',
  },
  {
    id: 'bestseller',
    badge: '🔥 Best Seller',
    badgeColor: 'bg-orange-500',
    headline: 'Designer Backpack',
    sub: 'The #1 most-loved carry-all — only 3 left in stock',
    cta: 'Shop Now',
    href: '/product/5',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&h=500&fit=crop',
    gradient: 'from-amber-900/80 to-amber-600/40',
  },
  {
    id: 'new',
    badge: '✨ New Arrival',
    badgeColor: 'bg-emerald-500',
    headline: 'Minimalist Watch',
    sub: 'Sapphire crystal · Leather strap · Timeless elegance',
    cta: 'Explore',
    href: '/product/2',
    image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=900&h=500&fit=crop',
    gradient: 'from-emerald-900/80 to-teal-600/40',
  },
  {
    id: 'offer',
    badge: '🎁 Special Offer',
    badgeColor: 'bg-pink-500',
    headline: 'Smart Home Bundle',
    sub: 'Smart Speaker + Ceramic Vase Set — perfect together',
    cta: 'View Offer',
    href: '/search',
    image: 'https://images.unsplash.com/photo-1589003077984-894e133da26d?w=900&h=500&fit=crop',
    gradient: 'from-pink-900/80 to-rose-600/40',
  },
];

function HeroSlideshow() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), []);
  const prev = () => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, 4500);
    return () => clearInterval(timerRef.current!);
  }, [paused, next]);

  const slide = SLIDES[current];

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(320px, 55vw, 540px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {SLIDES.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img src={s.image} alt={s.headline} className="w-full h-full object-cover" />
          <div className={`absolute inset-0 bg-gradient-to-r ${s.gradient}`} />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 h-full flex flex-col justify-center px-8 sm:px-16 max-w-2xl">
        <span className={`inline-flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1 rounded-full w-fit mb-4 ${slide.badgeColor}`}>
          {slide.badge}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-3 drop-shadow-lg">
          {slide.headline}
        </h1>
        <p className="text-sm sm:text-base text-white/80 mb-6 max-w-sm">{slide.sub}</p>
        <Link
          href={slide.href}
          className="inline-block bg-white text-gray-900 font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-white/90 transition-all w-fit shadow-lg hover:scale-105 active:scale-95"
        >
          {slide.cta} →
        </Link>
      </div>

      {/* Arrows */}
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? 'bg-white w-6' : 'bg-white/40 w-1.5'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Category Quick-Pick ──────────────────────────────────────────────────────
const CATEGORY_TILES = [
  { label: 'Electronics', emoji: '📱', color: 'from-violet-500/20 to-violet-600/10', border: 'border-violet-500/30', href: '/search?category=Electronics' },
  { label: 'Fashion',     emoji: '👗', color: 'from-pink-500/20 to-pink-600/10',    border: 'border-pink-500/30',    href: '/search?category=Fashion' },
  { label: 'Home',        emoji: '🏠', color: 'from-cyan-500/20 to-cyan-600/10',    border: 'border-cyan-500/30',    href: '/search?category=Home' },
  { label: 'Books',       emoji: '📚', color: 'from-amber-500/20 to-amber-600/10',  border: 'border-amber-500/30',   href: '/search?category=Books' },
  { label: 'Sports',      emoji: '⚽', color: 'from-emerald-500/20 to-emerald-600/10', border: 'border-emerald-500/30', href: '/search?category=Sports' },
  { label: 'Deals',       emoji: '🔥', color: 'from-red-500/20 to-red-600/10',      border: 'border-red-500/30',     href: '/search' },
];

// ─── Brands ───────────────────────────────────────────────────────────────────
const BRANDS = [
  { name: 'Apple',    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg' },
  { name: 'Samsung',  logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg' },
  { name: 'Nike',     logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg' },
  { name: 'Adidas',   logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/Adidas_Logo.svg' },
  { name: 'Sony',     logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg' },
  { name: 'IKEA',     logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Ikea_logo.svg' },
  { name: 'Zara',     logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/Zara_Logo.svg' },
  { name: 'H&M',      logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/H%26M-Logo.svg' },
];

// ─── Mini stat strip ─────────────────────────────────────────────────────────
const PERKS = [
  { icon: Zap,  label: 'Free Shipping',   sub: 'On orders over ₹999' },
  { icon: Star, label: 'Top Rated',        sub: '4.8★ avg across products' },
  { icon: Flame, label: 'Hot Deals Daily', sub: 'New offers every 24h' },
  { icon: Tag,  label: 'Best Price',       sub: 'Price-match guarantee' },
];

export default function Home() {
  const { recommendations } = useRecommendations();
  const { user } = useAuth();
  const { variant } = useABTesting();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>(FALLBACK_PRODUCTS);

  useEffect(() => {
    const unsub = subscribeProducts(setAllProducts);
    return unsub;
  }, []);

  const filteredRecs = activeCategory
    ? recommendations.filter((p) => p.category === activeCategory)
    : recommendations;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Slideshow */}
      <HeroSlideshow />

      {/* Perks strip */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
            {PERKS.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shop by Category */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-2">
        <h2 className="text-xl font-bold text-foreground mb-4">Shop by Category</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORY_TILES.map((cat) => (
            <Link
              key={cat.label}
              href={cat.href}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border bg-gradient-to-br ${cat.color} ${cat.border} hover:scale-105 active:scale-95 transition-transform cursor-pointer`}
            >
              <span className="text-3xl">{cat.emoji}</span>
              <span className="text-xs font-semibold text-foreground">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* AI Recommended Products */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-foreground">
                {user ? '✨ Recommended for You' : 'Featured for You'}
              </h2>
              {user && (
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  Strategy {variant}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {user ? 'Personalized picks based on your history' : 'Top picks across our catalogue'}
            </p>
          </div>
          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            {['All', 'Electronics', 'Fashion', 'Home', 'Books', 'Sports'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === 'All' ? null : cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                  (cat === 'All' && !activeCategory) || activeCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(filteredRecs.length ? filteredRecs : allProducts.slice(0, 4)).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Collaborative Filtering */}
      <CollaborativeRecs />

      {/* Best Sellers row */}
      <section className="max-w-7xl mx-auto px-4 pb-10">
        <div className="flex items-center gap-2 mb-5">
          <Flame className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-bold text-foreground">Best Sellers</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...allProducts].sort((a, b) => b.rating - a.rating).slice(0, 4).map((p) => (
            <Link key={p.id} href={`/product/${p.id}`}
              className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="relative">
                <img src={p.image} alt={p.name} className="w-full h-40 object-cover" />
                <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Hot
                </span>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-bold text-primary">₹{p.price.toLocaleString('en-IN')}</p>
                  <span className="text-xs text-yellow-400">★ {p.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Big Brands */}
      <section className="bg-card border-y border-border py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center">Top Brands</h2>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 items-center">
            {BRANDS.map((b) => (
              <div key={b.name}
                className="flex items-center justify-center p-3 rounded-xl bg-background border border-border hover:border-primary/40 transition-colors opacity-70 hover:opacity-100 cursor-pointer h-14">
                <img src={b.logo} alt={b.name} className="max-h-7 max-w-full object-contain dark:invert" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why ShopPersona */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-foreground mb-10 text-center">Why Choose ShopPersona?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { emoji: '🎯', title: 'AI Personalization', body: 'Our AI learns your style and recommends products you\'ll love.', color: 'bg-primary/20' },
            { emoji: '⚡', title: 'Smart Search',       body: 'Find exactly what you want with intelligent filters and semantic search.', color: 'bg-accent/20' },
            { emoji: '🛡️', title: 'Secure & Easy',     body: 'Safe checkout with Stripe — multiple payment options for peace of mind.', color: 'bg-secondary/20' },
          ].map(({ emoji, title, body, color }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4`}>
                <span className="text-2xl">{emoji}</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
              <p className="text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4">About</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Returns</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Follow Us</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Facebook</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8">
            <p className="text-center text-sm text-muted-foreground">&copy; 2024 ShopPersona. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
