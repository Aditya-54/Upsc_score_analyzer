'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useExamStore, Question } from '@/lib/examStore';
import { BookOpen, Award, CheckCircle2, AlertTriangle, ArrowRight, BookOpenCheck, Clock, RefreshCw } from 'lucide-react';
import gsQuestions from '@/data/gs_set_a.json';
import csatQuestions from '@/data/csat_set_a.json';

export default function HomePortal() {
  const router = useRouter();
  const { currentPaper, selectPaper, resetExam, answers, profile } = useExamStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !profile) {
      router.push('/auth');
    }
  }, [profile, mounted, router]);

  if (!mounted || !profile) {
    return null;
  }

  const activeAnswerCount = Object.keys(answers).length;

  const handleStart = (paper: 'GS' | 'CSAT') => {
    const questionsList = (paper === 'GS' ? gsQuestions : csatQuestions) as Question[];
    selectPaper(paper, questionsList);
    router.push('/attempt');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-300">
      
      {/* Portal Header */}
      <div className="text-center space-y-3.5 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs font-semibold">
          <BookOpenCheck className="w-3.5 h-3.5" />
          2026 Civil Services Prelims Marks Checker
        </div>
        <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight text-foreground bg-clip-text">
          UPSC Prelims Marks Checker
        </h1>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          Logged in as: <strong className="text-foreground">{profile?.name}</strong> • Category: <strong className="text-primary">{profile?.category}</strong> • Gender: <strong className="text-primary">{profile?.gender}</strong>
        </p>
      </div>

      {/* Active Session Resume Banner */}
      {currentPaper && activeAnswerCount > 0 && (
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in zoom-in-95 duration-200">
          <div className="flex items-center space-x-3.5 text-center sm:text-left">
            <div className="bg-primary/20 text-primary p-2.5 rounded-full border border-primary/30 shrink-0">
              <Clock className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Saved Checklist Draft Detected</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                You have a saved <strong>UPSC {currentPaper} Paper</strong> checklist with <span className="text-foreground font-semibold font-mono">{activeAnswerCount}</span> marks entered.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-center sm:justify-end shrink-0">
            <button
              onClick={() => {
                resetExam();
                window.location.reload();
              }}
              className="p-2.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
              title="Clear progress and start fresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/attempt')}
              className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Resume Marks Entry
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Portal Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* GS Paper 1 Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:border-primary/40 glass-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md">
                Paper I (General Studies)
              </span>
              <BookOpen className="w-5.5 h-5.5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                General Studies (GS)
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Check your marks for History, Geography, Polity, Economy, Environment, Science & Tech, and Current Affairs.
              </p>
            </div>

            <div className="bg-secondary/60 rounded-xl p-4 border border-border/40 text-xs space-y-2 leading-relaxed">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Questions:</span>
                <span className="font-semibold text-foreground">100 (99 graded + 1 dropped)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maximum Marks:</span>
                <span className="font-semibold text-foreground">200 Marks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marking Scheme:</span>
                <span className="font-semibold text-foreground">Correct: +2.00 • Wrong: -0.66</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold border-t border-border/30 pt-2 mt-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Q64 Dropped: +2.0 Auto-Credit Applied</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleStart('GS')}
            className="w-full mt-6 py-3 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Open GS Checklist Grid
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* CSAT Paper 2 Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all relative overflow-hidden group hover:border-emerald-500/40 glass-card">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md">
                Paper II (CSAT)
              </span>
              <Award className="w-5.5 h-5.5 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                Aptitude Test (CSAT)
              </h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                Check your marks for Quantitative Aptitude, Logical Reasoning, and Reading Comprehension.
              </p>
            </div>

            <div className="bg-secondary/60 rounded-xl p-4 border border-border/40 text-xs space-y-2 leading-relaxed">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Questions:</span>
                <span className="font-semibold text-foreground">80 Questions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maximum Marks:</span>
                <span className="font-semibold text-foreground">200 Marks</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Marking Scheme:</span>
                <span className="font-semibold text-foreground">Correct: +2.50 • Wrong: -0.83</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold border-t border-border/30 pt-2 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Qualification Cutoff: 66.67 Marks (33.33%)</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleStart('CSAT')}
            className="w-full mt-6 py-3 bg-emerald-600 hover:bg-emerald-550 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Open CSAT Checklist Grid
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Instructions Panel */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-1.5">
          <BookOpenCheck className="w-4 h-4 text-primary" />
          Marks Checker Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 text-xs text-muted-foreground leading-relaxed">
          <div className="space-y-1.5">
            <h4 className="font-semibold text-foreground">1. Rapid Inputs</h4>
            <p>Tapping the bubbles allows you to easily enter your exam options. Hovering over a row displays the question text in the right sidebar Inspector.</p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-semibold text-foreground">2. Live Statistical Cutoffs</h4>
            <p>Cutoffs are calculated dynamically in real-time based on the 75th percentile of serious community submissions. They shift dynamically as scores are entered.</p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-semibold text-foreground">3. Secure Database Sync</h4>
            <p>Submitting your OMR grid writes your scores to the Supabase database. You receive an instant mains qualification verdict and a global percentile ranking.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
