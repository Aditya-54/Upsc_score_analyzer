'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useExamStore, UserProfile } from '@/lib/examStore';
import { ShieldAlert, ArrowRight, UserCheck, Sparkles } from 'lucide-react';

export default function AuthPortal() {
  const router = useRouter();
  const { profile, saveProfile } = useExamStore();
  const [mounted, setMounted] = useState(false);

  // Form inputs
  const [name, setName] = useState('');
  const [category, setCategory] = useState<UserProfile['category']>('General');
  const [gender, setGender] = useState<UserProfile['gender']>('Male');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // If profile is already established, forward to portal home
    if (profile) {
      router.push('/');
    }
  }, [profile, router]);

  if (!mounted) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your full name to proceed.');
      return;
    }
    if (name.trim().length < 3) {
      setErrorMsg('Candidate name must be at least 3 characters.');
      return;
    }

    saveProfile(name.trim(), category, gender);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Background visual styling */}
      <div className="absolute top-[10%] w-[40%] aspect-square rounded-full bg-radial from-violet-400/20 dark:from-violet-900/15 to-transparent blur-3xl -z-10" />
      <div className="absolute bottom-[10%] w-[40%] aspect-square rounded-full bg-radial from-emerald-400/10 dark:from-emerald-900/10 to-transparent blur-3xl -z-10" />

      <div className="w-full max-w-md space-y-6 animate-in fade-in duration-300">
        
        {/* Portal branding */}
        <div className="text-center space-y-2 select-none">
          <div className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            UPSC 2026 Marks Checker
          </div>
          <h2 className="text-3xl font-black font-outfit text-foreground tracking-tight">
            Candidate Gateway
          </h2>
          <p className="text-xs text-muted-foreground">
            Enter your details to generate personalized Mains qualifying verdicts
          </p>
        </div>

        {/* Local Error Banner */}
        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start space-x-3 text-xs leading-relaxed text-rose-600 dark:text-rose-400 animate-in shake duration-200">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Main Card Wrapper */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xl glass-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 select-none">
                <UserCheck className="w-3.5 h-3.5 text-primary" />
                Candidate Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="e.g. Aditya Sharma"
                className="w-full bg-secondary/50 border border-border hover:border-muted-foreground/30 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none transition-all placeholder:text-muted-foreground/50"
              />
            </div>

            {/* Registration Metadata Fields (Category & Gender) */}
            <div className="space-y-4">
              {/* Category Selection Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                  Reservation Category
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['General', 'OBC', 'EWS', 'SC', 'ST', 'PwBD'] as const).map((cat) => {
                    const isActive = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary border-primary text-primary-foreground font-extrabold shadow-sm'
                            : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gender Selection Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider select-none">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Male', 'Female', 'Transgender'] as const).map((g) => {
                    const isActive = gender === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary border-primary text-primary-foreground font-extrabold shadow-sm'
                            : 'bg-secondary/40 border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                        }`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              className="w-full mt-2 py-3.5 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Proceed to OMR Checker
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
