# ShopPersona — AI-Powered E-Commerce App

A modern, full-stack e-commerce web application built with Next.js 16, Firebase, and Tailwind CSS. It features AI-powered product personalization, user authentication, a shopping cart, order management, and an admin dashboard.

---

## Tech Stack

| Layer           | Technology                                    |
|-----------------|-----------------------------------------------|
| Framework       | Next.js 16 (App Router)                       |
| Language        | TypeScript 5.7                                |
| Styling         | Tailwind CSS v4 + shadcn/ui                   |
| Backend / DB    | Firebase (Auth, Firestore, Storage)           |
| Auth            | Firebase Auth (Email/Password + Google OAuth) |
| AI / ML         | OpenAI (Embeddings, GPT-4o Vision)            |
| Charts          | Recharts v3                                   |
| Forms           | React Hook Form + Zod                         |
| Analytics       | Vercel Analytics                              |
| Package Manager | npm                                           |

---

## Project Structure

```
shop-persona-e-commerce-app/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Home / landing page
│   ├── layout.tsx              # Root layout (fonts, providers, analytics)
│   ├── globals.css             # Global styles
│   ├── login/                  # Login page
│   ├── signup/                 # Sign up page
│   ├── search/                 # Product search page (with AI search tools)
│   ├── product/[id]/           # Dynamic product detail page
│   ├── cart/                   # Shopping cart page
│   ├── checkout/               # Checkout page
│   ├── order-success/          # Order confirmation page
│   ├── orders/                 # Order history page
│   ├── profile/                # User profile page
│   ├── admin/                  # Admin dashboard page
│   └── api/
│       ├── embeddings/         # Generate product embeddings (OpenAI)
│       ├── semantic-search/    # Natural language search via embeddings
│       ├── visual-search/      # Image-based search (GPT-4o vision)
│       ├── collaborative/      # Collaborative filtering for recommendations
│       ├── chat/               # AI chat assistant
│       ├── inventory/          # Real-time inventory + dynamic pricing
│       └── (other API routes)
│
├── components/
│   ├── Navbar.tsx              # Top navigation bar
│   ├── ProductCard.tsx         # Product listing card
│   ├── SemanticSearch.tsx      # Natural language semantic search UI
│   ├── VisualSearch.tsx        # Image-based visual search UI
│   ├── CollaborativeRecs.tsx   # "Users Like You Also Bought" section
│   ├── AIAssistant.tsx         # AI chat widget
│   ├── DailyDeal.tsx           # Time-limited deal notification
│   ├── theme-provider.tsx      # Dark/light theme provider
│   └── ui/                     # shadcn/ui component library
│       ├── button.tsx, input.tsx, card.tsx, dialog.tsx ...
│       ├── chart.tsx           # Recharts wrapper (XSS-safe)
│       └── (50+ UI components)
│
├── lib/
│   ├── firebase.ts             # Firebase app initialization (uses env vars)
│   ├── auth-context.tsx        # Auth state, login, signup, Google OAuth
│   ├── cart-context.tsx        # Cart state synced to Firestore
│   ├── products.ts             # Static product catalogue + types (with embeddings)
│   ├── inventory-context.tsx   # Real-time inventory + dynamic pricing
│   ├── ab-testing-context.tsx  # A/B testing for recommendation strategies
│   ├── recommendations-context.tsx # Personalized product recommendations
│   ├── reviews-context.tsx     # Product reviews management
│   └── utils.ts                # Tailwind class merge utility
│
├── hooks/
│   ├── use-mobile.ts           # Responsive mobile detection hook
│   └── use-toast.ts            # Toast notification hook
│
├── public/                     # Static assets (icons, placeholders)
├── styles/                     # Additional global styles
├── .env.local                  # Firebase credentials (not committed)
├── next.config.mjs             # Next.js config
├── tailwind.config / postcss.config.mjs
├── tsconfig.json
└── package.json
```

