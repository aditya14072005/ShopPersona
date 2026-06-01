import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PRODUCTS } from '@/lib/products';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Cache product embeddings in module scope (persists across requests in same worker)
let productEmbeddingsCache: { id: string; embedding: number[] }[] | null = null;

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

async function getProductEmbeddings() {
  if (productEmbeddingsCache) return productEmbeddingsCache;

  const texts = PRODUCTS.map((p) => `${p.name}. ${p.category}. ${p.description}`);
  const res = await openai.embeddings.create({ model: 'text-embedding-3-small', input: texts });

  productEmbeddingsCache = PRODUCTS.map((p, i) => ({
    id: p.id,
    embedding: res.data[i].embedding,
  }));

  return productEmbeddingsCache;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) return NextResponse.json({ results: [] });

    const [queryEmbedRes, productEmbeddings] = await Promise.all([
      openai.embeddings.create({ model: 'text-embedding-3-small', input: query }),
      getProductEmbeddings(),
    ]);

    const queryVec = queryEmbedRes.data[0].embedding;

    const ranked = productEmbeddings
      .map(({ id, embedding }) => ({
        product: PRODUCTS.find((p) => p.id === id)!,
        score: cosineSimilarity(queryVec, embedding),
      }))
      .filter(({ score }) => score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ product }) => product);

    return NextResponse.json({ results: ranked });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Semantic search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
