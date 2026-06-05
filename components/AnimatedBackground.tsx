'use client';

export function AnimatedBackground() {
  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0%,100% { background-position: 0% 50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes flyAcross {
          from { transform: translateX(-100px); }
          to   { transform: translateX(110vw); }
        }
        @keyframes spinSlow {
          to { transform: rotate(360deg); }
        }
        @keyframes floatMedium {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-12px); }
        }
        @keyframes sway {
          0%,100% { transform: rotate(-6deg); }
          50%     { transform: rotate(6deg); }
        }
        @keyframes pulse {
          0%,100% { opacity: 0.15; }
          50%     { opacity: 0.38; }
        }
        .bg-anim {
          background: linear-gradient(135deg, #eff6ff, #ecfeff, #fdf2f8);
          background-size: 400% 400%;
          animation: gradientShift 8s ease infinite;
        }
        .fly   { animation: flyAcross   14s linear   infinite; }
        .spin  { animation: spinSlow    20s linear   infinite; }
        .float { animation: floatMedium  4s ease-in-out infinite; }
        .sway  { animation: sway         3s ease-in-out infinite; }
        .pulse { animation: pulse        2s ease-in-out infinite; }
      `}</style>

      <div
        className="bg-anim"
        style={{ position:'fixed', inset:0, zIndex:-10, pointerEvents:'none', overflow:'hidden' }}
      >

        {/* ── Bird (arc wave) ── */}
        <div className="fly" style={{ position:'absolute', top:'12%' }}>
          <svg width="44" height="22" viewBox="0 0 44 22" fill="none">
            <path d="M2 14 Q11 2 22 11 Q33 2 42 14" stroke="rgba(59,130,246,0.28)" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
        </div>

        {/* ── Mandala (geometric hex ring) — top-left ── */}
        <div className="spin" style={{ position:'absolute', top:'4%', left:'3%', opacity:0.2, transformOrigin:'center' }}>
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
            <circle cx="45" cy="45" r="40" stroke="rgba(59,130,246,0.6)"  strokeWidth="1" strokeDasharray="6 4"/>
            <circle cx="45" cy="45" r="28" stroke="rgba(6,182,212,0.6)"   strokeWidth="1" strokeDasharray="4 4"/>
            <circle cx="45" cy="45" r="15" stroke="rgba(236,72,153,0.6)"  strokeWidth="1" strokeDasharray="3 3"/>
            {[0,60,120,180,240,300].map(a => (
              <line key={a}
                x1={45 + 15*Math.cos(a*Math.PI/180)} y1={45 + 15*Math.sin(a*Math.PI/180)}
                x2={45 + 40*Math.cos(a*Math.PI/180)} y2={45 + 40*Math.sin(a*Math.PI/180)}
                stroke="rgba(59,130,246,0.4)" strokeWidth="0.8"/>
            ))}
          </svg>
        </div>

        {/* ── Lotus (minimal flower blob) — mid-screen ── */}
        <div className="float" style={{ position:'absolute', top:'42%', left:'8%', opacity:0.22 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <ellipse cx="26" cy="26" rx="8" ry="18" stroke="rgba(59,130,246,0.7)"  strokeWidth="1.2" fill="none"/>
            <ellipse cx="26" cy="26" rx="8" ry="18" stroke="rgba(59,130,246,0.7)"  strokeWidth="1.2" fill="none" transform="rotate(60 26 26)"/>
            <ellipse cx="26" cy="26" rx="8" ry="18" stroke="rgba(6,182,212,0.7)"   strokeWidth="1.2" fill="none" transform="rotate(120 26 26)"/>
            <ellipse cx="26" cy="26" rx="8" ry="18" stroke="rgba(236,72,153,0.6)"  strokeWidth="1.2" fill="none" transform="rotate(180 26 26)"/>
            <circle  cx="26" cy="26" r="4"  stroke="rgba(59,130,246,0.8)" strokeWidth="1.2" fill="none"/>
          </svg>
        </div>

        {/* ── Diya (glow orb) — bottom-right ── */}
        <div className="sway" style={{ position:'absolute', bottom:'12%', right:'5%', opacity:0.25, transformOrigin:'50% 100%' }}>
          <svg width="38" height="44" viewBox="0 0 38 44" fill="none">
            <ellipse cx="19" cy="36" rx="14" ry="7" stroke="rgba(236,72,153,0.7)" strokeWidth="1.5" fill="none"/>
            <path d="M19 29 Q22 18 19 10 Q16 4 19 1" stroke="rgba(236,72,153,0.8)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <ellipse cx="19" cy="8" rx="4" ry="7" stroke="rgba(236,72,153,0.5)" strokeWidth="1" fill="rgba(236,72,153,0.08)"/>
          </svg>
        </div>

        {/* ── Rangoli (radial dot ring) — bottom-left ── */}
        <div className="spin" style={{ position:'absolute', bottom:'8%', left:'6%', opacity:0.2, transformOrigin:'center' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            {Array.from({length:12}).map((_,i) => {
              const a = (i/12)*Math.PI*2;
              return <circle key={i} cx={36+28*Math.cos(a)} cy={36+28*Math.sin(a)} r="3" fill="rgba(6,182,212,0.7)"/>;
            })}
            {Array.from({length:8}).map((_,i) => {
              const a = (i/8)*Math.PI*2;
              return <circle key={i} cx={36+17*Math.cos(a)} cy={36+17*Math.sin(a)} r="2" fill="rgba(59,130,246,0.6)"/>;
            })}
            <circle cx="36" cy="36" r="3" fill="rgba(236,72,153,0.6)"/>
          </svg>
        </div>

        {/* ── Bell (diamond) — mid-right ── */}
        <div className="sway" style={{ position:'absolute', top:'35%', right:'4%', opacity:0.2, transformOrigin:'50% 0%' }}>
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none">
            <path d="M16 2 L30 16 L16 30 L2 16 Z" stroke="rgba(59,130,246,0.7)" strokeWidth="1.5" fill="none"/>
            <circle cx="16" cy="36" r="3" stroke="rgba(59,130,246,0.6)" strokeWidth="1.2" fill="none"/>
          </svg>
        </div>

        {/* ── Leaf (abstract curved line) — bottom-left area ── */}
        <div className="sway" style={{ position:'absolute', bottom:'28%', left:'2%', opacity:0.18, transformOrigin:'50% 100%' }}>
          <svg width="36" height="50" viewBox="0 0 36 50" fill="none">
            <path d="M18 48 Q2 30 10 10 Q18 2 26 10 Q34 30 18 48 Z" stroke="rgba(6,182,212,0.7)" strokeWidth="1.2" fill="none"/>
            <path d="M18 48 L18 18" stroke="rgba(6,182,212,0.5)" strokeWidth="1" strokeDasharray="3 3"/>
          </svg>
        </div>

        {/* ── 3 pulsing dots ── */}
        <div className="pulse" style={{ position:'absolute', top:'20%', right:'18%' }}>
          <svg width="10" height="10"><circle cx="5" cy="5" r="5" fill="rgba(59,130,246,0.6)"/></svg>
        </div>
        <div className="pulse" style={{ position:'absolute', top:'65%', left:'22%', animationDelay:'0.7s' }}>
          <svg width="8" height="8"><circle cx="4" cy="4" r="4" fill="rgba(6,182,212,0.6)"/></svg>
        </div>
        <div className="pulse" style={{ position:'absolute', top:'48%', right:'30%', animationDelay:'1.4s' }}>
          <svg width="6" height="6"><circle cx="3" cy="3" r="3" fill="rgba(236,72,153,0.6)"/></svg>
        </div>

      </div>
    </>
  );
}
