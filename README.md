# ShopPersona — AI-Powered E-Commerce App

A modern, full-stack e-commerce web application built with **Next.js 16**, **Firebase**, and **Tailwind CSS**. Features AI-powered personalization, a fully functional admin dashboard, product reviews & Q&A, real-time chat, and a zero-dependency AI shopping assistant.

---

## Tech Stack

| Layer           | Technology                                      |
|-----------------|-------------------------------------------------|
| Framework       | Next.js 16 (App Router)                         |
| Language        | TypeScript 5.7                                  |
| Styling         | Tailwind CSS v4 + shadcn/ui                     |
| Backend / DB    | Firebase (Auth, Firestore, Storage)             |
| Auth            | Firebase Auth (Email/Password + Google OAuth)   |
| AI / ML         | Rule-based chat assistant + OpenAI (optional)   |
| Charts          | Recharts v3                                     |
| Forms           | React Hook Form + Zod                           |
| Payments        | Stripe                                          |
| Analytics       | Vercel Analytics                                |
| Package Manager | npm                                             |

---

## Project Structure

```
shop-persona-e-commerce-app/
├── app/
│   ├── page.tsx                # Home — hero slideshow, categories, brands, best sellers
│   ├── layout.tsx              # Root layout (fonts, providers, analytics)
│   ├── globals.css
│   ├── login/                  # Login page
│   ├── signup/                 # Sign up page
│   ├── search/                 # Product search + semantic/visual search
│   ├── product/[id]/           # Product detail — reviews, Q&A, related
│   ├── cart/                   # Shopping cart
│   ├── checkout/               # Checkout (Stripe)
│   ├── order-success/          # Order confirmation
│   ├── orders/                 # Order history
│   ├── profile/                # User profile
│   ├── returns/                # Returns & exchange requests
│   ├── admin/                  # Admin dashboard (all tabs)
│   └── api/
│       ├── chat/               # Rule-based AI shopping assistant (no API key)
│       ├── daily-deal/         # Daily deal — admin override via Firestore
│       ├── embeddings/         # Product embeddings (OpenAI, optional)
│       ├── semantic-search/    # Natural language search (OpenAI, optional)
│       ├── visual-search/      # Image search via GPT-4o Vision (optional)
│       ├── collaborative/      # Collaborative filtering recommendations
│       └── inventory/          # Real-time inventory + dynamic pricing
│
├── components/
│   ├── Navbar.tsx
│   ├── ProductCard.tsx
│   ├── ProductQA.tsx           # Product Q&A — ask, answer, verified buyer badge
│   ├── AIAssistant.tsx         # Floating chat widget (zero-dependency)
│   ├── DailyDeal.tsx           # Live deal banner (admin-controlled)
│   ├── SemanticSearch.tsx
│   ├── VisualSearch.tsx
│   ├── CollaborativeRecs.tsx
│   ├── ProductPresence.tsx
│   ├── theme-provider.tsx
│   └── ui/                     # shadcn/ui component library (50+ components)
│
├── lib/
│   ├── firebase.ts
│   ├── auth-context.tsx
│   ├── cart-context.tsx
│   ├── products.ts             # Static product catalogue + types
│   ├── reviews-context.tsx     # Reviews — submit, edit, delete, live subscription
│   ├── inventory-context.tsx
│   ├── ab-testing-context.tsx
│   ├── recommendations-context.tsx
│   └── utils.ts
│
├── firestore.rules             # Security rules for all collections
├── firestore.indexes.json      # Composite index definitions
├── .env.local                  # Credentials (not committed)
├── next.config.mjs
└── package.json
```

---

## Features

### 🏠 Home Page
- **Hero Slideshow** — auto-advancing carousel with Today's Deal, Best Seller, New Arrival, Special Offer slides; arrow controls + dot indicators; pauses on hover
- **Perks Strip** — Free Shipping · Top Rated · Hot Deals Daily · Best Price
- **Shop by Category** — 6 emoji tiles (Electronics, Fashion, Home, Books, Sports, Deals) linking to filtered search
- **Personalized Recommendations** — category filter pills to narrow results client-side
- **Best Sellers** — top 4 products by rating with a 🔥 Hot badge
- **Top Brands** — 8 brand logos (Apple, Samsung, Nike, Adidas, Sony, IKEA, Zara, H&M)
- **Why ShopPersona** — feature highlights section
- **Footer** — About, Support, Legal, Follow Us links

### 🔐 Authentication
- Email/password signup & login
- Google OAuth via popup
- Persistent sessions via Firebase Auth
- `user` and `admin` roles stored in Firestore

### 🛍️ Product Detail Page
- Dynamic routing `/product/[id]`
- Real-time viewer presence + low stock indicator
- Add to cart, wishlist, share
- **Customer Reviews**
  - Rating summary with average score + per-star bar breakdown
  - All reviews visible with "Show all" pagination
  - Hover star picker with labels (Poor → Excellent)
  - Each user can submit **one** review (enforced client + server)
  - **Edit** own review inline (pre-filled stars + comment)
  - **Delete** own review with confirmation
  - Admins cannot submit reviews
