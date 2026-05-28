'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExamStore } from '@/lib/examStore';
import ResultsDashboard from '@/components/results-dashboard';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function ResultsPortal() {
  const router = useRouter();
  const { currentPaper, isSubmitted, profile } = useExamStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // 1. Profile Check
      if (!profile) {
        router.push('/auth');
      }
    }
  }, [profile, mounted, router]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-semibold text-muted-foreground">Syncing Candidate Session...</span>
      </div>
    );
  }

  // Profile Protection Fallback
  if (!profile) return null;

  // Route protection: If no paper submitted
  if (!currentPaper || !isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto space-y-5 animate-in fade-in duration-200">
        <div className="bg-amber-500/10 text-amber-500 p-4 rounded-full border border-amber-500/20">
          <AlertCircle className="w-10 h-10 animate-bounce" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No Submissions Found</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          It looks like you haven&apos;t completed or submitted a checklist yet. Please return to the portal home, log your answers, and click Submit to view your analytics.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portal Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-250 pb-12">
      {/* Visual Accent Header Banner */}
      <div className="w-full h-1.5 bg-gradient-to-r from-violet-500 via-primary to-emerald-500" />
      <ResultsDashboard />
    </div>
  );
}
