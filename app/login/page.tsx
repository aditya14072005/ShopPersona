'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

type Tab = 'login' | 'signup';

/* ─── Yeti SVG ───────────────────────────────────────────────────────────── */
function YetiAvatar({ eyeX, eyeY, armsUp, fingersSpread, squint }: {
  eyeX: number; eyeY: number; armsUp: boolean; fingersSpread: boolean; squint: number;
}) {
  const ex = eyeX * 4;
  const ey = eyeY * 3;
  const eyeH = Math.max(2, 7 - squint * 5);
  return (
    <svg viewBox="0 0 200 200" width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="155" rx="42" ry="32" fill="#dbeafe" />
      <ellipse cx="100" cy="95" rx="46" ry="50" fill="#eff6ff" />
      <ellipse cx="56" cy="88" rx="10" ry="12" fill="#dbeafe" />
      <ellipse cx="144" cy="88" rx="10" ry="12" fill="#dbeafe" />
      <ellipse cx="56" cy="88" rx="6" ry="8" fill="#bfdbfe" />
      <ellipse cx="144" cy="88" rx="6" ry="8" fill="#bfdbfe" />
      <ellipse cx="100" cy="52" rx="40" ry="16" fill="#dbeafe" />
      <ellipse cx="78" cy="48" rx="12" ry="10" fill="#dbeafe" />
      <ellipse cx="122" cy="48" rx="12" ry="10" fill="#dbeafe" />
      <ellipse cx="100" cy="44" rx="10" ry="9" fill="#dbeafe" />
      <g style={{ transition:'transform 0.4s cubic-bezier(.4,0,.2,1)', transform: armsUp ? 'translateY(-52px)' : 'translateY(0)' }}>
        <ellipse cx="62" cy="148" rx="14" ry="28" fill="#dbeafe" transform="rotate(-20 62 148)" />
        {fingersSpread ? (
          <>
            <ellipse cx="44" cy="128" rx="4" ry="9" fill="#eff6ff" transform="rotate(-40 44 128)" />
            <ellipse cx="52" cy="122" rx="4" ry="9" fill="#eff6ff" transform="rotate(-20 52 122)" />
            <ellipse cx="61" cy="120" rx="4" ry="9" fill="#eff6ff" transform="rotate(0 61 120)" />
            <ellipse cx="70" cy="123" rx="4" ry="9" fill="#eff6ff" transform="rotate(20 70 123)" />
          </>
        ) : (
          <ellipse cx="56" cy="124" rx="12" ry="9" fill="#eff6ff" />
        )}
        <ellipse cx="138" cy="148" rx="14" ry="28" fill="#dbeafe" transform="rotate(20 138 148)" />
        {fingersSpread ? (
          <>
            <ellipse cx="156" cy="128" rx="4" ry="9" fill="#eff6ff" transform="rotate(40 156 128)" />
            <ellipse cx="148" cy="122" rx="4" ry="9" fill="#eff6ff" transform="rotate(20 148 122)" />
            <ellipse cx="139" cy="120" rx="4" ry="9" fill="#eff6ff" transform="rotate(0 139 120)" />
            <ellipse cx="130" cy="123" rx="4" ry="9" fill="#eff6ff" transform="rotate(-20 130 123)" />
          </>
        ) : (
          <ellipse cx="144" cy="124" rx="12" ry="9" fill="#eff6ff" />
        )}
      </g>
      <ellipse cx={82 + ex} cy={95 + ey} rx="11" ry={eyeH} fill="white" />
      <ellipse cx={118 + ex} cy={95 + ey} rx="11" ry={eyeH} fill="white" />
      <circle cx={84 + ex} cy={95 + ey} r="5" fill="#1e3a5f" />
      <circle cx={120 + ex} cy={95 + ey} r="5" fill="#1e3a5f" />
      <circle cx={86 + ex} cy={93 + ey} r="2" fill="white" opacity="0.8" />
      <circle cx={122 + ex} cy={93 + ey} r="2" fill="white" opacity="0.8" />
      <ellipse cx="100" cy="108" rx="8" ry="5" fill="#93c5fd" />
      <ellipse cx="97" cy="107" rx="3" ry="2" fill="#3b82f6" />
      <ellipse cx="103" cy="107" rx="3" ry="2" fill="#3b82f6" />
      <path d="M 88 118 Q 100 126 112 118" stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="74" cy="112" rx="10" ry="6" fill="#a5f3fc" opacity="0.4" />
      <ellipse cx="126" cy="112" rx="10" ry="6" fill="#a5f3fc" opacity="0.4" />
    </svg>
  );
}

