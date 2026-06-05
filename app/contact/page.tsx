'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Mail, MessageSquare, Clock, CheckCircle } from 'lucide-react';

const channels = [
  { icon: Mail,          title: 'Email Us',        value: 'support@shoppersona.com', sub: 'We reply within 24 hours', color: '#3b82f6' },
  { icon: MessageSquare, title: 'Live Chat',        value: 'Available in-app',        sub: 'Mon–Fri, 9am–6pm IST',    color: '#06b6d4' },
  { icon: Clock,         title: 'Response Time',   value: 'Under 24 hours',          sub: 'For all email queries',   color: '#8b5cf6' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 900)); // simulate send
    setSent(true);
    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: '10px',
    border: '1.5px solid #e2e8f0', background: '#f8fafc',
    fontSize: '14px', color: '#1a202c', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box',
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg,#eff6ff,#ecfeff)', padding: '64px 20px 48px', textAlign: 'center' }}>
        <span style={{ display: 'inline-block', background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
          fontSize: '12px', fontWeight: 700, letterSpacing: '2px', padding: '4px 14px',
          borderRadius: '999px', marginBottom: '16px', textTransform: 'uppercase' }}>
          Get in Touch
        </span>
        <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: '#1a202c',
          lineHeight: 1.2, marginBottom: '14px' }}>
          We&apos;d love to{' '}
          <span style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            hear from you
          </span>
        </h1>
        <p style={{ fontSize: '16px', color: '#64748b', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
          Have a question, feedback or just want to say hello? Drop us a message and our team will get back to you promptly.
        </p>
      </section>

      <div style={{ maxWidth: '1040px', margin: '0 auto', padding: '56px 20px', display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '40px', alignItems: 'start' }}>

        {/* Contact form */}
        <div style={{ background: '#fff', borderRadius: '20px', padding: '36px',
          border: '1px solid #e2e8f0', boxShadow: '0 4px 24px rgba(59,130,246,0.07)' }}>
          <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#1a202c', marginBottom: '24px' }}>Send a Message</h2>

          {sent ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:'16px' }}>
                <CheckCircle size={48} color="#3b82f6" />
              </div>
              <div style={{ fontWeight: 700, fontSize: '18px', color: '#1a202c', marginBottom: '8px' }}>Message Sent!</div>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
                Thanks for reaching out. We&apos;ll get back to you within 24 hours.
              </p>
              <button onClick={() => { setSent(false); setForm({ name:'', email:'', subject:'', message:'' }); }}
                style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', color: '#fff',
                  border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: 600,
                  fontSize: '14px', cursor: 'pointer' }}>
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Name</label>
                  <input style={inputStyle} placeholder="Your name" value={form.name} required
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor='#3b82f6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)'; }}
                    onBlur={e  => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Email</label>
                  <input style={inputStyle} type="email" placeholder="you@example.com" value={form.email} required
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    onFocus={e => { e.target.style.borderColor='#3b82f6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)'; }}
                    onBlur={e  => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Subject</label>
                <input style={inputStyle} placeholder="How can we help?" value={form.subject} required
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor='#3b82f6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)'; }}
                  onBlur={e  => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>Message</label>
                <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: '130px', fontFamily: 'inherit' }}
                  placeholder="Tell us more…" value={form.message} required
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                  onFocus={e => { e.target.style.borderColor='#3b82f6'; e.target.style.boxShadow='0 0 0 3px rgba(59,130,246,0.12)'; }}
                  onBlur={e  => { e.target.style.borderColor='#e2e8f0'; e.target.style.boxShadow='none'; }}
                />
              </div>
              <button type="submit" disabled={loading}
                style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)', color: '#fff',
                  border: 'none', borderRadius: '12px', padding: '13px', fontWeight: 700, fontSize: '15px',
                  cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.75 : 1,
                  transition: 'transform 0.15s, box-shadow 0.15s' }}
                onMouseEnter={e => { if (!loading) { (e.currentTarget as HTMLButtonElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow='0 6px 20px rgba(59,130,246,0.35)'; }}}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform='none'; (e.currentTarget as HTMLButtonElement).style.boxShadow='none'; }}
              >
                {loading ? 'Sending…' : 'Send Message →'}
              </button>
            </form>
          )}
        </div>

        {/* Info cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ marginBottom: '8px' }}>
            <h2 style={{ fontWeight: 800, fontSize: '20px', color: '#1a202c', marginBottom: '8px' }}>Contact Info</h2>
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
              Prefer to reach out directly? Here are all the ways you can connect with our support team.
            </p>
          </div>

          {channels.map(({ icon: Icon, title, value, sub, color }) => (
            <div key={title} style={{ background: '#fff', borderRadius: '16px', padding: '20px 24px',
              border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px',
              transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='0 4px 20px rgba(59,130,246,0.1)'; (e.currentTarget as HTMLDivElement).style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow='none'; (e.currentTarget as HTMLDivElement).style.transform='none'; }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</div>
                <div style={{ fontWeight: 700, color: '#1a202c', fontSize: '14px', marginTop: '2px' }}>{value}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{sub}</div>
              </div>
            </div>
          ))}

          {/* FAQ hint */}
          <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.07),rgba(6,182,212,0.05))',
            borderRadius: '16px', padding: '20px 24px', border: '1px solid rgba(59,130,246,0.15)', marginTop: '4px' }}>
            <div style={{ fontWeight: 700, color: '#1a202c', marginBottom: '6px', fontSize: '14px' }}>💡 Quick answers</div>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              Most questions about orders, returns, and payments are answered in our{' '}
              <a href="/orders" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Orders</a>{' '}and{' '}
              <a href="/returns" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>Returns</a>{' '}pages.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
