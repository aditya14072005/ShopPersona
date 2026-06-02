import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getAppUrl(): string {
  // NEXT_PUBLIC_APP_URL takes priority (set this in Vercel to your production domain)
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  // Vercel automatically sets VERCEL_URL (without https://)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.includes('<') || stripeKey === '') {
      return NextResponse.json(
        { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your environment variables.' },
        { status: 503 },
      );
    }

    const stripe = new Stripe(stripeKey);
    const { items, userId, shipping } = await req.json();

    if (!items?.length) {
      return NextResponse.json({ error: 'No items in order.' }, { status: 400 });
    }
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated.' }, { status: 401 });
    }

    const appUrl = getAppUrl();

    const lineItems = items.map((item: { name: string; price: number; quantity: number; image: string }) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${appUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout`,
      shipping_address_collection: {
        allowed_countries: ['IN', 'US', 'GB', 'CA', 'AU', 'AE', 'SG', 'DE', 'FR', 'JP', 'NZ', 'ZA'],
      },
      metadata: { userId, shipping: JSON.stringify(shipping) },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe session creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
