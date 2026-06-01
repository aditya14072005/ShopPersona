import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PRODUCTS } from '@/lib/products';

let openai: OpenAI | null = null;

// Initialize OpenAI only if API key exists
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Cache embeddings in module scope (persists across requests in same worker)
let embeddingsCache: Record<string, number[]> | null = null;

async function generateAllEmbeddings() {
  if (embeddingsCache) return embeddingsCache;

  const cache: Record<string, number[]> = {};

  // Generate embeddings for all products
  const texts = PRODUCTS.map((p) => `${p.name}. ${p.category}. ${p.description}`);
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  res.data.forEach((item, i) => {
    cache[PRODUCTS[i].id] = item.embedding;
  });

  embeddingsCache = cache;
  return cache;
}

export async function GET() {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: 'Embeddings are not configured. Please set OPENAI_API_KEY.' },
        { status: 503 },
      );
    }

    const embeddings = await generateAllEmbeddings();
    return NextResponse.json({ embeddings });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate embeddings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: 'Embeddings are not configured. Please set OPENAI_API_KEY.' },
        { status: 503 },
      );
    }

    const { texts } = await req.json();
    if (!Array.isArray(texts) || !texts.length) {
      return NextResponse.json({ error: 'texts array required' }, { status: 400 });
    }

    const res = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts,
    });

    const embeddings = res.data.map((item) => item.embedding);
    return NextResponse.json({ embeddings });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate embeddings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
