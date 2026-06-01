import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

let stripe: Stripe | null = null;

// Initialize Stripe only if API key exists
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
}

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not configured. Please set STRIPE_SECRET_KEY.' },
        { status: 503 },
      );
    }

    const { items, userId, shipping } = await req.json();

    const lineItems = items.map((item: { name: string; price: number; quantity: number; image: string }) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: [item.image],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout`,
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB'] },
      metadata: { userId, shipping: JSON.stringify(shipping) },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe session creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
