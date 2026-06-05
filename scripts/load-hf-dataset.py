"""
Load Amazon Electronics dataset from Hugging Face and convert to ShopPersona format.
Run: pip install datasets && python scripts/load-hf-dataset.py
"""

import json
import re
import os

def categorize(title: str, features: list) -> str:
    text = (title + " ".join(features)).lower()
    if any(k in text for k in ["headphone", "earphone", "earbud", "speaker", "audio", "sound"]):
        return "Electronics"
    if any(k in text for k in ["laptop", "computer", "tablet", "monitor", "keyboard", "mouse", "pc"]):
        return "Electronics"
    if any(k in text for k in ["phone", "mobile", "smartphone", "charger", "cable", "battery"]):
        return "Electronics"
    if any(k in text for k in ["camera", "lens", "tripod", "photo"]):
        return "Electronics"
    if any(k in text for k in ["watch", "smartwatch", "fitness", "band", "tracker"]):
        return "Fashion"
    if any(k in text for k in ["light", "bulb", "lamp", "home", "kitchen", "appliance"]):
        return "Home"
    if any(k in text for k in ["book", "novel", "guide", "manual"]):
        return "Books"
    if any(k in text for k in ["sport", "gym", "yoga", "exercise", "outdoor", "bike"]):
        return "Sports"
    return "Electronics"

def extract_price(price_val) -> float | None:
    if price_val is None:
        return None
    if isinstance(price_val, (int, float)):
        return float(price_val)
    if isinstance(price_val, str):
        price_val = price_val.replace(",", "")
        match = re.search(r"[\d]+\.?\d*", price_val)
        if match:
            return float(match.group())
    return None

def extract_rating(rating_val) -> float:
    try:
        return float(rating_val)
    except:
        return 0.0

def get_image(images) -> str | None:
    if not images:
        return None
    if isinstance(images, list) and len(images) > 0:
        img = images[0]
        if isinstance(img, dict):
            return img.get("large") or img.get("hi_res") or img.get("thumb") or None
        if isinstance(img, str):
            return img
    return None

def get_description(item) -> str:
    features = item.get("features") or []
    description = item.get("description") or []

    if features and isinstance(features, list):
        text = " ".join(str(f) for f in features[:3])
        if len(text) > 20:
            return text[:300]

    if description and isinstance(description, list):
        text = " ".join(str(d) for d in description[:2])
        if len(text) > 20:
            return text[:300]

    if isinstance(description, str) and len(description) > 20:
        return description[:300]

    return ""

def main():
    print("Loading Hugging Face dataset (this may take a few minutes)...")
    from datasets import load_dataset

    dataset = load_dataset(
        "McAuley-Lab/Amazon-Reviews-2023",
        "raw_meta_Electronics",
        split="full",
        trust_remote_code=True,
    )

    print(f"Total records: {len(dataset)}")
    print("Filtering products...")

    products = []
    seen_titles = set()

    for item in dataset:
        if len(products) >= 100:
            break

        try:
            title = (item.get("title") or "").strip()
            if not title or len(title) < 5:
                continue

            # Deduplicate
            title_key = title[:50].lower()
            if title_key in seen_titles:
                continue

            price = extract_price(item.get("price"))
            if price is None or price < 5 or price > 500:
                continue

            rating = extract_rating(item.get("average_rating") or item.get("rating"))
            if rating < 3.5:
                continue

            image = get_image(item.get("images"))
            if not image:
                continue

            description = get_description(item)
            if not description:
                continue

            category = categorize(title, item.get("features") or [])
            price_inr = round(price * 83, 2)
            asin = item.get("parent_asin") or item.get("asin") or f"prod_{len(products)}"

            products.append({
                "id": asin,
                "name": title[:100],
                "price": price_inr,
                "basePrice": price_inr,
                "priceUSD": price,
                "rating": round(rating, 1),
                "image": image,
                "category": category,
                "description": description,
                "stock": 20,
                "source": "amazon",
                "inStock": True,
            })

            seen_titles.add(title_key)

            if len(products) % 10 == 0:
                print(f"  Collected {len(products)} products...")

        except Exception as e:
            continue

    print(f"\nDone! Collected {len(products)} products.")

    out_path = os.path.join(os.path.dirname(__file__), "hf-products.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)

    print(f"Saved to {out_path}")
    print("\nSample products:")
    for p in products[:3]:
        print(f"  - {p['name'][:60]} | ₹{p['price']} | {p['category']} | ⭐{p['rating']}")

if __name__ == "__main__":
    main()
