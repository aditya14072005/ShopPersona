'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { Sparkles } from 'lucide-react';

const QUESTIONS = [
  {
    id: 'style',
    question: "What best describes your style?",
    options: [
      { label: '🎧 Tech & Gadgets', category: 'Electronics' },
      { label: '👗 Fashion Forward', category: 'Fashion' },
      { label: '🏠 Home & Living', category: 'Home' },
      { label: '📚 Books & Learning', category: 'Books' },
      { label: '🏃 Active & Sports', category: 'Sports' },
    ],
  },
  {
    id: 'budget',
    question: "What's your usual budget per item?",
    options: [
      { label: 'Under $50', category: null },
      { label: '$50 – $150', category: null },
      { label: '$150 – $300', category: null },
      { label: 'No limit', category: null },
    ],
  },
  {
    id: 'shops_for',
    question: "You mostly shop for...",
    options: [
      { label: '🎁 Gifts for others', category: null },
      { label: '💼 Work & productivity', category: 'Electronics' },
      { label: '✨ Treating myself', category: 'Fashion' },
      { label: '🏡 My home', category: 'Home' },
    ],
  },
];

interface StyleQuizProps {
  onComplete: () => void;
}

export function StyleQuiz({ onComplete }: StyleQuizProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<{ category: string | null }[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAnswer = async (option: { label: string; category: string | null }) => {
    const newAnswers = [...answers, { category: option.category }];
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }

    // All answered — save to Firestore and seed behavior
    setSaving(true);
    try {
      const categories = newAnswers.map((a) => a.category).filter(Boolean) as string[];
      if (user && categories.length > 0) {
        // Find product IDs from preferred categories to pre-seed viewed behavior
        const { PRODUCTS } = await import('@/lib/products');
        const seedProducts = PRODUCTS
          .filter((p) => categories.includes(p.category))
          .slice(0, 3)
          .map((p) => p.id);

        await setDoc(
          doc(db, 'user_behavior', user.uid),
          { viewed: seedProducts, quizCompleted: true, quizCategories: categories },
          { merge: true },
        );
      }
    } finally {
      setSaving(false);
      onComplete();
    }
  };

  const current = QUESTIONS[step];
  const progress = ((step) / QUESTIONS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Personalize Your Experience</h2>
          <p className="text-muted-foreground text-sm mt-1">3 quick questions to tailor your recommendations</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-1.5 mb-8">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question */}
        <p className="text-lg font-semibold text-foreground mb-4 text-center">{current.question}</p>

        {/* Options */}
        <div className="space-y-3">
          {current.options.map((option) => (
            <button
              key={option.label}
              onClick={() => handleAnswer(option)}
              disabled={saving}
              className="w-full text-left px-4 py-3 bg-muted hover:bg-primary/10 hover:border-primary border border-border rounded-xl text-foreground font-medium transition-all duration-200 disabled:opacity-50"
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Question {step + 1} of {QUESTIONS.length}
        </p>
      </div>
    </div>
  );
}
