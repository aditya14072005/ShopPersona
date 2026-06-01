'use client';

import React, { createContext, useContext } from 'react';
import { db } from './firebase';
import {
  collection, addDoc, query, where, getDocs, orderBy,
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
  submitReview: (productId: string, rating: number, comment: string) => Promise<void>;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile } = useAuth();

  const getReviews = async (productId: string): Promise<Review[]> => {
    const q = query(
      collection(db, 'reviews'),
      where('productId', '==', productId),
      orderBy('createdAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
  };

  const submitReview = async (productId: string, rating: number, comment: string) => {
    if (!user || !userProfile) throw new Error('Must be logged in to review');
    await addDoc(collection(db, 'reviews'), {
      productId,
      userId: user.uid,
      userName: userProfile.name,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <ReviewsContext.Provider value={{ getReviews, submitReview }}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used within ReviewsProvider');
  return ctx;
}
