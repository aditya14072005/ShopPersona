import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually (no dotenv dependency needed)
const envText = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
const env: Record<string, string> = {};
for (const line of envText.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '');
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

const products = JSON.parse(
  readFileSync(resolve(__dirname, 'hf-products.json'), 'utf-8')
) as Record<string, unknown>[];

async function seed() {
  console.log(`Seeding ${products.length} products into Firestore…`);

  // Write in batches of 500 (Firestore limit)
  const BATCH_SIZE = 499;
  let done = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = products.slice(i, i + BATCH_SIZE);

    for (const product of chunk) {
      // Use product.id as the Firestore doc ID so look-ups stay consistent
      const ref = db.collection('products').doc(product.id as string);
      batch.set(ref, product);
    }

    await batch.commit();
    done += chunk.length;
    console.log(`  ✓ ${done}/${products.length}`);
  }

  console.log('Done!');
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
