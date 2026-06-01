'use client';

import { useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/products';
import Image from 'next/image';

export function VisualSearch() {
  const [imageUrl, setImageUrl] = useState('');
  const [preview, setPreview] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);
    setPreview(imageUrl.trim());
    try {
      const res = await fetch('/api/visual-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageUrl.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results);
      setDescription(data.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Visual search failed');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImageUrl('');
    setPreview('');
    setResults([]);
    setDescription('');
    setSearched(false);
    setError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Camera className="w-5 h-5 text-accent" />
        <h2 className="text-xl font-bold text-foreground">Visual Similarity Search</h2>
        <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full font-semibold">NEW</span>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">
        Paste an image URL — our AI will find visually similar products in our catalogue
      </p>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/product-image.jpg"
          className="flex-1 bg-muted text-foreground placeholder-muted-foreground px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={loading || !imageUrl.trim()}
          className="bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground px-5 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          Find Similar
        </button>
        {searched && (
          <button type="button" onClick={reset} className="p-2.5 rounded-lg border border-border hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {preview && !error && (
        <div className="flex gap-6 items-start">
          <div className="flex-shrink-0">
            <p className="text-xs text-muted-foreground mb-2 font-semibold uppercase">Your Image</p>
            <div className="w-24 h-24 rounded-lg overflow-hidden border border-border bg-muted">
              <Image src={preview} alt="Search image" width={96} height={96} className="w-full h-full object-cover" />
            </div>
          </div>
          {description && (
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1 font-semibold uppercase">AI Description</p>
              <p className="text-sm text-foreground bg-muted rounded-lg p-3 border border-border">{description}</p>
            </div>
          )}
        </div>
      )}

      {searched && !loading && results.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-4">Visually similar products:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