---

## Features

- **Home Page** — Hero section, featured product grid, AI benefits section, footer
- **Authentication** — Email/password signup & login, Google OAuth, persistent sessions via Firebase Auth
- **User Roles** — `user` and `admin` roles stored in Firestore
- **Product Catalogue** — 8 products across 6 categories (Electronics, Fashion, Home, Books, Sports)
- **Product Search** — Filter and search products by name/category
- **Product Detail** — Individual product pages via dynamic routing `/product/[id]`
- **Shopping Cart** — Add, remove, update quantity; cart persisted to Firestore per user
- **Checkout** — Checkout flow with order placement
- **Order History** — View past orders per user
- **Admin Dashboard** — Admin-only page for store management
- **Dark / Light Theme** — System-aware theme switching
- **Vercel Analytics** — Production-only analytics tracking

### AI-Powered Features (NEW) ✨
- **Semantic Search** — Natural language product search (e.g., "cozy winter outfit") using OpenAI embeddings
- **Visual Search** — Find similar products by pasting an image URL; AI describes the image and finds matches
- **Collaborative Filtering** — "Users Like You Also Bought" recommendations based on purchase patterns (Jaccard similarity)
- **Dynamic Pricing & Inventory** — Real-time stock levels and surge/discount pricing indicators
- **A/B Testing** — Recommendation strategy testing (category-based vs. collaborative filtering)
- **Product Embeddings** — All products auto-generate semantic embeddings for vector search
- **AI Chat Assistant** — Sidebar chat widget for product recommendations
- **Daily Deals** — Time-limited promotional notifications

---

## Pages & Routes

| Route | Description | Auth Required |
|---|---|---|
| `/` | Home / landing page | No |
| `/login` | Login with email or Google | No |
| `/signup` | Create a new account | No |
| `/search` | Search and filter products | No |
| `/product/[id]` | Product detail page | No |
| `/cart` | Shopping cart | Yes |
| `/checkout` | Checkout | Yes |
| `/order-success` | Order confirmation | Yes |
| `/orders` | Order history | Yes |
| `/profile` | User profile | Yes |
| `/admin` | Admin dashboard | Yes (admin only) |

---

## Firebase Services Used

| Service | Usage |
|---|---|
| Firebase Auth | User signup, login, Google OAuth, session management |
| Firestore | User profiles, carts, orders, user behavior (for collaborative filtering) |
| Firebase Storage | File/image storage |
| OpenAI API | Product embeddings (semantic search), GPT-4o vision (visual search) |
| Stripe | Payment processing for checkout |

---

## Environment Variables

Create a `.env.local` file in the project root (already set up):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

FIREBASE_CLIENT_EMAIL=...          # Service account for admin SDK
FIREBASE_PRIVATE_KEY=...           # Service account private key

NEXT_PUBLIC_STRIPE_PUBLIC_KEY=...  # Stripe publishable key
STRIPE_SECRET_KEY=...              # Stripe secret key

OPENAI_API_KEY=...                 # OpenAI API key (for embeddings & vision)
```

> `.env.local` is git-ignored and never committed.

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Make sure `.env.local` exists with your Firebase credentials (see above).

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server (after build) |
| `npm run lint` | Run ESLint |

---

## Security

- Firebase credentials stored in `.env.local`, never hardcoded
- XSS-safe chart component — uses `style.setProperty()` instead of `dangerouslySetInnerHTML`
- All dependencies audited — `npm audit` reports **0 vulnerabilities**
- npm `overrides` enforce patched versions of `postcss` (≥8.5.10) across all transitive deps
- Recharts upgraded to v3, eliminating the vulnerable `lodash` dependency

---

## Deployment

This project is ready to deploy on **Vercel**:

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add all `NEXT_PUBLIC_FIREBASE_*` environment variables in the Vercel dashboard
4. Deploy

Vercel Analytics is automatically enabled in production.