/* ─── Right Panel ────────────────────────────────────────────────────────── */
function RightPanel() {
  return (
    <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#eff6ff 0%,#ecfeff 50%,#f0f9ff 100%)',
      position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <style>{`
        @keyframes ringSpin    { to { transform: translate(-50%,-50%) rotate(360deg); } }
        @keyframes ringReverse { to { transform: translate(-50%,-50%) rotate(-360deg); } }
        .auth-ring1 { position:absolute; top:50%; left:50%; width:480px; height:480px; border-radius:50%; border:2px dashed rgba(59,130,246,0.2); animation:ringSpin 30s linear infinite; }
        .auth-ring2 { position:absolute; top:50%; left:50%; width:340px; height:340px; border-radius:50%; border:1.5px dashed rgba(6,182,212,0.2); animation:ringReverse 20s linear infinite; }
        .auth-ring3 { position:absolute; top:50%; left:50%; width:210px; height:210px; border-radius:50%; border:1px dashed rgba(59,130,246,0.15); animation:ringSpin 13s linear infinite; }
      `}</style>

      {/* Glow */}
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'320px', height:'320px',
        borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,0.12) 0%,transparent 70%)', pointerEvents:'none' }} />

      <div className="auth-ring1" />
      <div className="auth-ring2" />
      <div className="auth-ring3" />

      {/* Abstract tech SVG motifs */}
      <svg width="340" height="420" viewBox="0 0 340 420" style={{ position:'absolute', opacity:0.1 }} xmlns="http://www.w3.org/2000/svg">
        {/* Hexagon grid */}
        {[[170,80],[140,130],[200,130],[110,180],[170,180],[230,180],[140,230],[200,230],[170,280]].map(([cx,cy],i) => (
          <polygon key={i} points={`${cx},${cy-22} ${cx+19},${cy-11} ${cx+19},${cy+11} ${cx},${cy+22} ${cx-19},${cy+11} ${cx-19},${cy-11}`}
            stroke="#3b82f6" strokeWidth="1" fill="none"/>
        ))}
        {/* Circuit lines */}
        <path d="M60 60 H110 V110 H160" stroke="#06b6d4" strokeWidth="1" fill="none" strokeLinecap="round"/>
        <path d="M280 60 H230 V110 H180" stroke="#06b6d4" strokeWidth="1" fill="none" strokeLinecap="round"/>
        <path d="M60 360 H110 V310 H160" stroke="#3b82f6" strokeWidth="1" fill="none" strokeLinecap="round"/>
        <path d="M280 360 H230 V310 H180" stroke="#3b82f6" strokeWidth="1" fill="none" strokeLinecap="round"/>
        {/* Corner dots */}
        {[[60,60],[280,60],[60,360],[280,360]].map(([x,y],i) => (
          <circle key={i} cx={x} cy={y} r="4" fill="#06b6d4"/>
        ))}
        {/* Radial dot ring */}
        {Array.from({length:12}).map((_,i) => {
          const a = (i/12)*Math.PI*2;
          return <circle key={i} cx={170+145*Math.cos(a)} cy={210+160*Math.sin(a)} r="2.5" fill="#3b82f6"/>;
        })}
        {Array.from({length:8}).map((_,i) => {
          const a = (i/8)*Math.PI*2;
          return <circle key={i} cx={170+90*Math.cos(a)} cy={210+100*Math.sin(a)} r="2" fill="#06b6d4"/>;
        })}
        {/* Shopping bag icon outline */}
        <g transform="translate(145,175)">
          <path d="M5 8 L2 8 L0 30 L50 30 L48 8 L45 8" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M15 8 Q15 0 25 0 Q35 0 35 8" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </g>
      </svg>

      {/* Brand text */}
      <div style={{ position:'relative', zIndex:10, textAlign:'center', padding:'0 32px' }}>
        <div style={{ fontSize:'11px', letterSpacing:'5px', color:'#3b82f6', textTransform:'uppercase', marginBottom:'14px', opacity:0.7, fontWeight:600 }}>
          ✦ &nbsp; AI-POWERED &nbsp; ✦
        </div>
        <div style={{ fontSize:'44px', fontWeight:800, color:'#1e3a5f', lineHeight:1.1, marginBottom:'4px', letterSpacing:'-0.5px' }}>
          Shop
          <span style={{ background:'linear-gradient(135deg,#3b82f6,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Persona
          </span>
        </div>
        <div style={{ width:'56px', height:'3px', background:'linear-gradient(to right,#3b82f6,#06b6d4)', margin:'14px auto', borderRadius:'3px' }} />
        <div style={{ fontSize:'15px', color:'#64748b', letterSpacing:'0.3px', marginBottom:'18px', fontStyle:'italic' }}>
          Your personal shopping universe
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'16px', flexWrap:'wrap' }}>
          {['AI Picks','Fast Delivery','Secure Pay'].map(t => (
            <span key={t} style={{ fontSize:'11px', fontWeight:600, color:'#3b82f6', background:'rgba(59,130,246,0.1)',
              padding:'4px 10px', borderRadius:'999px', letterSpacing:'0.3px' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function AuthPage() {
  const [tab, setTab]                   = useState<Tab>('login');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [name, setName]                 = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [error, setError]               = useState('');
  const [eyePos, setEyePos]             = useState({ x:0, y:0 });
  const [blink, setBlink]               = useState(false);

  const { login, signup, loginWithGoogle, user, loading: authLoading } = useAuth();
  const router   = useRouter();
  const cardRef  = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!authLoading && user) router.push('/'); }, [user, authLoading, router]);

  useEffect(() => {
    const id = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 200); }, 12000);
    return () => clearInterval(id);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.25;
    const cy = rect.top  + rect.height * 0.38;
    setEyePos({
      x: Math.max(-1, Math.min(1, (e.clientX - cx) / rect.width)),
      y: Math.max(-1, Math.min(1, (e.clientY - cy) / rect.height)),
    });
  }, []);

  const squint = blink ? 1 : email.includes('@') ? 0.55 : email.length > 0 ? 0.2 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (tab === 'login') { await login(email, password); }
      else                 { await signup(email, password, name); }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally { setIsLoading(false); }
  };

  const handleGoogle = async () => {
    setError('');
    setIsLoading(true);
    try { await loginWithGoogle(); router.push('/'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Google sign-in failed.'); }
    finally { setIsLoading(false); }
  };

  return (
    <>
      <style>{`
        .auth-card {
          display:flex; min-width:900px; max-width:1060px; width:95vw;
          min-height:560px; border-radius:20px; overflow:hidden;
          border:1.5px solid rgba(59,130,246,0.2);
          box-shadow:0 8px 48px rgba(59,130,246,0.12), 0 2px 12px rgba(6,182,212,0.08);
          background:#fff;
        }
        .auth-left {
          flex:0 0 440px; padding:40px 44px; display:flex; flex-direction:column;
          gap:0; background:#fafcff;
        }
        .auth-right { flex:1; min-height:540px; }

        .auth-tab-switch { display:flex; border-bottom:2px solid #e2e8f0; margin-bottom:20px; }
        .auth-tab-switch button {
          flex:1; padding:10px 0; border:none; background:none; cursor:pointer;
          font-size:14px; font-weight:600; color:#94a3b8;
          border-bottom:3px solid transparent; margin-bottom:-2px; transition:all 0.2s;
        }
        .auth-tab-switch button.active { color:#3b82f6; border-bottom-color:#3b82f6; }

        .auth-input {
          width:100%; padding:11px 14px; border-radius:10px;
          border:1.5px solid #e2e8f0; background:#f8fafc;
          font-size:14px; color:#1a202c;
          outline:none; transition:border-color 0.2s, box-shadow 0.2s; box-sizing:border-box;
        }
        .auth-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.12); }
        .auth-input::placeholder { color:#94a3b8; }

        .auth-submit {
          width:100%; padding:13px; border-radius:12px; border:none; cursor:pointer;
          background:linear-gradient(135deg,#3b82f6,#06b6d4);
          color:#fff; font-size:15px; font-weight:700;
          position:relative; overflow:hidden; transition:transform 0.15s, box-shadow 0.15s;
        }
        .auth-submit:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(59,130,246,0.4); }
        .auth-submit:hover::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(120deg,transparent,rgba(255,255,255,0.25),transparent);
          animation:authShimmer 0.6s forwards;
        }
        @keyframes authShimmer { to { left:140%; } }
        .auth-submit:disabled { opacity:0.6; cursor:not-allowed; transform:none; }

        .auth-google {
          width:100%; padding:11px; border-radius:12px;
          border:1.5px solid #e2e8f0; background:#fff; cursor:pointer;
          font-size:13px; font-weight:600; color:#374151;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:background 0.2s, border-color 0.2s, box-shadow 0.2s;
        }
        .auth-google:hover { background:#f8fafc; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,0.08); }

        .auth-yeti-wrap {
          width:130px; height:130px; border-radius:50%;
          border:3px solid rgba(59,130,246,0.3);
          box-shadow:0 4px 20px rgba(59,130,246,0.12);
          overflow:hidden; background:#eff6ff; margin:0 auto 8px;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .auth-input-wrap { position:relative; }
        .auth-eye-btn { position:absolute; right:12px; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; color:#94a3b8; padding:2px; }
        .auth-error { background:#fef2f2; border:1px solid #fca5a5; border-radius:8px;
          padding:10px 14px; font-size:13px; color:#dc2626; }
        .auth-divider { display:flex; align-items:center; gap:10px; margin:12px 0; }
        .auth-divider::before,.auth-divider::after { content:''; flex:1; height:1px; background:#e2e8f0; }
        .auth-divider span { font-size:12px; color:#94a3b8; white-space:nowrap; }
        .auth-switch { text-align:center; font-size:13px; color:#64748b; margin-top:10px; }
        .auth-switch button { background:none; border:none; cursor:pointer; color:#3b82f6; font-weight:700; font-size:13px; }
        label.auth-label { font-size:13px; font-weight:600; color:#374151; display:block; margin-bottom:5px; }

        @media (max-width:940px) {
          .auth-card { min-width:unset; flex-direction:column; }
          .auth-right { display:none; }
          .auth-left { flex:unset; padding:32px 24px; }
        }
      `}</style>

      <div
        style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
          background:'linear-gradient(135deg,#eff6ff 0%,#ecfeff 55%,#f0f9ff 100%)', padding:'24px' }}
        onMouseMove={handleMouseMove}
      >
        <div className="auth-card" ref={cardRef}>

          {/* ── Left panel ── */}
          <div className="auth-left">

            {/* Yeti + brand */}
            <div style={{ textAlign:'center', marginBottom:'16px' }}>
              <div className="auth-yeti-wrap">
                <YetiAvatar
                  eyeX={passwordFocused ? 0 : eyePos.x}
                  eyeY={passwordFocused ? 0 : eyePos.y}
                  armsUp={passwordFocused}
                  fingersSpread={showPassword && passwordFocused}
                  squint={squint}
                />
              </div>
              <div style={{ fontSize:'22px', fontWeight:800, color:'#1e3a5f' }}>
                Shop<span style={{ background:'linear-gradient(135deg,#3b82f6,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Persona</span>
              </div>
              <div style={{ fontSize:'11px', color:'#94a3b8', letterSpacing:'2px', textTransform:'uppercase', marginTop:'2px' }}>
                Your personal shop
              </div>
            </div>

            {/* Tab switcher */}
            <div className="auth-tab-switch">
              <button className={tab === 'login'  ? 'active' : ''} onClick={() => { setTab('login');  setError(''); }}>Sign In</button>
              <button className={tab === 'signup' ? 'active' : ''} onClick={() => { setTab('signup'); setError(''); }}>Sign Up</button>
            </div>

            {error && <div className="auth-error" style={{ marginBottom:'12px' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {tab === 'signup' && (
                <div>
                  <label className="auth-label">Full Name</label>
                  <input className="auth-input" type="text" placeholder="Your name" value={name}
                    onChange={e => setName(e.target.value)} required />
                </div>
              )}
              <div>
                <label className="auth-label">Email Address</label>
                <input className="auth-input" type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <input className="auth-input" type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password" value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => { setPasswordFocused(false); setShowPassword(false); }}
                    required style={{ paddingRight:'40px' }}
                  />
                  <button type="button" className="auth-eye-btn" onMouseDown={e => e.preventDefault()}
                    onClick={() => setShowPassword(v => !v)}>
                    {showPassword
                      ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>
              <button className="auth-submit" type="submit" disabled={isLoading} style={{ marginTop:'4px' }}>
                {isLoading ? '...' : tab === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="auth-divider"><span>or continue with</span></div>

            <button className="auth-google" onClick={handleGoogle} disabled={isLoading}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M5.266 9.765C6.199 7.053 8.759 5.071 11.777 5.071c1.548 0 2.936.558 4.023 1.481l3.159-3.159C17.155 1.698 14.64.672 11.777.672 7.174.672 3.221 3.322 1.271 7.189l3.995 2.576z"/>
                <path fill="#34A853" d="M16.041 18.013C14.951 18.716 13.566 19.104 11.777 19.104c-2.999 0-5.548-1.968-6.496-4.655l-3.994 2.55C3.237 20.838 7.181 23.5 11.777 23.5c2.746 0 5.366-.974 7.316-2.7l-3.052-2.787z"/>
                <path fill="#4A90D9" d="M19.093 20.8C21.13 18.845 22.4 16 22.4 12c0-.68-.093-1.4-.234-2.07H11.777v4.52h6.075c-.254 1.55-1.105 2.8-2.439 3.563L19.093 20.8z"/>
                <path fill="#FBBC05" d="M5.281 14.449A6.8 6.8 0 0 1 4.884 12.1c0-.825.142-1.6.382-2.336L1.271 7.189A11.1 11.1 0 0 0 0 12.1c0 1.5.463 3.3 1.287 4.874l3.994-2.525z"/>
              </svg>
              Continue with Google
            </button>

            <div className="auth-switch">
              {tab === 'login'
                ? <>No account? <button onClick={() => setTab('signup')}>Sign up free</button></>
                : <>Already have an account? <button onClick={() => setTab('login')}>Sign in</button></>
              }
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="auth-right">
            <RightPanel />
          </div>
        </div>
      </div>
    </>
  );
}
