import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let adminDb: any = null;

// Only initialize Firebase Admin if credentials are available
if (
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    }
    adminDb = getFirestore();
  } catch (err) {
    // Firebase initialization failed - will return error when route is called
    console.error('Firebase initialization failed:', err);
  }
}

export async function POST(req: NextRequest) {
  // Check if Firebase is configured
  if (!adminDb) {
    return NextResponse.json(
      { error: 'Webhook not configured. Firebase credentials missing.' },
      { status: 503 },
    );
  }

  // Check if Stripe is configured
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Webhook not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.' },
      { status: 503 },
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, shipping } = session.metadata!;

    await adminDb.collection('orders').add({
      userId,
      shipping: JSON.parse(shipping),
      total: (session.amount_total ?? 0) / 100,
      status: 'confirmed',
      stripeSessionId: session.id,
      createdAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ received: true });
}
