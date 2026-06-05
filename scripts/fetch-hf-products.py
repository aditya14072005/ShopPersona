import json, re, sys
import pandas as pd
from huggingface_hub import hf_hub_download

REPO = "McAuley-Lab/Amazon-Reviews-2023"

# (hf_prefix, num_shards, app_category)
SUBSETS = [
    ("raw_meta_Electronics",                "Electronics",  10),
    ("raw_meta_Cell_Phones_and_Accessories","Electronics",   7),
    ("raw_meta_Toys_and_Games",             "Sports",        5),
    ("raw_meta_Arts_Crafts_and_Sewing",     "Home",          4),
    ("raw_meta_Musical_Instruments",        "Sports",        2),
]

TARGET_PER_CATEGORY = 120
collected: dict[str, list] = {}

def parse_image(images) -> str:
    try:
        if isinstance(images, dict):
            for key in ("large", "hi_res", "thumb"):
                raw = images.get(key)
                lst = list(raw) if raw is not None else []
                if lst:
                    return str(lst[0])
        elif images is not None:
            lst = list(images)
            if lst:
                first = lst[0]
                if isinstance(first, dict):
                    for key in ("large", "hi_res", "thumb"):
                        v = first.get(key)
                        if v:
                            return str(v)
                else:
                    return str(first)
    except Exception:
        pass
    return ""

def parse_features(features) -> list:
    try:
        return list(features) if features is not None else []
    except Exception:
        return []

for prefix, category, num_shards in SUBSETS:
    need = TARGET_PER_CATEGORY - len(collected.get(category, []))
    if need <= 0:
        print(f"Skip {prefix} — {category} already full")
        continue

    print(f"Fetching {prefix} for {category} (need {need} more)…")
    count_this_run = 0

    for shard_idx in range(num_shards):
        if count_this_run >= need:
            break
        shard_name = f"full-{shard_idx:05d}-of-{num_shards:05d}.parquet"
        try:
            path = hf_hub_download(
                repo_id=REPO,
                repo_type="dataset",
                filename=f"{prefix}/{shard_name}",
            )
        except Exception as e:
            print(f"  Could not download shard {shard_idx}: {e}")
            continue

        df = pd.read_parquet(path)
        for _, row in df.iterrows():
            if count_this_run >= need:
                break

            title = str(row.get("title") or "").strip()
            if not title:
                continue

            price_raw = row.get("price")
            if price_raw is None or str(price_raw).strip() in ("", "None", "nan"):
                continue
            try:
                price_usd = float(re.sub(r"[^\d.]", "", str(price_raw)))
            except Exception:
                continue
            if price_usd <= 0:
                continue

            image_url = parse_image(row.get("images"))
            if not image_url or not image_url.startswith("http"):
                continue

            price_inr = round(price_usd * 83)
            mrp_inr   = round(price_inr * 1.25)
            features  = parse_features(row.get("features"))
            desc      = str(features[0])[:200] if features else title[:200]

            total_so_far = len(collected.get(category, []))
            product = {
                "id":          f"hf-{category.lower().replace(' ','-')}-{total_so_far}",
                "name":        title[:100],
                "price":       price_inr,
                "mrp":         mrp_inr,
                "basePrice":   price_inr,
                "rating":      round(float(row.get("average_rating") or 4.0), 1),
                "reviews":     int(row.get("rating_number") or 100),
                "category":    category,
                "brand":       str(row.get("store") or "Brand")[:50],
                "description": desc,
                "image":       image_url,
                "source":      "amazon",
                "inStock":     True,
                "stock":       20,
                "discount":    round(((mrp_inr - price_inr) / mrp_inr) * 100),
            }
            collected.setdefault(category, []).append(product)
            count_this_run += 1

    print(f"  → {count_this_run} products added to {category} (total: {len(collected.get(category,[]))})")

