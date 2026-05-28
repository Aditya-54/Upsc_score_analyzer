'use client';

import React, { useState, useEffect } from 'react';
import { useExamStore } from '@/lib/examStore';
import { Send, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExamHeader() {
  const router = useRouter();
  const {
    currentPaper,
    isSubmitted,
    submitExam,
    questions,
    answers,
    profile
  } = useExamStore();

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentPaper) return null;

  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const unattemptedCount = totalCount - answeredCount;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitExam();
    setIsSubmitting(false);
    setShowSubmitModal(false);
    router.push('/results');
  };

  const handleExit = () => {
    if (confirm("Are you sure you want to return to the portal home? Your entered answers will be saved as draft.")) {
      router.push('/');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass shadow-sm border-b border-border/40 px-6 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded font-bold border border-primary/20">
              SET A
            </span>
            UPSC {currentPaper === 'GS' ? 'GS Paper I' : 'CSAT Paper II'} Checker
          </h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Logged in: <span className="font-semibold text-foreground">{profile?.name} ({profile?.category})</span> • Draft: <span className="font-semibold text-foreground">{answeredCount}</span> marked, <span className="font-semibold text-foreground">{unattemptedCount}</span> remaining
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExit}
            className="px-4 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-secondary/80 hover:text-foreground transition-all cursor-pointer"
          >
            Portal Home
          </button>
          
          {!isSubmitted && (
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary/95 text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Sheet
            </button>
          )}
        </div>
      </header>

      {/* Submit OMR Checklist Confirmation */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md p-6 rounded-xl shadow-2xl border border-border/50 animate-in zoom-in-95 duration-200">
            <div className="flex items-start space-x-4">
              <div className="bg-amber-500/10 text-amber-500 p-3 rounded-full border border-amber-500/20">
                <AlertTriangle className="w-6 h-6 shrink-0" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground">Submit OMR Sheet</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  You are about to evaluate your entered options. This will immediately calculate your final scores and rank percentiles.
                </p>

                <div className="bg-secondary/60 rounded-lg p-3.5 my-4 border border-border/60 text-xs">
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Candidate Name:</span>
                    <span className="font-semibold text-foreground">{profile?.name}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Category Selected:</span>
                    <span className="font-semibold text-primary">{profile?.category}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Answers Marked:</span>
                    <span className="font-semibold text-emerald-500 font-mono">{answeredCount} / {totalCount}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Blank/Unattempted:</span>
                    <span className="font-semibold text-amber-500 font-mono">{unattemptedCount}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                disabled={isSubmitting}
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-secondary/80 transition-all cursor-pointer disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-5 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Evaluating...' : 'Yes, Submit Sheet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
