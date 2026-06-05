import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

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

export async function POST(req: NextRequest) {
  try {
    // Verify admin key header to prevent unauthorized seeding
    const authHeader = req.headers.get('x-admin-seed-key');
    if (authHeader !== process.env.ADMIN_SEED_KEY && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jsonPath = path.resolve(process.cwd(), 'scripts', 'hf-products.json');

    if (!fs.existsSync(jsonPath)) {
      return NextResponse.json(
        { error: 'hf-products.json not found. Run: python scripts/load-hf-dataset.py first.' },
        { status: 404 },
      );
    }

    const products = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    let count = 0;

    // Firestore batch max is 500 writes
    const BATCH_SIZE = 400;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = adminDb.batch();
      const chunk = products.slice(i, i + BATCH_SIZE);
      for (const product of chunk) {
        const ref = adminDb.collection('products').doc(product.id);
        batch.set(ref, { ...product, createdAt: new Date().toISOString() });
        count++;
      }
      await batch.commit();
    }

    return NextResponse.json({ success: true, seeded: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Seeding failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
