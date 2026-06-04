import { NextRequest, NextResponse } from 'next/server';
import { PRODUCTS } from '@/lib/products';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminDb() {
  if (!getApps().length) {
    const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? '';
    const privateKey = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }
  return getFirestore();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topCategory = searchParams.get('category');
  const now = new Date();

  // Check for admin override in Firestore
  try {
    const db = getAdminDb();
    const snap = await db.collection('daily_deal').doc('active').get();
    if (snap.exists) {
      const data = snap.data()!;
      const expiresAt = new Date(data.expiresAt);
      if (expiresAt > now) {
        const product = PRODUCTS.find((p) => p.id === data.productId);
        if (product) {
          const discountPercent = data.discountPercent ?? 20;
          return NextResponse.json({
            product,
            discountPercent,
            discountedPrice: +(product.price * (1 - discountPercent / 100)).toFixed(2),
            secondsLeft: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
          });
        }
      }
    }
  } catch (_) { /* fall through to auto logic */ }

  // Auto logic (date-seeded)
  const pool = topCategory ? PRODUCTS.filter((p) => p.category === topCategory) : PRODUCTS;
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const product = pool[seed % pool.length];
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 0);

  return NextResponse.json({
    product,
    discountPercent: 20,
    discountedPrice: +(product.price * 0.8).toFixed(2),
    secondsLeft: Math.floor((tomorrow.getTime() - now.getTime()) / 1000),
  });
}
