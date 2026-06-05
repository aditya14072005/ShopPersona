'use client';

import { Navbar } from '@/components/Navbar';
import { ShoppingBag, Users, Zap, Shield, Star, TrendingUp } from 'lucide-react';

const stats = [
  { value: '50K+', label: 'Happy Customers' },
  { value: '10K+', label: 'Products Listed' },
  { value: '500+', label: 'Trusted Brands' },
  { value: '4.9★', label: 'Average Rating' },
];

const values = [
  { icon: Zap,        title: 'AI-Powered',       desc: 'Smart recommendations tailored to your unique taste and shopping behaviour.' },
  { icon: Shield,     title: 'Secure & Trusted',  desc: 'End-to-end encrypted payments and verified sellers on every transaction.' },
  { icon: Users,      title: 'Community First',   desc: 'Real reviews from real buyers. No fake ratings, ever.' },
  { icon: TrendingUp, title: 'Best Prices',       desc: 'Dynamic pricing and daily deals ensure you always get the best value.' },
  { icon: Star,       title: 'Top Quality',       desc: 'Every product is curated and quality-checked before it hits our shelves.' },
  { icon: ShoppingBag,title: 'Easy Returns',      desc: 'Hassle-free 30-day returns and live support for every order.' },
];

const team = [
  { name: 'Aditya M.',   role: 'Founder & CEO',       avatar: 'AM', color: '#3b82f6' },
  { name: 'Priya S.',    role: 'Head of Product',      avatar: 'PS', color: '#06b6d4' },
  { name: 'Rahul K.',    role: 'Lead Engineer',        avatar: 'RK', color: '#8b5cf6' },
  { name: 'Sneha T.',    role: 'Design & UX',          avatar: 'ST', color: '#ec4899' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg,#eff6ff,#ecfeff)', padding: '72px 20px 56px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
            fontSize: '12px', fontWeight: 700, letterSpacing: '2px', padding: '4px 14px',
            borderRadius: '999px', marginBottom: '20px', textTransform: 'uppercase' }}>
            Our Story
          </span>
          <h1 style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, color: '#1a202c',
            lineHeight: 1.15, marginBottom: '20px' }}>
            Shopping, Reimagined with{' '}
            <span style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Intelligence
            </span>
          </h1>
          <p style={{ fontSize: '17px', color: '#64748b', lineHeight: 1.7, maxWidth: '560px', margin: '0 auto' }}>
            ShopPersona was built on a simple belief — every shopper deserves a store that truly knows them.
            We combine AI-driven personalization with a curated marketplace to make discovery effortless and shopping joyful.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '24px', textAlign: 'center' }}>
          {stats.map(({ value, label }) => (
            <div key={label}>
              <div style={{ fontSize: '36px', fontWeight: 800, background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{value}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1a202c', marginBottom: '16px' }}>Our Mission</h2>
        <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.8 }}>
          We set out to eliminate the frustration of endless scrolling and irrelevant recommendations.
          By listening to how you browse, what you love, and what you skip, ShopPersona builds a living picture
          of your style — and surfaces exactly what you&apos;ll want next, before you even search for it.
        </p>
      </section>

      {/* Values */}
      <section style={{ background: '#f8fafc', padding: '64px 20px' }}>
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1a202c', textAlign: 'center', marginBottom: '40px' }}>
            What We Stand For
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '20px' }}>
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ background: '#fff', borderRadius: '16px', padding: '28px',
                border: '1px solid #e2e8f0', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(59,130,246,0.12)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: '12px',
                  background: 'linear-gradient(135deg,rgba(59,130,246,0.12),rgba(6,182,212,0.1))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                  <Icon size={20} color="#3b82f6" />
                </div>
                <div style={{ fontWeight: 700, color: '#1a202c', marginBottom: '6px' }}>{title}</div>
                <div style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section style={{ maxWidth: '900px', margin: '0 auto', padding: '64px 20px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1a202c', textAlign: 'center', marginBottom: '40px' }}>
          Meet the Team
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '24px', textAlign: 'center' }}>
          {team.map(({ name, role, avatar, color }) => (
            <div key={name} style={{ padding: '28px 20px', background: '#fff', borderRadius: '16px',
              border: '1px solid #e2e8f0', transition: 'transform 0.2s' }}
              onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)')}
              onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.transform = 'none')}
            >
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '18px', margin: '0 auto 12px' }}>
                {avatar}
              </div>
              <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '15px' }}>{name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer strip */}
      <section style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', padding: '48px 20px', textAlign: 'center' }}>
        <h3 style={{ color: '#fff', fontWeight: 800, fontSize: '22px', marginBottom: '8px' }}>
          Ready to experience smarter shopping?
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', marginBottom: '24px' }}>
          Join thousands of happy shoppers today.
        </p>
        <a href="/search" style={{ display: 'inline-block', background: '#fff', color: '#3b82f6',
          fontWeight: 700, fontSize: '14px', padding: '12px 32px', borderRadius: '10px',
          textDecoration: 'none', transition: 'transform 0.2s' }}
          onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)')}
          onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.transform = 'none')}
        >
          Start Shopping →
        </a>
      </section>
    </div>
  );
}