# ── Fashion (curated) ─────────────────────────────────────────────────────────
fashion = [
    {"id":"fa-0","name":"Levi's 511 Slim Fit Jeans","price":2799,"mrp":3999,"basePrice":2799,"rating":4.5,"reviews":45231,"category":"Fashion","brand":"Levi's","description":"Classic 511 slim fit jeans in stretch denim, sits below waist","image":"https://images.unsplash.com/photo-1542272604-787c3835535d?w=400","source":"amazon","inStock":True,"stock":80,"discount":30},
    {"id":"fa-1","name":"Allen Solly Formal Shirt","price":999,"mrp":1799,"basePrice":999,"rating":4.3,"reviews":23456,"category":"Fashion","brand":"Allen Solly","description":"Regular fit cotton formal shirt with full sleeves","image":"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400","source":"amazon","inStock":True,"stock":100,"discount":44},
    {"id":"fa-2","name":"Nike Dri-FIT T-Shirt","price":1299,"mrp":1999,"basePrice":1299,"rating":4.6,"reviews":34567,"category":"Fashion","brand":"Nike","description":"Sweat-wicking Dri-FIT technology, lightweight fabric for training","image":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400","source":"amazon","inStock":True,"stock":120,"discount":35},
    {"id":"fa-3","name":"W Women's Kurta","price":799,"mrp":1299,"basePrice":799,"rating":4.4,"reviews":18900,"category":"Fashion","brand":"W","description":"A-line cotton kurta with ethnic print, 3/4 sleeves","image":"https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400","source":"flipkart","inStock":True,"stock":90,"discount":38},
    {"id":"fa-4","name":"Adidas Ultraboost 22 Running Shoes","price":8999,"mrp":12999,"basePrice":8999,"rating":4.7,"reviews":9876,"category":"Fashion","brand":"Adidas","description":"Responsive Boost midsole, Primeknit upper, linear energy return","image":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400","source":"amazon","inStock":True,"stock":40,"discount":31},
    {"id":"fa-5","name":"Fossil Townsman Chronograph Watch","price":9499,"mrp":14999,"basePrice":9499,"rating":4.5,"reviews":5678,"category":"Fashion","brand":"Fossil","description":"Stainless steel case, leather strap, 44mm, 5ATM water resistant","image":"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400","source":"amazon","inStock":True,"stock":25,"discount":37},
    {"id":"fa-6","name":"Baggit Women's Handbag","price":1499,"mrp":2299,"basePrice":1499,"rating":4.3,"reviews":12345,"category":"Fashion","brand":"Baggit","description":"Vegan leather tote bag with zip closure, multiple compartments","image":"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400","source":"flipkart","inStock":True,"stock":55,"discount":35},
    {"id":"fa-7","name":"Woodland Men's Casual Shoes","price":2499,"mrp":3799,"basePrice":2499,"rating":4.4,"reviews":28900,"category":"Fashion","brand":"Woodland","description":"Genuine leather upper, rubber sole, lace-up casual shoes","image":"https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400","source":"amazon","inStock":True,"stock":60,"discount":34},
    {"id":"fa-8","name":"Fabindia Cotton Kurta Pyjama Set","price":1799,"mrp":2799,"basePrice":1799,"rating":4.5,"reviews":7654,"category":"Fashion","brand":"Fabindia","description":"Handblock printed cotton kurta with matching pyjama","image":"https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400","source":"fabindia","inStock":True,"stock":45,"discount":36},
    {"id":"fa-9","name":"H&M Basic Hoodie","price":1299,"mrp":2199,"basePrice":1299,"rating":4.2,"reviews":34567,"category":"Fashion","brand":"H&M","description":"Relaxed fit hoodie in sweat fabric with kangaroo pocket","image":"https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400","source":"hm","inStock":True,"stock":110,"discount":41},
    {"id":"fa-10","name":"Fastrack Sunglasses UV400","price":899,"mrp":1499,"basePrice":899,"rating":4.3,"reviews":21345,"category":"Fashion","brand":"Fastrack","description":"Polarized UV400 sunglasses with TR90 frame, unisex","image":"https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400","source":"flipkart","inStock":True,"stock":75,"discount":40},
    {"id":"fa-11","name":"Puma Men's Track Pants","price":1199,"mrp":1999,"basePrice":1199,"rating":4.4,"reviews":16789,"category":"Fashion","brand":"Puma","description":"Dry Cell moisture-wicking track pants with side pockets","image":"https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400","source":"amazon","inStock":True,"stock":85,"discount":40},
    {"id":"fa-12","name":"Zara Floral Midi Dress","price":2799,"mrp":4499,"basePrice":2799,"rating":4.6,"reviews":8901,"category":"Fashion","brand":"Zara","description":"Floral print midi dress with V-neckline and puff sleeves","image":"https://images.unsplash.com/photo-1495385794356-15371f348c31?w=400","source":"zara","inStock":True,"stock":35,"discount":38},
    {"id":"fa-13","name":"Jockey Men's Trunks Pack of 3","price":599,"mrp":999,"basePrice":599,"rating":4.6,"reviews":67890,"category":"Fashion","brand":"Jockey","description":"Soft cotton-rich trunks with waistband, pack of 3 assorted colours","image":"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400","source":"amazon","inStock":True,"stock":200,"discount":40},
    {"id":"fa-14","name":"Bata Women's Ballet Flats","price":999,"mrp":1699,"basePrice":999,"rating":4.3,"reviews":13456,"category":"Fashion","brand":"Bata","description":"Comfortable ballet flats with cushioned insole, slip-on style","image":"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400","source":"bata","inStock":True,"stock":70,"discount":41},
    {"id":"fa-15","name":"Arrow Formal Trousers","price":1599,"mrp":2499,"basePrice":1599,"rating":4.4,"reviews":9876,"category":"Fashion","brand":"Arrow","description":"Regular fit poly-viscose formal trousers with 4 pockets","image":"https://images.unsplash.com/photo-1594938298603-c8148c4b4ba4?w=400","source":"amazon","inStock":True,"stock":65,"discount":36},
    {"id":"fa-16","name":"Tanishq Gold Plated Earrings","price":1299,"mrp":1999,"basePrice":1299,"rating":4.5,"reviews":5432,"category":"Fashion","brand":"Tanishq","description":"22KT gold plated jhumka earrings with kundan work","image":"https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400","source":"amazon","inStock":True,"stock":30,"discount":35},
    {"id":"fa-17","name":"Reebok Training Shoes","price":2999,"mrp":4999,"basePrice":2999,"rating":4.5,"reviews":14567,"category":"Fashion","brand":"Reebok","description":"Floatride Energy 4 trainer with DMX foam cushioning","image":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400","source":"amazon","inStock":True,"stock":50,"discount":40},
    {"id":"fa-18","name":"Peter England Checked Shirt","price":999,"mrp":1599,"basePrice":999,"rating":4.3,"reviews":18900,"category":"Fashion","brand":"Peter England","description":"Slim fit checked shirt in cotton blend with full sleeves","image":"https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400","source":"flipkart","inStock":True,"stock":90,"discount":38},
    {"id":"fa-19","name":"Tommy Hilfiger Polo T-Shirt","price":2499,"mrp":3999,"basePrice":2499,"rating":4.6,"reviews":7654,"category":"Fashion","brand":"Tommy Hilfiger","description":"Classic fit pique polo with embroidered flag logo","image":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400","source":"amazon","inStock":True,"stock":60,"discount":38},
]

# ── Books (curated) ──────────────────────────────────────────────────────────
books = [
    {"id":"bk-0","name":"Atomic Habits by James Clear","price":399,"mrp":699,"basePrice":399,"rating":4.8,"reviews":123456,"category":"Books","brand":"Penguin","description":"A proven framework for improving every day — James Clear","image":"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400","source":"amazon","inStock":True,"stock":200,"discount":43},
    {"id":"bk-1","name":"The Psychology of Money","price":349,"mrp":599,"basePrice":349,"rating":4.7,"reviews":89012,"category":"Books","brand":"Jaico","description":"Timeless lessons on wealth, greed, and happiness — Morgan Housel","image":"https://images.unsplash.com/photo-1507842217343-583f20270319?w=400","source":"amazon","inStock":True,"stock":150,"discount":42},
    {"id":"bk-2","name":"Rich Dad Poor Dad","price":299,"mrp":499,"basePrice":299,"rating":4.6,"reviews":234567,"category":"Books","brand":"Manjul","description":"What the rich teach their kids about money — Robert Kiyosaki","image":"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400","source":"amazon","inStock":True,"stock":200,"discount":40},
    {"id":"bk-3","name":"Ikigai: The Japanese Secret","price":249,"mrp":399,"basePrice":249,"rating":4.5,"reviews":78901,"category":"Books","brand":"Penguin","description":"The Japanese secret to a long and happy life","image":"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400","source":"flipkart","inStock":True,"stock":180,"discount":38},
    {"id":"bk-4","name":"The Alchemist by Paulo Coelho","price":199,"mrp":350,"basePrice":199,"rating":4.7,"reviews":345678,"category":"Books","brand":"HarperCollins","description":"A journey of self-discovery — the world's most-read novel","image":"https://images.unsplash.com/photo-1507842217343-583f20270319?w=400","source":"amazon","inStock":True,"stock":250,"discount":43},
    {"id":"bk-5","name":"Zero to One by Peter Thiel","price":399,"mrp":650,"basePrice":399,"rating":4.5,"reviews":45678,"category":"Books","brand":"Virgin Books","description":"Notes on startups — how to build the future","image":"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400","source":"amazon","inStock":True,"stock":120,"discount":39},
    {"id":"bk-6","name":"Harry Potter Complete Set (7 Books)","price":2499,"mrp":3999,"basePrice":2499,"rating":4.9,"reviews":567890,"category":"Books","brand":"Bloomsbury","description":"The complete Harry Potter series by J.K. Rowling","image":"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400","source":"amazon","inStock":True,"stock":80,"discount":38},
    {"id":"bk-7","name":"Think and Grow Rich","price":199,"mrp":350,"basePrice":199,"rating":4.6,"reviews":123456,"category":"Books","brand":"Fingerprint","description":"Napoleon Hill's classic on the philosophy of personal achievement","image":"https://images.unsplash.com/photo-1507842217343-583f20270319?w=400","source":"flipkart","inStock":True,"stock":200,"discount":43},
    {"id":"bk-8","name":"The 5 AM Club by Robin Sharma","price":349,"mrp":599,"basePrice":349,"rating":4.4,"reviews":67890,"category":"Books","brand":"Jaico","description":"Own your morning, elevate your life","image":"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400","source":"amazon","inStock":True,"stock":150,"discount":42},
    {"id":"bk-9","name":"Sapiens: A Brief History of Humankind","price":499,"mrp":799,"basePrice":499,"rating":4.8,"reviews":89012,"category":"Books","brand":"Vintage","description":"Yuval Noah Harari — 70,000 years of human history","image":"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400","source":"amazon","inStock":True,"stock":130,"discount":38},
    {"id":"bk-10","name":"Wings of Fire by APJ Abdul Kalam","price":149,"mrp":250,"basePrice":149,"rating":4.8,"reviews":456789,"category":"Books","brand":"Universities Press","description":"Autobiography of APJ Abdul Kalam — an inspiring journey","image":"https://images.unsplash.com/photo-1507842217343-583f20270319?w=400","source":"amazon","inStock":True,"stock":300,"discount":40},
    {"id":"bk-11","name":"The Secret by Rhonda Byrne","price":249,"mrp":399,"basePrice":249,"rating":4.5,"reviews":78901,"category":"Books","brand":"Simon & Schuster","description":"The secret to living your best life","image":"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400","source":"flipkart","inStock":True,"stock":160,"discount":38},
    {"id":"bk-12","name":"Deep Work by Cal Newport","price":399,"mrp":650,"basePrice":399,"rating":4.6,"reviews":34567,"category":"Books","brand":"Piatkus","description":"Rules for focused success in a distracted world","image":"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400","source":"amazon","inStock":True,"stock":110,"discount":39},
    {"id":"bk-13","name":"The Lean Startup","price":449,"mrp":699,"basePrice":449,"rating":4.5,"reviews":45678,"category":"Books","brand":"Portfolio","description":"Eric Ries — how constant innovation creates radically successful businesses","image":"https://images.unsplash.com/photo-1507842217343-583f20270319?w=400","source":"amazon","inStock":True,"stock":100,"discount":36},
    {"id":"bk-14","name":"Man's Search for Meaning","price":199,"mrp":350,"basePrice":199,"rating":4.8,"reviews":123456,"category":"Books","brand":"Rider","description":"Viktor Frankl's profound memoir — psychiatry in Nazi death camps","image":"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400","source":"amazon","inStock":True,"stock":200,"discount":43},
    {"id":"bk-15","name":"The Monk Who Sold His Ferrari","price":249,"mrp":399,"basePrice":249,"rating":4.4,"reviews":234567,"category":"Books","brand":"Jaico","description":"A spiritual fable about fulfilling your dreams — Robin Sharma","image":"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400","source":"flipkart","inStock":True,"stock":180,"discount":38},
    {"id":"bk-16","name":"Good to Great by Jim Collins","price":549,"mrp":899,"basePrice":549,"rating":4.6,"reviews":45678,"category":"Books","brand":"Harper Business","description":"Why some companies make the leap and others don't","image":"https://images.unsplash.com/photo-1507842217343-583f20270319?w=400","source":"amazon","inStock":True,"stock":90,"discount":39},
    {"id":"bk-17","name":"The 7 Habits of Highly Effective People","price":349,"mrp":599,"basePrice":349,"rating":4.7,"reviews":167890,"category":"Books","brand":"Simon & Schuster","description":"Powerful lessons in personal change — Stephen R. Covey","image":"https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400","source":"amazon","inStock":True,"stock":140,"discount":42},
    {"id":"bk-18","name":"The Power of Now by Eckhart Tolle","price":299,"mrp":499,"basePrice":299,"rating":4.6,"reviews":89012,"category":"Books","brand":"New World Library","description":"A guide to spiritual enlightenment","image":"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400","source":"amazon","inStock":True,"stock":160,"discount":40},
    {"id":"bk-19","name":"Start With Why by Simon Sinek","price":349,"mrp":599,"basePrice":349,"rating":4.6,"reviews":56789,"category":"Books","brand":"Portfolio","description":"How great leaders inspire everyone to take action","image":"https://images.unsplash.com/photo-1507842217343-583f20270319?w=400","source":"amazon","inStock":True,"stock":130,"discount":42},
]

# ── Fitness (Indian brands) ────────────────────────────────────────────────────
fitness = [
    {"id":"fit-0","name":"Kore PVC Dumbbell Set 10kg","price":999,"mrp":1499,"basePrice":999,"rating":4.2,"reviews":15234,"category":"Fitness","brand":"Kore","description":"PVC coated dumbbells, ideal for home workouts","image":"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400","source":"flipkart","inStock":True,"stock":50,"discount":33},
    {"id":"fit-1","name":"Boldfit Resistance Bands Set","price":449,"mrp":799,"basePrice":449,"rating":4.3,"reviews":9821,"category":"Fitness","brand":"Boldfit","description":"Set of 5 resistance bands for full body workout","image":"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400","source":"amazon","inStock":True,"stock":80,"discount":44},
    {"id":"fit-2","name":"Cosco Anti-Tangle Skipping Rope","price":199,"mrp":349,"basePrice":199,"rating":4.1,"reviews":22100,"category":"Fitness","brand":"Cosco","description":"Anti-tangle speed skipping rope with foam handles","image":"https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400","source":"flipkart","inStock":True,"stock":120,"discount":43},
    {"id":"fit-3","name":"Nivia Anti-Slip Yoga Mat 6mm","price":699,"mrp":999,"basePrice":699,"rating":4.4,"reviews":8765,"category":"Fitness","brand":"Nivia","description":"Non-slip 6mm thick yoga mat with carrying strap","image":"https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400","source":"amazon","inStock":True,"stock":60,"discount":30},
    {"id":"fit-4","name":"Strauss Leather Gym Gloves","price":299,"mrp":499,"basePrice":299,"rating":4.0,"reviews":5432,"category":"Fitness","brand":"Strauss","description":"Anti-slip leather gym gloves with wrist support","image":"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400","source":"flipkart","inStock":True,"stock":90,"discount":40},
    {"id":"fit-5","name":"RitFit Double Ab Roller Wheel","price":549,"mrp":899,"basePrice":549,"rating":4.3,"reviews":7654,"category":"Fitness","brand":"RitFit","description":"Double wheel ab roller with knee mat for core workout","image":"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400","source":"amazon","inStock":True,"stock":45,"discount":39},
    {"id":"fit-6","name":"Decathlon Doorframe Pull-Up Bar","price":1299,"mrp":1799,"basePrice":1299,"rating":4.5,"reviews":12300,"category":"Fitness","brand":"Decathlon","description":"Doorframe pull-up bar, no screws needed, holds up to 100kg","image":"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400","source":"decathlon","inStock":True,"stock":30,"discount":28},
    {"id":"fit-7","name":"Boldfit Whey Protein Chocolate 1kg","price":1199,"mrp":1799,"basePrice":1199,"rating":4.2,"reviews":6543,"category":"Fitness","brand":"Boldfit","description":"24g protein per serving, chocolate flavour, 33 servings","image":"https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400","source":"amazon","inStock":True,"stock":75,"discount":33},
    {"id":"fit-8","name":"Lifelong Step Counter Pedometer Watch","price":799,"mrp":1299,"basePrice":799,"rating":4.0,"reviews":4321,"category":"Fitness","brand":"Lifelong","description":"Step counter watch with calorie tracker and alarm","image":"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400","source":"flipkart","inStock":True,"stock":55,"discount":38},
    {"id":"fit-9","name":"Aurion T-40 Motorised Treadmill","price":14999,"mrp":22999,"basePrice":14999,"rating":4.1,"reviews":2890,"category":"Fitness","brand":"Aurion","description":"2HP motorised treadmill with 12 preset programmes, max speed 14km/h","image":"https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400","source":"amazon","inStock":True,"stock":10,"discount":35},
    {"id":"fit-10","name":"Kore K-PRO Adjustable Weight Bench","price":3499,"mrp":5499,"basePrice":3499,"rating":4.3,"reviews":3210,"category":"Fitness","brand":"Kore","description":"Adjustable weight bench with 3 back positions and 2 seat positions","image":"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400","source":"amazon","inStock":True,"stock":20,"discount":36},
    {"id":"fit-11","name":"Strauss High-Density Foam Roller 30cm","price":599,"mrp":899,"basePrice":599,"rating":4.2,"reviews":4567,"category":"Fitness","brand":"Strauss","description":"High-density EVA foam roller for muscle recovery","image":"https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400","source":"flipkart","inStock":True,"stock":65,"discount":33},
    {"id":"fit-12","name":"Nike Sport Wristband L/XL","price":1499,"mrp":1999,"basePrice":1499,"rating":4.6,"reviews":8901,"category":"Fitness","brand":"Nike","description":"Comfortable sport wristband for gym and running","image":"https://images.unsplash.com/photo-1556741533-411cf82e4e2d?w=400","source":"amazon","inStock":True,"stock":100,"discount":25},
    {"id":"fit-13","name":"Adidas Padded Training Gloves","price":849,"mrp":1299,"basePrice":849,"rating":4.4,"reviews":5678,"category":"Fitness","brand":"Adidas","description":"Padded palm training gloves for lifting and cross-training","image":"https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400","source":"amazon","inStock":True,"stock":70,"discount":35},
    {"id":"fit-14","name":"PowerBlock Adjustable Dumbbell 24kg","price":8999,"mrp":12999,"basePrice":8999,"rating":4.7,"reviews":3456,"category":"Fitness","brand":"PowerBlock","description":"Adjustable dumbbell replaces 9 pairs, 2.2-24kg range","image":"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400","source":"amazon","inStock":True,"stock":15,"discount":31},
    {"id":"fit-15","name":"HealthSense HM 152 Body Fat Analyser","price":1299,"mrp":2199,"basePrice":1299,"rating":4.2,"reviews":6789,"category":"Fitness","brand":"HealthSense","description":"Smart body fat scale with 12 measurements via app","image":"https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400","source":"amazon","inStock":True,"stock":40,"discount":41},
    {"id":"fit-16","name":"USI Universal Spin Bike","price":12999,"mrp":19999,"basePrice":12999,"rating":4.3,"reviews":2345,"category":"Fitness","brand":"USI","description":"Magnetic resistance spin bike, 18kg flywheel, adjustable saddle","image":"https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400","source":"amazon","inStock":True,"stock":8,"discount":35},
    {"id":"fit-17","name":"Decathlon Hexagonal Dumbbells 2x5kg","price":799,"mrp":1199,"basePrice":799,"rating":4.4,"reviews":9876,"category":"Fitness","brand":"Decathlon","description":"Rubber coated hexagonal dumbbells, pair of 5kg","image":"https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400","source":"decathlon","inStock":True,"stock":60,"discount":33},
    {"id":"fit-18","name":"Garmin Forerunner 55 GPS Watch","price":14999,"mrp":21999,"basePrice":14999,"rating":4.6,"reviews":4567,"category":"Fitness","brand":"Garmin","description":"GPS running watch with heart rate, daily workouts, 14-day battery","image":"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400","source":"amazon","inStock":True,"stock":18,"discount":32},
    {"id":"fit-19","name":"Soleus Air Pure Fit Resistance Rope","price":649,"mrp":999,"basePrice":649,"rating":4.1,"reviews":3456,"category":"Fitness","brand":"Soleus","description":"Speed rope with ball bearings and adjustable cable for crossfit","image":"https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400","source":"amazon","inStock":True,"stock":55,"discount":35},
]

# ── Home Decor (Indian brands) ─────────────────────────────────────────────────
home_decor = [
    {"id":"hd-0","name":"Philips LED Table Lamp","price":899,"mrp":1299,"basePrice":899,"rating":4.3,"reviews":8923,"category":"Home Decor","brand":"Philips","description":"Energy saving LED table lamp with adjustable brightness","image":"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400","source":"amazon","inStock":True,"stock":40,"discount":31},
    {"id":"hd-1","name":"Solimo Silent Sweep Wall Clock 30cm","price":349,"mrp":599,"basePrice":349,"rating":4.1,"reviews":15678,"category":"Home Decor","brand":"Solimo","description":"Silent sweep 12-inch wall clock for living room and bedroom","image":"https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400","source":"amazon","inStock":True,"stock":80,"discount":42},
    {"id":"hd-2","name":"Craftter Boho Macrame Wall Hanging","price":599,"mrp":999,"basePrice":599,"rating":4.4,"reviews":6789,"category":"Home Decor","brand":"Craftter","description":"Handmade boho macrame wall art, 45x60cm","image":"https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400","source":"flipkart","inStock":True,"stock":35,"discount":40},
    {"id":"hd-3","name":"IKEA FEJKA Artificial Succulent","price":449,"mrp":699,"basePrice":449,"rating":4.5,"reviews":23456,"category":"Home Decor","brand":"IKEA","description":"Realistic artificial succulent in pot, no maintenance required","image":"https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400","source":"ikea","inStock":True,"stock":100,"discount":36},
    {"id":"hd-4","name":"Wakefit Waterproof Mattress Protector","price":799,"mrp":1299,"basePrice":799,"rating":4.6,"reviews":34567,"category":"Home Decor","brand":"Wakefit","description":"Terry cotton waterproof mattress protector, fits 6-8 inch mattress","image":"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400","source":"amazon","inStock":True,"stock":55,"discount":38},
    {"id":"hd-5","name":"Stybuzz White Ceramic Planter Set of 3","price":699,"mrp":1099,"basePrice":699,"rating":4.3,"reviews":5432,"category":"Home Decor","brand":"Stybuzz","description":"Minimalist ceramic planters in white, gold rim, drainage holes","image":"https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400","source":"amazon","inStock":True,"stock":45,"discount":36},
    {"id":"hd-6","name":"Saral Home Geometric Cushion Covers 5pc","price":549,"mrp":899,"basePrice":549,"rating":4.2,"reviews":9876,"category":"Home Decor","brand":"Saral Home","description":"Digital printed cushion covers 16x16 inches, zipper closure, set of 5","image":"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400","source":"flipkart","inStock":True,"stock":70,"discount":39},
    {"id":"hd-7","name":"Nirvana Ultrasonic Aroma Diffuser Kit","price":1299,"mrp":1999,"basePrice":1299,"rating":4.5,"reviews":7654,"category":"Home Decor","brand":"Nirvana","description":"Ultrasonic aroma diffuser with 6 essential oils, 7 LED colours","image":"https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400","source":"amazon","inStock":True,"stock":30,"discount":35},
    {"id":"hd-8","name":"Pepperfry Teak Finish Photo Frames 3pc","price":799,"mrp":1299,"basePrice":799,"rating":4.3,"reviews":4321,"category":"Home Decor","brand":"Pepperfry","description":"Collage photo frames 4x6, 5x7, 6x8 inches in teak finish","image":"https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400","source":"pepperfry","inStock":True,"stock":50,"discount":38},
    {"id":"hd-9","name":"Story@Home 7ft Blackout Curtains Pair","price":1099,"mrp":1799,"basePrice":1099,"rating":4.4,"reviews":12345,"category":"Home Decor","brand":"Story@Home","description":"7ft blackout curtains for bedroom, eyelet top, available in 4 colours","image":"https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400","source":"amazon","inStock":True,"stock":40,"discount":39},
    {"id":"hd-10","name":"Orientbell Matte White Floor Vase 45cm","price":1499,"mrp":2299,"basePrice":1499,"rating":4.2,"reviews":3456,"category":"Home Decor","brand":"Orientbell","description":"Tall ceramic floor vase in matte white, ideal for pampas grass","image":"https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400","source":"flipkart","inStock":True,"stock":25,"discount":35},
    {"id":"hd-11","name":"Amazon Basics Quick-Dry Towel Set 6pc","price":599,"mrp":999,"basePrice":599,"rating":4.5,"reviews":45678,"category":"Home Decor","brand":"Amazon Basics","description":"Ultra-soft 450GSM microfibre bath towels, quick-dry technology","image":"https://images.unsplash.com/photo-1583845112203-29329902332e?w=400","source":"amazon","inStock":True,"stock":120,"discount":40},
    {"id":"hd-12","name":"Nilkamal Compact Plastic Centre Table","price":3499,"mrp":5499,"basePrice":3499,"rating":4.1,"reviews":2345,"category":"Home Decor","brand":"Nilkamal","description":"Sturdy plastic centre table, holds up to 50kg, easy assembly","image":"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400","source":"flipkart","inStock":True,"stock":15,"discount":36},
    {"id":"hd-13","name":"Bombay Dyeing Floral King Bed Sheet","price":849,"mrp":1399,"basePrice":849,"rating":4.4,"reviews":18900,"category":"Home Decor","brand":"Bombay Dyeing","description":"180TC cotton king size bed sheet with 2 pillow covers, floral print","image":"https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400","source":"amazon","inStock":True,"stock":90,"discount":39},
    {"id":"hd-14","name":"Prestige Induction-Safe Stainless Kadai","price":699,"mrp":1099,"basePrice":699,"rating":4.6,"reviews":29876,"category":"Home Decor","brand":"Prestige","description":"Induction compatible stainless steel kadai with glass lid","image":"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400","source":"amazon","inStock":True,"stock":65,"discount":36},
    {"id":"hd-15","name":"Luminara Real Flame Flameless Candle","price":1199,"mrp":1799,"basePrice":1199,"rating":4.3,"reviews":6789,"category":"Home Decor","brand":"Luminara","description":"Flickering LED pillar candles with timer, battery operated","image":"https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400","source":"amazon","inStock":True,"stock":35,"discount":33},
    {"id":"hd-16","name":"Urban Ladder Sheesham Wood Bookshelf","price":8999,"mrp":14999,"basePrice":8999,"rating":4.5,"reviews":3456,"category":"Home Decor","brand":"Urban Ladder","description":"3-tier solid sheesham wood bookshelf with natural finish","image":"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400","source":"urbanladder","inStock":True,"stock":12,"discount":40},
    {"id":"hd-17","name":"Himalaya Room Freshener 250ml","price":149,"mrp":249,"basePrice":149,"rating":4.2,"reviews":34567,"category":"Home Decor","brand":"Himalaya","description":"Natural fragrance room freshener spray, lasts 8 hours","image":"https://images.unsplash.com/photo-1602928321679-560bb453f190?w=400","source":"flipkart","inStock":True,"stock":150,"discount":40},
    {"id":"hd-18","name":"Cello Opalware Dinner Set 35pc","price":2199,"mrp":3499,"basePrice":2199,"rating":4.4,"reviews":8901,"category":"Home Decor","brand":"Cello","description":"35-piece opalware dinner set, microwave safe, break resistant","image":"https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400","source":"amazon","inStock":True,"stock":30,"discount":37},
    {"id":"hd-19","name":"Status Contract Wooden TV Unit","price":5499,"mrp":8999,"basePrice":5499,"rating":4.3,"reviews":2345,"category":"Home Decor","brand":"Status","description":"Engineered wood TV unit with 2 shelves and 1 drawer, walnut finish","image":"https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400","source":"flipkart","inStock":True,"stock":10,"discount":39},
]

# Merge curated into collected
for lst, cat in [(fashion, "Fashion"), (books, "Books"), (fitness, "Fitness"), (home_decor, "Home Decor")]:
    collected.setdefault(cat, []).extend(lst)

all_products = [p for prods in collected.values() for p in prods]

with open("scripts/hf-products.json", "w") as f:
    json.dump(all_products, f, indent=2)

summary = {cat: len(prods) for cat, prods in collected.items()}
print(f"\nProducts per category: {summary}")
print(f"Total products saved: {len(all_products)}")
