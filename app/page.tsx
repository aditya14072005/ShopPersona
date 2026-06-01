'use client';

import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { CollaborativeRecs } from '@/components/CollaborativeRecs';
import { useRecommendations } from '@/lib/recommendations-context';
import { useAuth } from '@/lib/auth-context';
import { useABTesting } from '@/lib/ab-testing-context';
import Link from 'next/link';

export default function Home() {
  const { recommendations } = useRecommendations();
  const { user } = useAuth();
  const { variant } = useABTesting();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 border-b border-border py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center space-y-6 animate-slideUp">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Discover Your <span className="text-primary">Perfect</span> Style
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered personalization tailored just for you. Shop smarter, not harder.
            </p>
            <Link
              href="/search"
              className="bg-primary hover:bg-primary/90 hover:shadow-lg text-primary-foreground px-8 py-3 rounded-lg font-semibold transition-all duration-300 inline-block hover:scale-105 active:scale-95"
            >
              Start Exploring
            </Link>
          </div>
        </div>
      </section>

      {/* AI Recommended Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-foreground">
                {user ? '✨ Recommended for You' : 'Featured for You'}
              </h2>
              {user && (
                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">
                  Strategy {variant}
                </span>
              )}
            </div>
            <p className="text-muted-foreground">
              {user
                ? 'Personalized picks based on your browsing and purchase history'
                : 'Personalized recommendations based on your preferences'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Collaborative Filtering — "Users Like You Also Bought" */}
      <CollaborativeRecs />

      {/* AI Benefits Section */}
      <section className="bg-card border-y border-border py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
            Why Choose ShopPersona?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background border border-border rounded-lg p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">AI Personalization</h3>
              <p className="text-muted-foreground">
                Our AI learns your style and recommends products you&apos;ll love.
              </p>
            </div>

            <div className="bg-background border border-border rounded-lg p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Smart Search</h3>
              <p className="text-muted-foreground">
                Find exactly what you want with intelligent filters and semantic search.
              </p>
            </div>

            <div className="bg-background border border-border rounded-lg p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Secure & Easy</h3>
              <p className="text-muted-foreground">
                Safe checkout with Stripe — multiple payment options for peace of mind.
              </p>
            </div>
          </div>
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
            <p className="text-center text-sm text-muted-foreground">
              &copy; 2024 ShopPersona. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
