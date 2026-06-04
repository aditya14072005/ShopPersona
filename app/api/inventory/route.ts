import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { PRODUCTS } from '@/lib/products';

function getAdminDb() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  privateKey = privateKey.replace(/\\n/g, '\n');
  try {
    if (!getApps().length) initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    return getFirestore();
  } catch { return null; }
}

// Dynamic pricing: low stock = higher price, high stock = slight discount
function computeDynamicPrice(basePrice: number, stock: number): number {
  if (stock <= 3) return +(basePrice * 1.15).toFixed(2);   // +15% scarcity premium
  if (stock <= 8) return +(basePrice * 1.05).toFixed(2);   // +5% low stock
  if (stock >= 20) return +(basePrice * 0.95).toFixed(2);  // -5% high stock discount
  return basePrice;
}

export async function GET() {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase not configured.' }, { status: 503 });
    }

    const snap = await adminDb.collection('inventory').get();
    const stored: Record<string, number> = {};
    snap.forEach((doc) => { stored[doc.id] = doc.data().stock; });

    // Merge with defaults from PRODUCTS
    const inventory = PRODUCTS.map((p) => {
      const stock = stored[p.id] ?? p.stock;
      return {
        productId: p.id,
        stock,
        dynamicPrice: computeDynamicPrice(p.basePrice, stock),
        basePrice: p.basePrice,
        priceChange: stock <= 3 ? 'surge' : stock >= 20 ? 'discount' : 'normal',
      };
    });

    return NextResponse.json({ inventory });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Inventory fetch failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminDb = getAdminDb();
    if (!adminDb) return NextResponse.json({ error: 'Firebase not configured.' }, { status: 503 });
    const { productId, delta } = await req.json();
    const ref = adminDb.collection('inventory').doc(productId);
    const snap = await ref.get();
    const product = PRODUCTS.find((p) => p.id === productId);
    const currentStock = snap.exists ? snap.data()!.stock : (product?.stock ?? 0);
    const newStock = Math.max(0, currentStock + delta);
    await ref.set({ stock: newStock }, { merge: true });
    return NextResponse.json({ stock: newStock });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Inventory update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
