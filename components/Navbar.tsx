'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import {
  Package, MapPin, CreditCard, RefreshCw, Heart,
  LayoutDashboard, LogOut, User, X, Menu,
} from 'lucide-react';

/* ─── helpers ───────────────────────────────────────────────────────────── */
const SPRING = 'cubic-bezier(0.34,1.56,0.64,1)';

/* ─── Animated Search Icon ───────────────────────────────────────────────── */
function SearchIcon({ hovered }: { hovered: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{
      transition: `transform 0.3s ${SPRING}`,
      transform: hovered ? 'rotate(-20deg) scale(1.18)' : 'none',
      filter: hovered ? 'drop-shadow(0 0 6px rgba(59,130,246,0.55))' : 'none',
    }}>
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.8"/>
      <line x1="13" y1="13" x2="18" y2="18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      {/* scanning line */}
      <line x1="5.5" y1="8.5" x2="11.5" y2="8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
        style={{ opacity: hovered ? 1 : 0, transition:'opacity 0.2s', strokeDasharray:'6', strokeDashoffset: hovered ? '0' : '6',
          animation: hovered ? 'scan 0.5s ease forwards' : 'none' }}/>
      {/* shine dot */}
      {hovered && <circle cx="10.5" cy="6.5" r="1" fill="#3b82f6" opacity="0.7"/>}
    </svg>
  );
}

/* ─── Cart burst dots ────────────────────────────────────────────────────── */
function CartBurst({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', pointerEvents:'none' }}>
      {['-18px','0px','18px'].map((x, i) => (
        <div key={i} style={{
          position:'absolute', width:'6px', height:'6px', borderRadius:'50%',
          background:'#3b82f6', left:x,
          animation:`cartBurst 0.45s ease forwards ${i*0.06}s`, opacity:0,
        }}/>
      ))}
    </div>
  );
}

