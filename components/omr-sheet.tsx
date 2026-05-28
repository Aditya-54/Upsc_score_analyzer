'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useExamStore } from '@/lib/examStore';
import { useRouter } from 'next/navigation';
import { Send, Info, Search, Filter, RotateCcw } from 'lucide-react';

export default function OMRSheet() {
  const router = useRouter();
  const {
    questions,
    answers,
    currentPaper,
    selectAnswer,
    clearAnswer,
    submitExam,
    profile,
    clearProfile
  } = useExamStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // References for question cards to support smooth scrolling
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Extract unique topics for the filter dropdown
  const uniqueTopics = useMemo(() => {
    const topics = new Set<string>();
    (questions || []).forEach((q) => {
      if (q.topic) topics.add(q.topic);
    });
    return ['All', ...Array.from(topics)];
  }, [questions]);

  // Filter questions based on search text, status, and topic
  const filteredQuestions = useMemo(() => {
    return (questions || []).filter((q) => {
      // 1. Text Search Filter (bilingual match)
      const matchesSearch = 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options.A.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options.B.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options.C.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.options.D.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Status Filter
      const isAnswered = answers[q.question_no] !== undefined;
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'answered' && isAnswered) ||
        (filterStatus === 'unanswered' && !isAnswered);

      // 3. Topic Filter
      const matchesTopic = selectedTopic === 'All' || q.topic === selectedTopic;

      return matchesSearch && matchesStatus && matchesTopic;
    });
  }, [questions, searchQuery, filterStatus, selectedTopic, answers]);

  // Early return guard AFTER all React hooks have executed
  if (!questions || questions.length === 0 || !currentPaper || !profile) return null;

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const unattemptedCount = totalQuestions - answeredCount;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitExam();
    setIsSubmitting(false);
    setShowSubmitModal(false);
    router.push('/results');
  };

  const scrollToQuestion = (qNum: number) => {
    const el = questionRefs.current[qNum];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Temporary highlight
      el.classList.add('ring-2', 'ring-primary', 'border-primary');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary', 'border-primary');
      }, 1500);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 1. Header Profile Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/80 rounded-2xl p-5 shadow-sm glass">
        <div className="flex items-center space-x-3.5">
          <div className="bg-primary/10 text-primary w-11 h-11 flex items-center justify-center rounded-full font-bold text-lg border border-primary/20 shrink-0">
            {profile?.name ? profile.name[0].toUpperCase() : 'C'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">
              Checking: {profile?.name || 'Candidate'}
            </h2>
            <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground font-semibold">
              <span className="bg-secondary px-2.5 py-1 rounded-md border border-border">
                Category: {profile?.category || 'General'}
              </span>
              <span className="bg-secondary px-2.5 py-1 rounded-md border border-border">
                Gender: {profile?.gender || 'Male'}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={clearProfile}
          className="w-full sm:w-auto px-4 py-2 text-xs font-semibold border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer text-center"
        >
          Change Profile
        </button>
      </div>

      {/* 2. Interactive Navigation & Search Toolbar */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between glass">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search keywords (e.g. Mughal, Ramsar, inflation)..."
            className="w-full bg-secondary/40 border border-border hover:border-muted-foreground/30 focus:border-primary rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          
          {/* Status Buttons */}
          <div className="flex items-center bg-secondary/30 border border-border/60 p-0.5 rounded-lg text-[10px] font-bold">
            {(['all', 'answered', 'unanswered'] as const).map((status) => {
              const isActive = filterStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-md uppercase tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-black shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>

          {/* Topic Dropdown */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="bg-secondary/40 border border-border text-[10px] font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-primary text-foreground cursor-pointer"
            >
              {uniqueTopics.map((topic) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* 3. Main Split Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Column: Full-Text Question Feed */}
        <div className="lg:col-span-3 space-y-4 max-h-[85vh] overflow-y-auto pr-2 scrollbar-thin">
          
          {filteredQuestions.length === 0 ? (
            <div className="bg-card border border-border/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3 glass-card">
              <Info className="w-10 h-10 text-muted-foreground animate-bounce" />
              <h3 className="font-bold text-foreground">No Questions Match Filters</h3>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                We couldn&apos;t find any questions matching your active keyword search or filters. Clear them to view all items.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setSelectedTopic('All');
                }}
                className="mt-2 px-4 py-2 border border-border rounded-lg text-xs font-semibold hover:bg-secondary hover:text-foreground transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const selectedOption = answers[q.question_no];

              return (
                <div
                  key={q.question_no}
                  ref={(el) => {
                    questionRefs.current[q.question_no] = el;
                  }}
                  className={`bg-card border rounded-2xl p-5 shadow-sm transition-all duration-200 glass-card scroll-mt-20 ${
                    selectedOption 
                      ? 'border-emerald-500/30 shadow-emerald-500/[0.02]' 
                      : 'border-border/80'
                  }`}
                >
                  
                  {/* Card Header Info */}
                  <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-3 text-[10px] font-bold text-muted-foreground select-none">
                    <div className="flex items-center space-x-2">
                      <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded font-mono">
                        Q.{q.question_no}
                      </span>
                      {q.dropped ? (
                        <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider">
                          Auto-Credit Dropped
                        </span>
                      ) : (
                        <span className="bg-secondary px-2 py-0.5 rounded border border-border">
                          {q.topic}
                        </span>
                      )}
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded border ${
                      q.difficulty === 'Easy' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                        : q.difficulty === 'Medium'
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                    }`}>
                      {q.difficulty}
                    </span>
                  </div>

                  {/* Question Text */}
                  <div className="text-foreground text-sm font-semibold leading-relaxed mb-4 whitespace-pre-line select-text">
                    {q.question}
                  </div>

                  {/* Question Options List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {(Object.keys(q.options) as Array<'A' | 'B' | 'C' | 'D'>).map((optKey) => {
                      const isSelected = selectedOption === optKey;
                      const optionText = q.options[optKey];

                      return (
                        <button
                          key={optKey}
                          onClick={() => {
                            if (isSelected) clearAnswer(q.question_no);
                            else selectAnswer(q.question_no, optKey);
                          }}
                          className={`flex items-start p-3.5 rounded-xl border text-xs text-left transition-all duration-150 cursor-pointer group leading-relaxed ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.01]'
                              : 'bg-secondary/20 border-border text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-muted-foreground/30'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] mr-2.5 shrink-0 transition-all ${
                            isSelected 
                              ? 'bg-primary-foreground text-primary' 
                              : 'bg-secondary border border-border text-muted-foreground group-hover:border-muted-foreground/40 group-hover:text-foreground'
                          }`}>
                            {optKey}
                          </span>
                          <span className="flex-1 truncate md:whitespace-normal">{optionText}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Action Bar (Clear Option) */}
                  {selectedOption && (
                    <div className="flex justify-end mt-3 border-t border-border/20 pt-2 text-[10px]">
                      <button
                        onClick={() => clearAnswer(q.question_no)}
                        className="font-bold text-rose-500 hover:text-rose-600 hover:underline cursor-pointer py-1 px-2.5 rounded transition-all"
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}

                </div>
              );
            })
          )}

        </div>

        {/* Right Column: Sticky Summary & Nav Grid Sidebar */}
        <div className="lg:col-span-1 h-full lg:sticky lg:top-24 space-y-4 select-none">
          
          {/* Quick Metrics & Submit */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col space-y-4.5 glass-card">
            
            <div>
              <h4 className="text-sm font-bold text-foreground">Test Summary</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">UPSC {currentPaper} Paper</p>
            </div>

            <div className="bg-secondary/50 rounded-xl p-3.5 border border-border/40 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Candidate:</span>
                <span className="font-semibold text-foreground truncate max-w-[100px]">{profile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-semibold text-primary">{profile.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Answers Logged:</span>
                <span className="font-bold text-emerald-500 font-mono">{answeredCount} / {totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skipped/Blank:</span>
                <span className="font-bold text-amber-500 font-mono">{unattemptedCount}</span>
              </div>
            </div>

            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full py-3 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Submit & Check Scores
            </button>
          </div>

          {/* Quick Click-to-Scroll Question Navigator Palette */}
          <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col space-y-3 glass-card">
            
            <div>
              <h4 className="text-xs font-bold text-foreground">Click to Scroll to Question</h4>
              <p className="text-[9px] text-muted-foreground mt-0.5">Green = Answered • Gray = Skipped</p>
            </div>

            {/* Nav Circle Grid */}
            <div className="grid grid-cols-5 gap-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
              {questions.map((q) => {
                const isAnswered = answers[q.question_no] !== undefined;
                return (
                  <button
                    key={q.question_no}
                    onClick={() => scrollToQuestion(q.question_no)}
                    className={`h-7.5 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${
                      isAnswered
                        ? 'bg-emerald-500 border-emerald-500 text-white font-extrabold shadow-sm'
                        : 'bg-secondary/40 border-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {q.question_no}
                  </button>
                );
              })}
            </div>

          </div>

        </div>

      </div>

      {/* 4. Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md p-6 rounded-2xl shadow-2xl border border-border/50 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-foreground">Submit Answer Sheet</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Are you sure you want to finalize your checklist? Your marks will be calculated instantly against the official keys.
            </p>

            <div className="bg-secondary/60 rounded-xl p-3.5 my-4 border border-border/60 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Candidate Name:</span>
                <span className="font-semibold text-foreground">{profile.name}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Category:</span>
                <span className="font-semibold text-foreground">{profile.category}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Answers Entered:</span>
                <span className="font-semibold text-emerald-500 font-mono">{answeredCount} / {totalQuestions}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Skipped/Blank:</span>
                <span className="font-semibold text-amber-500 font-mono">{unattemptedCount}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
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

    </div>
  );
}
