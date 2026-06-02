import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminDb() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) return null;

  // Vercel wraps the private key in extra quotes and escapes newlines differently.
  // Strip surrounding quotes if present, then replace all \\n with actual newlines.
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    if (!getApps().length) {
      initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    }
    return getFirestore();
  } catch (err) {
    console.error('Firebase Admin init error:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeKey || stripeKey.includes('<') || !webhookSecret || webhookSecret.includes('<')) {
    return NextResponse.json(
      { error: 'Stripe webhook not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET.' },
      { status: 503 },
    );
  }

  const stripe = new Stripe(stripeKey);
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const shipping = session.metadata?.shipping;

    if (!userId) {
      console.error('Webhook: missing userId in session metadata');
      return NextResponse.json({ error: 'Missing userId in metadata' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      console.error('Webhook: Firebase Admin not initialized');
      return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 503 });
    }

    await adminDb.collection('orders').add({
      userId,
      shipping: shipping ? JSON.parse(shipping) : null,
      total: (session.amount_total ?? 0) / 100,
      status: 'confirmed',
      stripeSessionId: session.id,
      createdAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ received: true });
}
