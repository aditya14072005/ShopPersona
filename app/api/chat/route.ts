import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PRODUCTS } from '@/lib/products';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a helpful shopping assistant for ShopPersona, an AI-powered e-commerce store.
You help customers find products from our catalogue. Be friendly, concise, and always recommend specific products by name when relevant.

Our current product catalogue:
${PRODUCTS.map((p) => `- ${p.name} ($${p.price}, ${p.category}): ${p.description}`).join('\n')}

Only recommend products from this catalogue. If asked about something we don't carry, say so politely and suggest the closest match.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 300,
    });

    return NextResponse.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI assistant error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
