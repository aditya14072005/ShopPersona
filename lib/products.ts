import { collection, getDocs, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';

export interface Product {
  id: string;
  name: string;
  price: number;
  basePrice: number;
  mrp?: number;
  rating: number;
  image: string;
  category: string;
  description: string;
  stock: number;
  brand?: string;
  reviews?: number;
  discount?: number;
  inStock?: boolean;
  source?: string;
  embedding?: number[];
}

export const CATEGORIES = [
  'All', 'Electronics', 'Fashion', 'Home', 'Books', 'Sports',
  'Fitness', 'Home Decor',
];

// Static fallback (used until Firestore loads and in SSR/API routes)
export const PRODUCTS: Product[] = [
  { id: '1', name: 'Premium Wireless Headphones', price: 24917, basePrice: 24917, mrp: 31146, rating: 4.8, stock: 12, discount: 20, brand: 'Sony', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop', category: 'Electronics', description: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life.' },
  { id: '2', name: 'Minimalist Watch', price: 12367, basePrice: 12367, mrp: 15459, rating: 4.6, stock: 8,  discount: 20, brand: 'Fossil', image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500&h=500&fit=crop', category: 'Fashion', description: 'Elegant minimalist timepiece with sapphire crystal and leather strap.' },
  { id: '3', name: 'Smart Home Speaker', price: 14857, basePrice: 14857, mrp: 18571, rating: 4.7, stock: 20, discount: 20, brand: 'Amazon', image: 'https://images.unsplash.com/photo-1589003077984-894e133da26d?w=500&h=500&fit=crop', category: 'Electronics', description: 'Voice-controlled smart speaker with premium sound quality.' },
  { id: '4', name: 'Vintage Sunglasses', price: 15687, basePrice: 15687, mrp: 19609, rating: 4.5, stock: 5,  discount: 20, brand: 'Ray-Ban', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop', category: 'Fashion', description: 'UV-protected vintage-style sunglasses with polarized lenses.' },
  { id: '5', name: 'Designer Backpack', price: 21497, basePrice: 21497, mrp: 26871, rating: 4.9, stock: 3,  discount: 20, brand: 'Samsonite', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop', category: 'Fashion', description: 'Durable and stylish backpack with weather-resistant material.' },
  { id: '6', name: 'Ceramic Vase Set', price: 7387, basePrice: 7387, mrp: 9234, rating: 4.4, stock: 15, discount: 20, brand: 'IKEA', image: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=500&h=500&fit=crop', category: 'Home', description: 'Modern ceramic vases perfect for any room décor.' },
  { id: '7', name: 'Bestselling Novel', price: 1992, basePrice: 1992, mrp: 2490, rating: 4.8, stock: 50, discount: 20, brand: 'Penguin', image: 'https://images.unsplash.com/photo-1507842217343-583f20270319?w=500&h=500&fit=crop', category: 'Books', description: 'Award-winning contemporary fiction novel.' },
  { id: '8', name: 'Yoga Mat Premium', price: 6557, basePrice: 6557, mrp: 8196, rating: 4.6, stock: 18, discount: 20, brand: 'Decathlon', image: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&h=500&fit=crop', category: 'Sports', description: 'Non-slip eco-friendly yoga mat for comfort and stability.' },
];

/**
 * Load all products from Firestore once.
 * Falls back to PRODUCTS if Firestore is unavailable.
 */
export async function loadProductsFromFirestore(): Promise<Product[]> {
  if (!db) return PRODUCTS;
  try {
    const snap = await getDocs(query(collection(db, 'products')));
    if (snap.empty) return PRODUCTS;
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Product);
  } catch {
    return PRODUCTS;
  }
}

/**
 * Subscribe to live Firestore products.
 * Calls `callback` with the full list whenever data changes.
 * Returns an unsubscribe function.
 */
export function subscribeProducts(callback: (products: Product[]) => void): () => void {
  if (!db) { callback(PRODUCTS); return () => {}; }
  const unsub = onSnapshot(
    query(collection(db, 'products')),
    (snap) => {
      if (snap.empty) { callback(PRODUCTS); return; }
      callback(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Product));
    },
    () => callback(PRODUCTS),
  );
  return unsub;
}