/* ─── Main Navbar ────────────────────────────────────────────────────────── */
export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, logout } = useAuth();
  const { itemCount } = useCart();

  const [scrolled, setScrolled]         = useState(false);
  const [searchOpen, setSearchOpen]     = useState(false);
  const [searchVal, setSearchVal]       = useState('');
  const [listening, setListening]       = useState(false);
  const [dropOpen, setDropOpen]         = useState(false);
  const [mobileOpen, setMobileOpen]     = useState(false);

  // "reel" hover tracking
  const [hoveredLink, setHoveredLink]   = useState<string|null>(null);
  const [hoveredIcon, setHoveredIcon]   = useState<string|null>(null);
  const [searchHov, setSearchHov]       = useState(false);
  const [cartHov, setCartHov]           = useState(false);
  const [cartBurst, setCartBurst]       = useState(false);
  const [wishHov, setWishHov]           = useState(false);
  const [profileHov, setProfileHov]     = useState(false);

  const dropRef    = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);

  /* scroll shrink */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      if (window.scrollY > 50) setSearchOpen(false);
    };
    window.addEventListener('scroll', onScroll, { passive:true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* close dropdown outside */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* escape closes search */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  /* focus search input when opened */
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  /* cart burst */
  const handleCartEnter = () => {
    setCartHov(true);
    setCartBurst(true);
    setHoveredIcon('cart');
    setTimeout(() => setCartBurst(false), 500);
  };

  /* voice search */
  const handleVoice = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.onstart  = () => setListening(true);
    rec.onend    = () => setListening(false);
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setSearchVal(t);
      router.push(`/search?q=${encodeURIComponent(t)}`);
      setSearchOpen(false);
    };
    rec.start();
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchVal('');
      setSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    setDropOpen(false);
    await logout();
    router.push('/');
  };

  /* nav links */
  const navLinks = [
    { label:'Home',       href:'/' },
    { label:'Collection', href:'/search' },
    { label:'About',      href:'/about' },
    { label:'Contact',    href:'/contact' },
    ...(userProfile?.role === 'admin'  ? [{ label:'Dashboard', href:'/admin' }] : []),
    ...(userProfile?.role === 'vendor' ? [{ label:'Dashboard', href:'/vendor-dashboard' }] : []),
  ];

  /* role-based dropdown items */
  const baseItems = [
    { href:'/profile',   icon:'👤', label:'My Account' },
    { href:'/orders',    icon:'📦', label:'My Orders' },
    { href:'/wishlist',  icon:'❤️',  label:'Wishlist' },
    { href:'/addresses', icon:'📍', label:'Saved Addresses' },
    { href:'/payments',  icon:'💳', label:'Payment Methods' },
    { href:'/returns',   icon:'🔄', label:'Returns & Exchanges' },
  ];
  const adminItems = [{ href:'/admin',            icon:'🛠️', label:'Admin Dashboard' }];
  const menuItems  = userProfile?.role === 'admin' ? [...baseItems, ...adminItems] : baseItems;

  const initials = userProfile?.name
    ? userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)
    : '?';

  /* icon reel style */
  const iconStyle = (key: string) => ({
    transition: `transform 0.25s ${SPRING}, opacity 0.2s, filter 0.2s`,
    transform: hoveredIcon === key ? `scale(1.35) translateY(-2px)` : hoveredIcon ? 'scale(0.82) translateY(1px)' : 'none',
    opacity: hoveredIcon && hoveredIcon !== key ? 0.4 : 1,
    filter:  hoveredIcon && hoveredIcon !== key ? 'blur(0.4px)' : 'none',
  });

  /* link reel style */
  const linkStyle = (href: string) => ({
    transition: `transform 0.25s ${SPRING}, opacity 0.2s, filter 0.2s, color 0.15s`,
    transform: hoveredLink === href
      ? 'scale(1.35) translateY(-3px)'
      : hoveredLink ? 'scale(0.78) translateY(2px)' : 'none',
    opacity:   hoveredLink && hoveredLink !== href ? 0.4 : 1,
    filter:    hoveredLink && hoveredLink !== href ? 'blur(0.4px)' : 'none',
    color:     hoveredLink === href ? '#3b82f6' : pathname === href ? '#1a202c' : '#64748b',
    fontWeight: hoveredLink === href || pathname === href ? 700 : 500,
    textShadow: hoveredLink === href ? '0 0 12px rgba(59,130,246,0.45)' : 'none',
    display: 'inline-block',
  });

  /* navbar size transitions */
  const navPy    = scrolled ? '8px'  : '16px';
  const navBg    = scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.5)';
  const navBlur  = scrolled ? 'blur(16px)' : 'blur(6px)';
  const navShadow= scrolled ? '0 2px 20px rgba(59,130,246,0.1)' : 'none';
  const navBorder= scrolled ? '1px solid rgba(226,232,240,0.8)' : '1px solid transparent';
  const logoW    = scrolled ? '76px' : '96px';
  const textSz   = scrolled ? '12px' : '14px';

  return (
    <>
      <style>{`
        @keyframes cartBurst {
          0%   { transform: translateY(0) scale(1); opacity:1; }
          100% { transform: translateY(-22px) scale(0.4); opacity:0; }
        }
        @keyframes heartbeat {
          0%,100% { transform: scale(1.35) translateY(-2px); }
          50%     { transform: scale(1.55) translateY(-4px); }
        }
        @keyframes scan {
          from { stroke-dashoffset: 6; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes drawerIn  { from { transform:translateX(100%); } to { transform:translateX(0); } }
        @keyframes drawerOut { from { transform:translateX(0); }   to { transform:translateX(100%); } }
      `}</style>

      <nav style={{
        position:'sticky', top:0, zIndex:50,
        background: navBg,
        backdropFilter: navBlur,
        borderBottom: navBorder,
        boxShadow: navShadow,
        transition: 'all 0.5s ease',
        padding: `${navPy} 0`,
      }}>
        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px' }}>

          {/* ── Logo ── */}
          <Link href="/" style={{ flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', transition:`transform 0.4s ${SPRING}` }}
              onMouseEnter={e => (e.currentTarget.style.transform='scale(1.08) translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform='none')}
            >
              <div style={{ width:logoW, height:'32px', background:'linear-gradient(135deg,#3b82f6,#06b6d4)', borderRadius:'8px',
                display:'flex', alignItems:'center', justifyContent:'center', transition:'width 0.5s ease' }}>
                <span style={{ color:'white', fontWeight:800, fontSize:'13px', letterSpacing:'0.5px' }}>ShopPersona</span>
              </div>
            </div>
          </Link>

          {/* ── Desktop nav links (center) ── */}
          <div className="hidden md:flex" style={{ gap:'28px', alignItems:'center' }}>
            {navLinks.map(({ label, href }) => (
              <Link key={href} href={href}
                style={{ ...linkStyle(href), fontSize: textSz, textDecoration:'none', position:'relative', paddingBottom:'2px' }}
                onMouseEnter={() => setHoveredLink(href)}
                onMouseLeave={() => setHoveredLink(null)}
              >
                {label}
                <span style={{
                  position:'absolute', bottom:0, left:0,
                  height:'2px', borderRadius:'2px',
                  background:'#3b82f6',
                  width: hoveredLink === href ? '100%' : '0%',
                  transition:'width 0.25s ease',
                }}/>
              </Link>
            ))}
          </div>

          {/* ── Right icons ── */}
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>

            {/* Search */}
            <div style={{ display:'flex', alignItems:'center', position:'relative' }}>
              <button
                aria-label="Search"
                onMouseEnter={() => { setSearchHov(true); setHoveredIcon('search'); }}
                onMouseLeave={() => { setSearchHov(false); setHoveredIcon(null); }}
                onClick={() => setSearchOpen(v => !v)}
                style={{
                  ...iconStyle('search'),
                  background: searchOpen || searchHov ? 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(6,182,212,0.12))' : 'transparent',
                  border: searchOpen || searchHov ? '1px solid rgba(59,130,246,0.35)' : '1px solid transparent',
                  borderRadius:'10px', padding:'8px', cursor:'pointer', color:'#64748b',
                  boxShadow: searchOpen || searchHov ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
                }}
              >
                <SearchIcon hovered={searchHov || searchOpen} />
              </button>

              {/* Expanded search bar */}
              <div style={{
                overflow:'hidden',
                width: searchOpen ? '288px' : '0',
                transition:'width 0.35s cubic-bezier(0.4,0,0.2,1)',
                marginLeft: searchOpen ? '6px' : '0',
              }}>
                <form onSubmit={handleSearch} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                  <input ref={searchRef} value={searchVal} onChange={e => setSearchVal(e.target.value)}
                    placeholder="Search products…"
                    style={{ width:'200px', padding:'7px 12px', borderRadius:'8px', border:'1.5px solid #e2e8f0',
                      background:'rgba(255,255,255,0.9)', fontSize:'13px', outline:'none', color:'#1a202c' }}
                    onFocus={e => (e.target.style.borderColor='#3b82f6')}
                    onBlur={e  => (e.target.style.borderColor='#e2e8f0')}
                  />
                  {/* voice */}
                  <button type="button" onClick={handleVoice} title="Voice search"
                    style={{ padding:'7px', borderRadius:'8px', border:'1px solid #e2e8f0',
                      background: listening ? '#ef4444' : 'white', cursor:'pointer', color: listening ? 'white' : '#64748b' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="2" width="6" height="11" rx="3"/>
                      <path d="M5 10a7 7 0 0 0 14 0M12 19v3M9 22h6"/>
                    </svg>
                  </button>
                  {searchVal && (
                    <button type="button" onClick={() => setSearchVal('')}
                      style={{ padding:'4px', background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
                      <X size={14}/>
                    </button>
                  )}
                </form>
              </div>
            </div>

            {/* Wishlist */}
            {user && userProfile?.role !== 'admin' && (
              <Link href="/wishlist" aria-label="Wishlist"
                onMouseEnter={() => { setWishHov(true); setHoveredIcon('wish'); }}
                onMouseLeave={() => { setWishHov(false); setHoveredIcon(null); }}
                style={{
                  ...iconStyle('wish'),
                  background: wishHov ? 'linear-gradient(135deg,rgba(236,72,153,0.15),rgba(236,72,153,0.08))' : 'transparent',
                  border: wishHov ? '1px solid rgba(236,72,153,0.4)' : '1px solid transparent',
                  borderRadius:'10px', padding:'8px', position:'relative',
                  color: wishHov ? '#ec4899' : '#64748b',
                  boxShadow: wishHov ? '0 0 0 3px rgba(236,72,153,0.15)' : 'none',
                  animation: wishHov ? 'heartbeat 0.5s ease infinite' : 'none',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  textDecoration:'none',
                }}
              >
                <Heart size={20} fill={wishHov ? '#ec4899' : 'none'} />
              </Link>
            )}

            {/* Cart */}
            {userProfile?.role !== 'admin' && (
              <Link href="/cart" aria-label="Cart"
                onMouseEnter={handleCartEnter}
                onMouseLeave={() => { setCartHov(false); setHoveredIcon(null); }}
                style={{
                  ...iconStyle('cart'),
                  background: cartHov ? 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(6,182,212,0.1))' : 'transparent',
                  border: cartHov ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                  borderRadius:'10px', padding:'8px', position:'relative',
                  color: cartHov ? '#3b82f6' : '#64748b',
                  boxShadow: cartHov ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  textDecoration:'none',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  style={{ transform: cartHov ? 'rotate(12deg)' : 'none', transition:`transform 0.25s ${SPRING}` }}>
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                <CartBurst show={cartBurst} />
                {itemCount > 0 && (
                  <span style={{
                    position:'absolute', top:'-3px', right:'-3px',
                    background:'#3b82f6', color:'white', fontSize:'10px', fontWeight:700,
                    width:'17px', height:'17px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                    transform: cartHov ? 'scale(1.2)' : 'scale(1)',
                    transition:`transform 0.2s ${SPRING}`,
                  }}>
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* Profile */}
            {user ? (
              <div ref={dropRef} style={{ position:'relative' }}>
                <button
                  onClick={() => setDropOpen(v => !v)}
                  onMouseEnter={() => { setProfileHov(true); setHoveredIcon('profile'); }}
                  onMouseLeave={() => { setProfileHov(false); setHoveredIcon(null); }}
                  style={{
                    ...iconStyle('profile'),
                    background: dropOpen
                      ? 'linear-gradient(135deg,#3b82f6,#06b6d4)'
                      : profileHov ? 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(6,182,212,0.1))' : 'transparent',
                    border: profileHov || dropOpen ? '1px solid rgba(59,130,246,0.4)' : '1px solid transparent',
                    borderRadius:'10px', padding:'6px', cursor:'pointer',
                    boxShadow: profileHov || dropOpen ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
                    display:'flex', alignItems:'center', gap:'6px',
                  }}
                >
                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', overflow:'hidden',
                    background:'linear-gradient(135deg,#3b82f6,#06b6d4)', display:'flex', alignItems:'center', justifyContent:'center',
                    filter: profileHov && !dropOpen ? 'hue-rotate(180deg)' : 'none',
                    transform: profileHov && !dropOpen ? 'rotateY(180deg)' : 'none',
                    transition:`transform 0.4s ease, filter 0.3s ease`,
                  }}>
                    {userProfile?.avatar
                      ? <img src={userProfile.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                      : <span style={{ color:'white', fontWeight:700, fontSize:'11px' }}>{initials}</span>
                    }
                  </div>
                  <span className="hidden lg:inline" style={{
                    fontSize:'13px', fontWeight:600,
                    color: dropOpen ? 'white' : '#1a202c',
                    maxWidth:'80px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                  }}>
                    {userProfile?.name?.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown */}
                {dropOpen && (
                  <div style={{
                    position:'absolute', right:0, top:'calc(100% + 8px)',
                    width:'256px', background:'white', borderRadius:'16px',
                    border:'1px solid #e2e8f0', boxShadow:'0 8px 32px rgba(59,130,246,0.15)',
                    overflow:'hidden', zIndex:60,
                  }}>
                    {/* Header */}
                    <div style={{ background:'linear-gradient(135deg,#3b82f6,#06b6d4)', padding:'16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                        <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(255,255,255,0.25)',
                          display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:700, fontSize:'15px' }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ color:'white', fontWeight:700, fontSize:'14px' }}>{userProfile?.name}</div>
                          <div style={{ color:'rgba(255,255,255,0.75)', fontSize:'11px', textTransform:'capitalize' }}>
                            {userProfile?.role === 'admin' ? '🛠️ Admin' : '🛍️ Customer'}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Items */}
                    <div style={{ padding:'6px 0' }}>
                      {menuItems.map(({ href, icon, label }) => (
                        <Link key={href} href={href} onClick={() => setDropOpen(false)}
                          style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 16px',
                            textDecoration:'none', color:'#374151', fontSize:'13px', fontWeight:500,
                            transition:'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background='#f8fafc')}
                          onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                        >
                          <span style={{ fontSize:'16px' }}>{icon}</span>{label}
                        </Link>
                      ))}
                    </div>
                    {/* Logout */}
                    <div style={{ borderTop:'1px solid #f1f5f9', padding:'6px 0' }}>
                      <button onClick={handleLogout}
                        style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 16px',
                          width:'100%', background:'none', border:'none', cursor:'pointer',
                          color:'#dc2626', fontSize:'13px', fontWeight:600, transition:'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background='#fef2f2')}
                        onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                      >
                        <LogOut size={15}/> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login"
                onMouseEnter={() => { setProfileHov(true); setHoveredIcon('profile'); }}
                onMouseLeave={() => { setProfileHov(false); setHoveredIcon(null); }}
                style={{
                  ...iconStyle('profile'),
                  background: profileHov ? 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(6,182,212,0.1))' : 'transparent',
                  border: profileHov ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  borderRadius:'10px', padding:'8px', color:'#64748b', textDecoration:'none',
                  display:'flex', alignItems:'center', gap:'4px',
                }}
              >
                <User size={20} />
                <span className="hidden lg:inline" style={{ fontSize:'13px', fontWeight:600 }}>Sign In</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              onMouseEnter={e => (e.currentTarget.style.transform='rotate(90deg)')}
              onMouseLeave={e => (e.currentTarget.style.transform='none')}
              style={{ background:'transparent', border:'1px solid transparent', borderRadius:'10px', padding:'8px', cursor:'pointer', color:'#64748b',
                transition:`transform 0.3s ${SPRING}` }}
            >
              <Menu size={20}/>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <>
          {/* Overlay */}
          <div onClick={() => setMobileOpen(false)} style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', zIndex:60,
            backdropFilter:'blur(2px)',
          }}/>
          {/* Drawer */}
          <div style={{
            position:'fixed', top:0, right:0, bottom:0, width:'224px',
            background:'white', zIndex:70, boxShadow:'-4px 0 24px rgba(59,130,246,0.15)',
            animation:'drawerIn 0.3s cubic-bezier(0.4,0,0.2,1) forwards',
            display:'flex', flexDirection:'column',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', borderBottom:'1px solid #f1f5f9' }}>
              <span style={{ fontWeight:700, color:'#1a202c', fontSize:'15px' }}>Menu</span>
              <button onClick={() => setMobileOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#64748b' }}>
                <X size={20}/>
              </button>
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'12px 0' }}>
              {navLinks.map(({ label, href }) => (
                <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                  style={{ display:'block', padding:'12px 20px', color: pathname===href ? '#3b82f6' : '#374151',
                    fontWeight: pathname===href ? 700 : 500, fontSize:'14px', textDecoration:'none',
                    borderLeft: pathname===href ? '3px solid #3b82f6' : '3px solid transparent',
                    transition:'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background='#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                >
                  {label}
                </Link>
              ))}
              <div style={{ borderTop:'1px solid #f1f5f9', marginTop:'8px', paddingTop:'8px' }}>
                {user ? (
                  <>
                    {menuItems.map(({ href, icon, label }) => (
                      <Link key={href} href={href} onClick={() => setMobileOpen(false)}
                        style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 20px',
                          color:'#374151', fontSize:'13px', textDecoration:'none', transition:'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget.style.background='#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background='transparent')}
                      >
                        <span>{icon}</span>{label}
                      </Link>
                    ))}
                    {userProfile?.role !== 'admin' && (
                      <Link href="/cart" onClick={() => setMobileOpen(false)}
                        style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 20px',
                          color:'#374151', fontSize:'13px', textDecoration:'none' }}>
                        🛒 Cart {itemCount > 0 && `(${itemCount})`}
                      </Link>
                    )}
                    <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                      style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 20px',
                        width:'100%', background:'none', border:'none', cursor:'pointer',
                        color:'#dc2626', fontSize:'13px', fontWeight:600 }}>
                      <LogOut size={14}/> Sign Out
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setMobileOpen(false)}
                    style={{ display:'block', padding:'10px 20px', color:'#3b82f6', fontWeight:600, fontSize:'13px', textDecoration:'none' }}>
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
