import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminDb() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, pendingOrder } = await req.json();
    if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    const userId = pendingOrder?.userId || session.metadata?.userId;
    const items = pendingOrder?.items || JSON.parse(session.metadata?.items || '[]');
    const shipping = pendingOrder?.shipping || JSON.parse(session.metadata?.shipping || '{}');
    const total = pendingOrder?.total ?? session.amount_total! / 100;

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const db = getAdminDb();

    // Prevent duplicate orders for the same Stripe session
    const existing = await db.collection('orders').where('stripeSessionId', '==', sessionId).limit(1).get();
    if (!existing.empty) return NextResponse.json({ success: true, duplicate: true });

    await db.collection('orders').add({
      userId,
      items,
      total,
      shipping,
      stripeSessionId: sessionId,
      paymentMethod: 'stripe',
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to confirm order';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
