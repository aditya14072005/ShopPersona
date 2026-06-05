import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { CartProvider } from '@/lib/cart-context'
import { RecommendationsProvider } from '@/lib/recommendations-context'
import { ReviewsProvider } from '@/lib/reviews-context'
import { InventoryProvider } from '@/lib/inventory-context'
import { ABTestingProvider } from '@/lib/ab-testing-context'
import { AIAssistant } from '@/components/AIAssistant'
import { DailyDeal } from '@/components/DailyDeal'
import { AnimatedBackground } from '@/components/AnimatedBackground'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'ShopPersona - AI-Powered Personalized Shopping',
  description: 'Discover products tailored to your style with AI-powered personalization',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased bg-background text-foreground">
        <AnimatedBackground />
        <AuthProvider>
          <CartProvider>
            <InventoryProvider>
              <ABTestingProvider>
                <RecommendationsProvider>
                  <ReviewsProvider>
                    <DailyDeal />
                    {children}
                    <AIAssistant />
                  </ReviewsProvider>
                </RecommendationsProvider>
              </ABTestingProvider>
            </InventoryProvider>
          </CartProvider>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
