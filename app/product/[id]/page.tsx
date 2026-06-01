'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { InventoryBadge } from '@/components/InventoryBadge';
import { PRODUCTS } from '@/lib/products';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useRecommendations } from '@/lib/recommendations-context';
import { useReviews, type Review } from '@/lib/reviews-context';
import { useInventory } from '@/lib/inventory-context';
import { useABTesting } from '@/lib/ab-testing-context';
import { ProductPresence } from '@/components/ProductPresence';
import { Star, ShoppingCart, Heart, Share2 } from 'lucide-react';
import Image from 'next/image';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const product = PRODUCTS.find((p) => p.id === id);

  const { addToCart } = useCart();
  const { user } = useAuth();
  const { trackView } = useRecommendations();
  const { getReviews, submitReview } = useReviews();
  const { getPrice, decrementStock, getStock } = useInventory();
  const { trackConversion } = useABTesting();

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    if (product) {
      trackView(product.id);
      getReviews(product.id).then(setReviews);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Product not found</h1>
            <p className="text-muted-foreground">The product you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </div>
      </div>
    );
  }

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : product.rating.toFixed(1);

  const relatedProducts = PRODUCTS.filter(
    (p) => p.category === product.category && p.id !== product.id,
  ).slice(0, 4);

  const handleAddToCart = async () => {
    if (!user) { router.push('/login'); return; }
    const stock = getStock(product.id, product.stock);
    if (stock === 0) return;
    setIsAdding(true);
    try {
      const dynamicPrice = getPrice(product.id, product.price);
      await addToCart({ ...product, price: dynamicPrice }, quantity);
      await decrementStock(product.id);
      trackConversion('rec_strategy_v1', product.id);
    }
    finally { setIsAdding(false); }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setReviewError('You must be logged in to leave a review.'); return; }
    setSubmitting(true);
    setReviewError('');
    try {
      await submitReview(product.id, reviewRating, reviewComment);
      const updated = await getReviews(product.id);
      setReviews(updated);
      setReviewComment('');
      setReviewRating(5);
    } catch {
      setReviewError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground mb-8">
          <a href="/" className="hover:text-foreground transition-colors">Home</a>
          <span className="mx-2">/</span>
          <a href="/search" className="hover:text-foreground transition-colors">Products</a>
          <span className="mx-2">/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        {/* Product Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="flex items-center justify-center bg-card border border-border rounded-lg overflow-hidden h-96 md:h-full">
            <Image src={product.image} alt={product.name} width={500} height={500} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-6">
            <div>
              <div className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
                {product.category}
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-3">{product.name}</h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <span className="text-lg font-semibold text-foreground">{avgRating}</span>
                </div>
                <span className="text-muted-foreground">({reviews.length} reviews)</span>
              </div>

              <p className="text-muted-foreground text-lg mb-6">{product.description}</p>
            </div>

            {/* Real-time presence */}
            <ProductPresence productId={product.id} stock={7} />

            <InventoryBadge productId={product.id} basePrice={product.basePrice} showStock />

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-foreground font-semibold">Quantity:</label>
                <div className="flex border border-border rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="bg-muted text-foreground px-4 py-2 hover:bg-muted/80 transition-colors">-</button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 text-center bg-card text-foreground border-l border-r border-border focus:outline-none" />
                  <button onClick={() => setQuantity(quantity + 1)} className="bg-muted text-foreground px-4 py-2 hover:bg-muted/80 transition-colors">+</button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {isAdding ? 'Adding...' : 'Add to Cart'}
                </button>
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${isWishlisted ? 'bg-accent/20 text-accent border border-accent' : 'bg-card text-muted-foreground border border-border hover:text-foreground'}`}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  {isWishlisted ? 'Wishlisted' : 'Wishlist'}
                </button>
              </div>

              <button className="w-full bg-card text-foreground border border-border hover:bg-muted py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors">
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="font-semibold text-foreground">Free Shipping</p>
                  <p className="text-sm text-muted-foreground">On orders over $50</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔄</span>
                <div>
                  <p className="font-semibold text-foreground">Easy Returns</p>
                  <p className="text-sm text-muted-foreground">30-day return policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8">Customer Reviews</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Review List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{review.userName}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">{review.comment}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>

            {/* Submit Review */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">Write a Review</h3>
              {!user ? (
                <p className="text-muted-foreground">
                  <a href="/login" className="text-primary hover:underline">Log in</a> to leave a review.
                </p>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Rating</label>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <button key={i} type="button" onClick={() => setReviewRating(i + 1)}>
                          <Star className={`w-6 h-6 ${i < reviewRating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Comment</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      required
                      rows={4}
                      placeholder="Share your experience..."
                      className="w-full bg-muted text-foreground placeholder-muted-foreground px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                  {reviewError && <p className="text-destructive text-sm">{reviewError}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Related Products */}
        <section>
          <h2 className="text-3xl font-bold text-foreground mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.length > 0 ? (
              relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)
            ) : (
              <p className="text-muted-foreground col-span-full">No related products found.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
