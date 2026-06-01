import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { PRODUCTS } from '@/lib/products';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = getFirestore();

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) return NextResponse.json({ results: [] });

    // Get all user behavior docs
    const snap = await adminDb.collection('user_behavior').get();
    const allBehaviors: Record<string, { viewed: string[]; purchased: string[] }> = {};
    snap.forEach((doc) => { allBehaviors[doc.id] = doc.data() as { viewed: string[]; purchased: string[] }; });

    const currentUser = allBehaviors[userId];
    if (!currentUser?.purchased?.length) return NextResponse.json({ results: [] });

    const myPurchased = new Set(currentUser.purchased);

    // Score other users by overlap with current user's purchases
    const productScores: Record<string, number> = {};

    Object.entries(allBehaviors).forEach(([uid, behavior]) => {
      if (uid === userId) return;
      const theirPurchased = behavior.purchased || [];

      // Jaccard-style overlap
      const overlap = theirPurchased.filter((id) => myPurchased.has(id)).length;
      if (overlap === 0) return;

      const similarity = overlap / (myPurchased.size + theirPurchased.length - overlap);

      // Weight their other purchases by similarity score
      theirPurchased.forEach((productId) => {
        if (!myPurchased.has(productId)) {
          productScores[productId] = (productScores[productId] || 0) + similarity;
        }
      });
    });

    const results = Object.entries(productScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([id]) => PRODUCTS.find((p) => p.id === id))
      .filter(Boolean);

    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Collaborative filtering failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
