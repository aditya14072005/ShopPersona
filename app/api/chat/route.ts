import { NextRequest, NextResponse } from 'next/server';
import { PRODUCTS } from '@/lib/products';

// ── keyword → category / intent maps ────────────────────────────────────────
const CATEGORY_KEYWORDS: Record<string, string> = {
  electronics: 'Electronics', phone: 'Electronics', laptop: 'Electronics',
  headphone: 'Electronics', speaker: 'Electronics', tech: 'Electronics', gadget: 'Electronics',
  fashion: 'Fashion', cloth: 'Fashion', wear: 'Fashion', watch: 'Fashion',
  sunglass: 'Fashion', bag: 'Fashion', backpack: 'Fashion', outfit: 'Fashion', style: 'Fashion',
  home: 'Home', decor: 'Home', vase: 'Home', furniture: 'Home', kitchen: 'Home', room: 'Home',
  book: 'Books', novel: 'Books', read: 'Books', fiction: 'Books', literature: 'Books',
  sport: 'Sports', gym: 'Sports', fitness: 'Sports', yoga: 'Sports', exercise: 'Sports', workout: 'Sports',
};

const GREETING = /^(hi|hello|hey|howdy|sup|what'?s up|good (morning|evening|afternoon))/i;
const THANKS   = /thank|thanks|thx|ty|great|awesome|perfect|helpful/i;
const CHEAP    = /cheap|budget|affordable|low.?price|inexpensive|under (\$?\d+)/i;
const EXPENSIVE = /premium|luxury|best|top|high.?end|expensive/i;
const GIFT     = /gift|present|someone|friend|birthday|anniversary/i;
const ALL      = /all|everything|catalogue|catalog|list|show|what do you (have|sell|carry)/i;
const HELP     = /help|what can you|what do you do|how (do|can) (you|i)|support/i;

function matchProducts(text: string) {
  const lower = text.toLowerCase();

  // Direct product name match
  const byName = PRODUCTS.filter((p) => lower.includes(p.name.toLowerCase().split(' ')[0].toLowerCase()));
  if (byName.length) return byName;

  // Category keyword match
  const matchedCat = Object.entries(CATEGORY_KEYWORDS).find(([kw]) => lower.includes(kw))?.[1];
  if (matchedCat) return PRODUCTS.filter((p) => p.category === matchedCat);

  // Price intent
  if (CHEAP.test(lower)) return [...PRODUCTS].sort((a, b) => a.price - b.price).slice(0, 3);
  if (EXPENSIVE.test(lower)) return [...PRODUCTS].sort((a, b) => b.price - a.price).slice(0, 3);

  // Gift → top rated
  if (GIFT.test(lower)) return [...PRODUCTS].sort((a, b) => b.rating - a.rating).slice(0, 3);

  return [];
}

function formatProducts(products: typeof PRODUCTS) {
  return products.map((p) => `• **${p.name}** — ₹${p.price.toLocaleString('en-IN')} (${p.category}) ⭐ ${p.rating}\n  ${p.description}`).join('\n\n');
}

function buildReply(userText: string): string {
  const t = userText.trim();

  if (GREETING.test(t))
    return "Hi there! 👋 I'm your ShopPersona assistant. Tell me what you're looking for — a category like *Electronics* or *Fashion*, a budget, a gift idea — and I'll find the best match!";

  if (THANKS.test(t))
    return "You're welcome! 😊 Let me know if you need anything else.";

  if (HELP.test(t))
    return "I can help you:\n• Find products by category (Electronics, Fashion, Home, Books, Sports)\n• Filter by budget — try *cheap* or *premium*\n• Find gift ideas\n• Search by name\n\nJust tell me what you're looking for!";

  if (ALL.test(t)) {
    return `Here's everything we carry:\n\n${formatProducts(PRODUCTS)}`;
  }

  const matches = matchProducts(t);

  if (matches.length === 0)
    return "Hmm, I couldn't find a match for that. 🤔 Try searching by category (*Electronics*, *Fashion*, *Home*, *Books*, *Sports*), or describe what you need and I'll do my best!";

  const intro = matches.length === 1
    ? `Here's the perfect pick for you! 🎯`
    : `I found ${matches.length} great option${matches.length > 1 ? 's' : ''} for you! 🛍️`;

  return `${intro}\n\n${formatProducts(matches)}`;
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const lastUser = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
  const reply = buildReply(lastUser?.content ?? '');
  return NextResponse.json({ reply });
}
