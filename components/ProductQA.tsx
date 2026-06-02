'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, query, where, onSnapshot, getDocs,
} from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { MessageCircle, ChevronDown, ChevronUp, ShieldCheck, BadgeCheck } from 'lucide-react';

interface QAAnswer {
  id: string;
  userId: string;
  userName: string;
  role: 'user' | 'admin';
  isVerifiedPurchaser: boolean;
  answer: string;
  createdAt: string;
}

interface QAQuestion {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  isVerifiedPurchaser: boolean;
  question: string;
  createdAt: string;
  answers?: QAAnswer[];
}

async function checkVerifiedPurchaser(uid: string, productId: string): Promise<boolean> {
  try {
    const snap = await getDocs(
      query(collection(db, 'orders'), where('userId', '==', uid)),
    );
    return snap.docs.some((d) =>
      (d.data().items ?? []).some((item: { productId: string }) => item.productId === productId),
    );
  } catch {
    return false;
  }
}

export function ProductQA({ productId }: { productId: string }) {
  const { user, userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replying, setReplying] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const bottomRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Check if current user is a verified purchaser
  useEffect(() => {
    if (!user) return;
    checkVerifiedPurchaser(user.uid, productId).then(setIsVerified);
  }, [user?.uid, productId]);

  // Live questions feed — sort client-side to avoid composite index requirement
  useEffect(() => {
    const unsub = onSnapshot(
      query(
        collection(db, 'product_qa'),
        where('productId', '==', productId),
      ),
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as QAQuestion))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setQuestions(docs);
      },
      (err) => console.error('QA listen error:', err),
    );
    return unsub;
  }, [productId]);

  // Live answers for expanded question — sort client-side
  useEffect(() => {
    if (!expanded) return;
    const unsub = onSnapshot(
      collection(db, 'product_qa', expanded, 'answers'),
      (snap) => {
        const answers = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as QAAnswer))
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        setQuestions((prev) =>
          prev.map((q) => (q.id === expanded ? { ...q, answers } : q)),
        );
      },
      (err) => console.error('Answers listen error:', err),
    );
    return unsub;
  }, [expanded]);

  // Scroll to bottom of answers when they update
  useEffect(() => {
    if (expanded) bottomRefs.current[expanded]?.scrollIntoView({ behavior: 'smooth' });
  }, [questions, expanded]);

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !questionText.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const name = userProfile?.name?.trim() || user.email?.split('@')[0] || 'Anonymous';
      const verified = await checkVerifiedPurchaser(user.uid, productId);
      await addDoc(collection(db, 'product_qa'), {
        productId,
        userId: user.uid,
        userName: name,
        isVerifiedPurchaser: verified,
        question: questionText.trim(),
        createdAt: new Date().toISOString(),
      });
      setQuestionText('');
    } catch (err) {
      console.error('submitQuestion error:', err);
      setError('Failed to submit question. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnswer = async (questionId: string) => {
    if (!user || !replyText[questionId]?.trim()) return;
    if (!isAdmin && !isVerified) return;
    setReplying(questionId);
    try {
      const name = userProfile?.name?.trim() || user.email?.split('@')[0] || 'Anonymous';
      await addDoc(collection(db, 'product_qa', questionId, 'answers'), {
        userId: user.uid,
        userName: name,
        role: userProfile?.role ?? 'user',
        isVerifiedPurchaser: isVerified,
        answer: replyText[questionId].trim(),
        createdAt: new Date().toISOString(),
      });
      setReplyText((p) => ({ ...p, [questionId]: '' }));
    } finally {
      setReplying(null);
    }
  };

  const canAnswer = isAdmin || isVerified;

  return (
    <section className="mb-16">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Questions & Answers</h2>
        <span className="text-sm text-muted-foreground">({questions.length})</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Questions list */}
        <div className="lg:col-span-2 space-y-3">
          {questions.length === 0 && (
            <p className="text-muted-foreground text-sm">No questions yet. Be the first to ask!</p>
          )}
          {questions.map((q) => (
            <div key={q.id} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Question row */}
              <button
                onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{q.userName}</span>
                      {q.isVerifiedPurchaser && (
                        <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-medium">
                          <BadgeCheck className="w-3 h-3" /> Verified Buyer
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </span>
                      {(q.answers?.length ?? 0) > 0 && (
                        <span className="text-xs text-primary font-semibold">
                          {q.answers!.length} answer{q.answers!.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {expanded === q.id
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </div>
              </button>

              {/* Answers panel */}
              {expanded === q.id && (
                <div className="border-t border-border px-5 pb-4">
                  {/* Answer list */}
                  <div className="max-h-64 overflow-y-auto space-y-3 pt-3">
                    {(!q.answers || q.answers.length === 0) && (
                      <p className="text-xs text-muted-foreground">No answers yet.</p>
                    )}
                    {q.answers?.map((a) => (
                      <div key={a.id} className="flex gap-3">
                        <div className="w-1 bg-primary/30 rounded-full flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-xs font-semibold text-foreground">{a.userName}</span>
                            {a.role === 'admin' && (
                              <span className="flex items-center gap-0.5 text-xs font-bold text-primary">
                                <ShieldCheck className="w-3 h-3" /> Official
                              </span>
                            )}
                            {a.role !== 'admin' && a.isVerifiedPurchaser && (
                              <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-medium">
                                <BadgeCheck className="w-3 h-3" /> Verified Buyer
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(a.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{a.answer}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={(el) => { bottomRefs.current[q.id] = el; }} />
                  </div>

                  {/* Reply box — admin or verified purchaser only */}
                  {user && canAnswer && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                      <input
                        value={replyText[q.id] ?? ''}
                        onChange={(e) => setReplyText((p) => ({ ...p, [q.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') submitAnswer(q.id); }}
                        placeholder={isAdmin ? 'Official reply…' : 'Share your experience…'}
                        className="flex-1 px-3 py-1.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => submitAnswer(q.id)}
                        disabled={replying === q.id || !replyText[q.id]?.trim()}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {replying === q.id ? '…' : 'Answer'}
                      </button>
                    </div>
                  )}
                  {user && !canAnswer && (
                    <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                      Only verified purchasers and admins can answer questions.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Ask a question */}
        <div className="bg-card border border-border rounded-xl p-6 h-fit">
          <h3 className="text-lg font-bold text-foreground mb-1">Ask a Question</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Answers come from verified buyers and the official store team.
          </p>
          {!user ? (
            <p className="text-sm text-muted-foreground">
              <a href="/login" className="text-primary hover:underline">Log in</a> to ask a question.
            </p>
          ) : (
            <form onSubmit={submitQuestion} className="space-y-3">
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                required
                rows={4}
                placeholder="What would you like to know about this product?"
                className="w-full bg-muted text-foreground placeholder-muted-foreground px-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
              />
              {isVerified && (
                <p className="text-xs text-emerald-400 flex items-center gap-1">
                  <BadgeCheck className="w-3 h-3" /> You&apos;re a verified buyer — you can also answer questions.
                </p>
              )}
              {error && <p className="text-destructive text-xs">{error}</p>}
              <button
                type="submit"
                disabled={submitting || !questionText.trim()}
                className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-2.5 rounded-lg transition-colors text-sm"
              >
                {submitting ? 'Submitting…' : 'Submit Question'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
