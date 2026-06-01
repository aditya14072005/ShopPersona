'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { SemanticSearch } from '@/components/SemanticSearch';
import { VisualSearch } from '@/components/VisualSearch';
import { PRODUCTS, CATEGORIES } from '@/lib/products';
import { X } from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync search term and category from URL params (e.g. from Navbar search)
  useEffect(() => {
    const q = searchParams.get('q');
    const category = searchParams.get('category');
    if (q) setSearchTerm(q);
    if (category) setSelectedCategory(category);
  }, [searchParams]);

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const categoryMatch = selectedCategory === 'All' || product.category === selectedCategory;
      const priceMatch = product.price >= priceRange[0] && product.price <= priceRange[1];
      const searchMatch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase());

      return categoryMatch && priceMatch && searchMatch;
    });
  }, [selectedCategory, priceRange, searchTerm]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Search Products</h1>
          <p className="text-muted-foreground">
            Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* AI-powered search tools */}
        <div className="space-y-8 mb-10 p-6 bg-card border border-border rounded-xl">
          <SemanticSearch />
          <div className="border-t border-border" />
          <VisualSearch />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="space-y-6">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Search
              </label>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Category
              </label>
              <div className="space-y-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border text-foreground hover:bg-muted'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-3">
                Price Range
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="500"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full cursor-pointer"
                />
                <div className="flex gap-2">
                  <span className="text-sm text-muted-foreground">
                    ${priceRange[0]}
                  </span>
                  <span className="text-sm text-muted-foreground">-</span>
                  <span className="text-sm text-muted-foreground">
                    ${priceRange[1]}
                  </span>
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedCategory !== 'All' || searchTerm || priceRange[1] !== 500) && (
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchTerm('');
                  setPriceRange([0, 500]);
                }}
                className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground px-4 py-2 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 bg-card border border-border rounded-lg">
                <span className="text-5xl mb-4">🔍</span>
                <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground text-center">
                  Try adjusting your filters or search terms
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}
