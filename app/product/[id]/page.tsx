'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { ProductCard } from '@/components/ProductCard';
import { ProductPresence } from '@/components/ProductPresence';
import { PRODUCTS } from '@/lib/products';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useRecommendations } from '@/lib/recommendations-context';
import { useReviews, type Review } from '@/lib/reviews-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Star, ShoppingCart, Heart, Share2 } from 'lucide-react';
import { ProductQA } from '@/components/ProductQA';
import Image from 'next/image';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const product = PRODUCTS.find((p) => p.id === id);

  const { addToCart } = useCart();
  const { user, userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';
  const { trackView } = useRecommendations();
  const { getReviews, subscribeReviews, submitReview, hasReviewed } = useReviews();

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    if (!product) return;
    trackView(product.id);
    // Live reviews subscription
    const unsub = subscribeReviews(product.id, setReviews);
    if (user) {
      getDoc(doc(db, 'wishlists', user.uid)).then((snap) => {
        if (snap.exists()) setIsWishlisted((snap.data().productIds ?? []).includes(product.id));
      });
      hasReviewed(product.id).then(setAlreadyReviewed);
    }
    return unsub;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, user?.uid]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32 text-center">
          <div>
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
    if (!user) { window.location.href = '/login'; return; }
    if (isAdmin) return;
    setIsAdding(true);
    try { await addToCart(product, quantity); }
    finally { setIsAdding(false); }
  };

  const toggleWishlist = async () => {
    if (!user || isAdmin) { if (!user) window.location.href = '/login'; return; }
    const ref = doc(db, 'wishlists', user.uid);
    try {
      const snap = await getDoc(ref);
      const current: string[] = snap.exists() ? (snap.data().productIds ?? []) : [];
      const updated = isWishlisted
        ? current.filter((id) => id !== product.id)
        : [...current, product.id];
      await setDoc(ref, { productIds: updated });
      setIsWishlisted(!isWishlisted);
    } catch (err) {
      console.error('Wishlist error:', err);
      alert('Failed to update wishlist. Please make sure you are logged in.');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setReviewError('You must be logged in to leave a review.'); return; }
    setSubmitting(true);
    setReviewError('');
    try {
      await submitReview(product.id, reviewRating, reviewComment);
      setReviewComment('');
      setReviewRating(5);
      setAlreadyReviewed(true);
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to submit review.');
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
          <div className="flex items-center justify-center bg-card border border-border rounded-xl overflow-hidden h-96 md:h-full">
            <Image src={product.image} alt={product.name} width={500} height={500} className="w-full h-full object-cover" />
          </div>

          <div className="space-y-5">
            <div>
              <div className="inline-block bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
                {product.category}
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-3">{product.name}</h1>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-accent text-accent" />
                  <span className="text-lg font-semibold text-foreground">{avgRating}</span>
                </div>
                <span className="text-muted-foreground">({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
              <p className="text-muted-foreground text-lg">{product.description}</p>
            </div>

            {/* Real-time presence + low stock */}
            <ProductPresence productId={product.id} stock={7} />

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-accent">${product.price}</span>
              <span className="text-lg text-muted-foreground line-through">${(product.price * 1.2).toFixed(0)}</span>
              <span className="text-sm bg-accent/20 text-accent font-semibold px-3 py-1 rounded">
                Save {Math.round(20)}%
              </span>
            </div>

            {/* Quantity + Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <label className="text-foreground font-semibold">Quantity:</label>
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="bg-muted text-foreground px-4 py-2 hover:bg-muted/80 transition-colors">-</button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 text-center bg-card text-foreground border-l border-r border-border focus:outline-none" />
                  <button onClick={() => setQuantity(quantity + 1)} className="bg-muted text-foreground px-4 py-2 hover:bg-muted/80 transition-colors">+</button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleAddToCart} disabled={isAdding || isAdmin}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors">
                  <ShoppingCart className="w-5 h-5" />{isAdmin ? 'Admin View' : isAdding ? 'Adding...' : 'Add to Cart'}
                </button>
                <button onClick={toggleWishlist} disabled={isAdmin}
                  className={`px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-colors border disabled:opacity-50 disabled:cursor-not-allowed ${isWishlisted ? 'bg-accent/20 text-accent border-accent' : 'bg-card text-muted-foreground border-border hover:text-foreground'}`}>
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  {isWishlisted ? 'Saved' : 'Wishlist'}
                </button>
              </div>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: product.name, text: product.description, url: window.location.href });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }
                }}
                className="w-full bg-card text-foreground border border-border hover:bg-muted py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-5 h-5" />Share
              </button>
            </div>

            {/* Shipping info */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-xl">🚚</span>
                <div>
                  <p className="font-semibold text-foreground text-sm">Free Shipping</p>
                  <p className="text-xs text-muted-foreground">On orders over $50</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🔄</span>
                <div>
                  <p className="font-semibold text-foreground text-sm">Easy Returns</p>
                  <p className="text-xs text-muted-foreground">30-day return policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Customer Reviews</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-muted-foreground">No reviews yet. Be the first!</p>
              ) : reviews.map((review) => (
                <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">{review.userName}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-accent text-accent' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm">{review.comment}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Write a Review</h3>
              {!user ? (
                <p className="text-muted-foreground text-sm"><a href="/login" className="text-primary hover:underline">Log in</a> to leave a review.</p>
              ) : isAdmin ? (
                <p className="text-muted-foreground text-sm">Admins cannot submit reviews.</p>
              ) : alreadyReviewed ? (
                <p className="text-sm text-green-400 font-medium">✓ You&apos;ve already reviewed this product.</p>
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
                  <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} required rows={4}
                    placeholder="Share your experience..."
                    className="w-full bg-muted text-foreground placeholder-muted-foreground px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm" />
                  {reviewError && <p className="text-destructive text-sm">{reviewError}</p>}
                  <button type="submit" disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors text-sm">
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Q&A */}
        <ProductQA productId={id} />

        {/* Related Products */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.length > 0
              ? relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)
              : <p className="text-muted-foreground col-span-full">No related products found.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
