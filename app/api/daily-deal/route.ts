import { NextRequest, NextResponse } from 'next/server';
import { PRODUCTS } from '@/lib/products';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topCategory = searchParams.get('category');

  // Pick from user's top category, or random if none
  const pool = topCategory
    ? PRODUCTS.filter((p) => p.category === topCategory)
    : PRODUCTS;

  // Use date as seed so deal changes daily but is consistent within the day
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % pool.length;
  const product = pool[index];

  // Midnight reset — seconds until next day
  const tomorrow = new Date(today);
  tomorrow.setHours(24, 0, 0, 0);
  const secondsLeft = Math.floor((tomorrow.getTime() - today.getTime()) / 1000);

  return NextResponse.json({
    product,
    discountPercent: 20,
    discountedPrice: +(product.price * 0.8).toFixed(2),
    secondsLeft,
  });
}
