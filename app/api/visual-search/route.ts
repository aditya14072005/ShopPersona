import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { PRODUCTS } from '@/lib/products';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
  productEmbeddingsCache = PRODUCTS.map((p, i) => ({ id: p.id, embedding: res.data[i].embedding }));
  return productEmbeddingsCache;
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 });

    // Step 1: Use GPT-4o vision to describe the image
    const visionRes = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageUrl } },
          { type: 'text', text: 'Describe this product in 1-2 sentences focusing on its type, style, color, and use case. Be concise.' },
        ],
      }],
      max_tokens: 100,
    });

    const description = visionRes.choices[0].message.content || '';

    // Step 2: Embed the description and find similar products
    const [queryEmbedRes, productEmbeddings] = await Promise.all([
      openai.embeddings.create({ model: 'text-embedding-3-small', input: description }),
      getProductEmbeddings(),
    ]);

    const queryVec = queryEmbedRes.data[0].embedding;

    const ranked = productEmbeddings
      .map(({ id, embedding }) => ({
        product: PRODUCTS.find((p) => p.id === id)!,
        score: cosineSimilarity(queryVec, embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(({ product }) => product);

    return NextResponse.json({ results: ranked, description });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Visual search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
