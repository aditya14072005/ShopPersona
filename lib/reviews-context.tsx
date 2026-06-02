'use client';

import React, { createContext, useContext } from 'react';
import { db } from './firebase';
import {
  collection, addDoc, query, where, getDocs, orderBy, onSnapshot,
} from 'firebase/firestore';
import { useAuth } from './auth-context';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ReviewsContextType {
  getReviews: (productId: string) => Promise<Review[]>;
  subscribeReviews: (productId: string, cb: (reviews: Review[]) => void) => () => void;
  submitReview: (productId: string, rating: number, comment: string) => Promise<void>;
  hasReviewed: (productId: string) => Promise<boolean>;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();

  const reviewQuery = (productId: string) =>
    query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
    );

  const getReviews = async (productId: string): Promise<Review[]> => {
    const snap = await getDocs(reviewQuery(productId));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
  };

  // Live subscription — avoids stale display after submit
  const subscribeReviews = (productId: string, cb: (reviews: Review[]) => void) =>
    onSnapshot(reviewQuery(productId), (snap) =>
      cb(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review))),
    );

  // Returns true if this user already reviewed this product
  const hasReviewed = async (productId: string): Promise<boolean> => {
    if (!user) return false;
    const snap = await getDocs(
      query(collection(db, 'reviews'), where('productId', '==', productId), where('userId', '==', user.uid)),
    );
    return !snap.empty;
  };

  const submitReview = async (productId: string, rating: number, comment: string) => {
    if (!user || !userProfile) throw new Error('Must be logged in to review');
    if (userProfile.role === 'admin') throw new Error('Admins cannot submit reviews');
    const already = await hasReviewed(productId);
    if (already) throw new Error('You have already reviewed this product');
    const name = userProfile.name?.trim() || user.email?.split('@')[0] || 'Anonymous';
    await addDoc(collection(db, 'reviews'), {
      productId,
      userId: user.uid,
      userName: name,
      rating,
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <ReviewsContext.Provider value={{ getReviews, subscribeReviews, submitReview, hasReviewed }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider');
  return ctx;
}