- **Q&A Section**
  - Any logged-in user can ask a question
  - Only **verified purchasers** (users who bought the product) and **admins** can answer
  - Verified Buyer badge + Official (admin) badge on answers
  - Live updates via Firestore `onSnapshot`

### 🛒 Shopping & Orders
- Cart persisted to Firestore per user
- Stripe checkout integration
- Order history per user
- Cancellation request flow

### 🔄 Returns & Exchanges
- Users submit return/exchange requests
- Live chat between user and admin on each request
- Admin can approve, reject, schedule pickup/exchange date, add notes
- Unread message indicator

### 💬 Support Tickets
- Users open support tickets linked to orders
- Live chat panel in admin dashboard
- Ticket status: open → replied → closed

### 💡 AI Shopping Assistant (Zero API Key Required)
- Floating chat widget on every page
- Understands greetings, help requests, category names, budget (cheap/premium), gift ideas
- Matches products by name, category keywords, price intent, rating
- Formats replies with bold product names, prices, ratings and descriptions
- Fully self-contained — **no OpenAI key needed**

### 🏷️ Daily Deal
- Admin-controlled from the **Daily Deal** tab in the dashboard
- Pick any product, set discount %, set duration in hours
- Instantly overrides the auto-logic for all users via Firestore
- Live countdown timer in the deal banner
- Falls back to date-seeded auto-deal when no override is active

### 📊 Admin Dashboard (9 tabs)

| Tab | What it does |
|---|---|
| **Overview** | KPI cards (Revenue, Orders, Users, Pending Inbox), revenue/category charts, recent activity, top products, live notifications panel |
| **Analytics** | AOV trend, return rate, order volume by month, revenue by category |
| **Orders** | Search/filter, status update, expand order details, cancellation approve/reject |
| **Returns** | Filter by status/type, approve/reject, schedule pickup or exchange, admin notes, live chat |
| **Support** | Live ticket list, chat panel, close ticket |
| **Payments** | Stripe vs COD breakdown, payment table |
| **Users** | Search users, toggle admin/user role |
| **Products** | Full CRUD — add, edit, delete, inline stock edit, sales/revenue per product |
| **Inventory** | Stock levels bar chart, bulk restock, per-product set-stock |
| **Daily Deal** | Set today's deal — product picker, discount %, duration, live preview |

- Red dot badges on Support and Returns tabs when there are unread/pending items
- Pending Inbox KPI card with live count breakdown
- Live notifications panel on Overview linking directly to relevant tabs

---

## Pages & Routes

| Route | Description | Auth Required |
|---|---|---|
| `/` | Home / landing page | No |
| `/login` | Login | No |
| `/signup` | Sign up | No |
| `/search` | Search + AI search tools | No |
| `/product/[id]` | Product detail, reviews, Q&A | No |
| `/cart` | Shopping cart | Yes |
| `/checkout` | Stripe checkout | Yes |
| `/order-success` | Order confirmation | Yes |
| `/orders` | Order history | Yes |
| `/returns` | Returns & exchanges | Yes |
| `/profile` | User profile | Yes |
| `/admin` | Admin dashboard | Yes (admin only) |

---

## Firestore Collections

| Collection | Purpose |
|---|---|
| `users` | User profiles + roles |
| `orders` | Order records |
| `carts` | Per-user cart |
| `wishlists` | Per-user wishlist |
| `reviews` | Product reviews (one per user per product) |
| `product_qa` | Product questions + answers subcollection |
| `returns` | Return/exchange requests + messages subcollection |
| `support_tickets` | Support tickets + messages subcollection |
| `inventory` | Stock overrides per product |
| `products` | Firestore product overrides (on top of static catalogue) |
| `daily_deal` | Admin-set daily deal override |
| `user_behavior` | View/purchase tracking for recommendations |
| `product_presence` | Real-time viewer counts |

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Firebase (required)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin SDK (required for daily-deal API)
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# Stripe (required for checkout)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# OpenAI (optional — only for semantic search, visual search, embeddings)
OPENAI_API_KEY=...
```

> The AI chat assistant, daily deal, reviews, Q&A, and all core features work **without** an OpenAI key.

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Add environment variables
cp .env.local.example .env.local  # then fill in your values

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Security

- Firebase credentials in `.env.local`, never hardcoded
- Firestore security rules enforce ownership — users can only edit/delete their own reviews, access their own cart/orders/wishlist
- Review edit/delete guarded by `request.auth.uid == resource.data.userId`
- Admin routes protected both client-side (role check + redirect) and via Firestore rules
- XSS-safe chart component
- AI chat assistant renders user input as plain text; only assistant markdown is parsed

---

## Deployment

Deploy instantly on **Vercel**:

1. Push to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Deploy

Vercel Analytics is automatically enabled in production.
