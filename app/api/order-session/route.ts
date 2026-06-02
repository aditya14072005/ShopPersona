import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id');
    if (!sessionId) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.includes('<')) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['shipping_details'],
    });

    return NextResponse.json({
      customerEmail: session.customer_details?.email || '',
      amountTotal: session.amount_total ?? 0,
      currency: session.currency ?? 'usd',
      paymentStatus: session.payment_status,
      shipping: session.shipping_details
        ? {
            name: session.shipping_details.name || '',
            address: {
              line1: session.shipping_details.address?.line1 || '',
              city: session.shipping_details.address?.city || '',
              state: session.shipping_details.address?.state || '',
              postal_code: session.shipping_details.address?.postal_code || '',
              country: session.shipping_details.address?.country || '',
            },
          }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch session';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
