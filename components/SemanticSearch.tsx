'use client';

import { useState } from 'react';
import { Sparkles, Search, Loader2 } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/products';

export function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-foreground">AI Semantic Search</h2>
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">NEW</span>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">
        Describe what you&apos;re looking for in natural language — e.g. &quot;something cozy for winter&quot;
      </p>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. noise cancelling audio for travel..."
            className="w-full bg-muted text-foreground placeholder-muted-foreground pl-10 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-5 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Search
        </button>
      </form>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {searched && !loading && (
        results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No matching products found. Try a different description.</p>
        )
      )}
    </div>
  );
}
