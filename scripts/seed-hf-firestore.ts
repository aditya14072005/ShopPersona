/**
 * Seed Firestore with HF products.
 * Run: npx ts-node --project tsconfig.seed.json scripts/seed-hf-firestore.ts
 */

import * as fs from "fs";
import * as path from "path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (
    !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !privateKey
  ) {
    console.error(
      "❌ Missing Firebase Admin credentials in .env.local\n" +
        "   Need: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY"
    );
    process.exit(1);
  }

  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = getFirestore();

async function seed() {
  const jsonPath = path.resolve(__dirname, "hf-products.json");

  if (!fs.existsSync(jsonPath)) {
    console.error(
      "❌ hf-products.json not found.\n" +
        "   Run first: python scripts/load-hf-dataset.py"
    );
    process.exit(1);
  }

  const products = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  console.log(`📦 Seeding ${products.length} products to Firestore...`);

  const batch_size = 400; // Firestore batch limit is 500
  let count = 0;

  for (let i = 0; i < products.length; i += batch_size) {
    const batch = db.batch();
    const chunk = products.slice(i, i + batch_size);

    for (const product of chunk) {
      const ref = db.collection("products").doc(product.id);
      batch.set(ref, {
        ...product,
        createdAt: new Date().toISOString(),
      });
      count++;
    }

    await batch.commit();
    console.log(`  ✅ Committed ${count}/${products.length} products`);
  }

  console.log(`\n🎉 Done! ${count} products seeded to Firestore.`);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err.message);
  process.exit(1);
});
