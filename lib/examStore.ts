import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface Question {
  question_no: number;
  paper: 'GS' | 'CSAT';
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  dropped: boolean;
}

export interface UserProfile {
  name: string;
  category: 'General' | 'OBC' | 'EWS' | 'SC' | 'ST' | 'PwBD';
  gender: 'Male' | 'Female' | 'Transgender';
}

export interface SubmissionStats {
  gs_score: number;
  csat_score: number;
  paper_type: 'GS' | 'CSAT';
  category: UserProfile['category'];
}

interface ExamState {
  // Profile state
  profile: UserProfile | null;

  // Exam state
  currentPaper: 'GS' | 'CSAT' | null;
  answers: Record<number, string>; // Maps question_no -> selected option
  isSubmitted: boolean;
  questions: Question[];
  
  // Statistical State (Supabase community database)
  communitySubmissions: SubmissionStats[];
  percentileRank: number | null;

  // Profile Actions
  saveProfile: (name: string, category: UserProfile['category'], gender: UserProfile['gender']) => void;
  clearProfile: () => void;

  // Exam Actions
  selectPaper: (paper: 'GS' | 'CSAT', loadedQuestions: Question[]) => void;
  selectAnswer: (qNum: number, answer: string) => void;
  clearAnswer: (qNum: number) => void;
  submitExam: () => Promise<void>;
  resetExam: () => void;
  loadCommunityStats: () => Promise<void>;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      profile: null,

      currentPaper: null,
      answers: {},
      isSubmitted: false,
      questions: [],
      communitySubmissions: [],
      percentileRank: null,

      saveProfile: (name, category, gender) => {
        set({
          profile: { name, category, gender }
        });
        get().loadCommunityStats();
      },

      clearProfile: () => {
        set({
          profile: null,
          currentPaper: null,
          answers: {},
          isSubmitted: false,
          questions: [],
          percentileRank: null
        });
      },

      selectPaper: (paper, loadedQuestions) => {
        set({
          currentPaper: paper,
          answers: {},
          isSubmitted: false,
          questions: loadedQuestions
        });
      },

      selectAnswer: (qNum, answer) => {
        set((state) => ({
          answers: { ...state.answers, [qNum]: answer }
        }));
      },

      clearAnswer: (qNum) => {
        set((state) => {
          const newAnswers = { ...state.answers };
          delete newAnswers[qNum];
          return { answers: newAnswers };
        });
      },

      submitExam: async () => {
        const { currentPaper, answers, questions, profile } = get();
        if (!currentPaper || questions.length === 0 || !profile) return;

        // Calculate scores
        let score = 0;
        const isGS = currentPaper === 'GS';
        
        questions.forEach((q) => {
          const selected = answers[q.question_no];
          if (isGS) {
            if (q.dropped) score += 2.0;
            else if (selected === q.correct_answer) score += 2.0;
            else if (selected !== undefined) score -= 0.66;
          } else {
            if (selected === q.correct_answer) score += 2.5;
            else if (selected !== undefined) score -= 0.83333;
          }
        });

        const finalScore = Math.round(score * 100) / 100;

        set({ isSubmitted: true });

        // Save to Supabase
        if (isSupabaseConfigured) {
          try {
            await supabase.from('submissions').insert({
              candidate_name: profile.name,
              category: profile.category,
              gender: profile.gender,
              paper_type: currentPaper,
              gs_score: isGS ? finalScore : 0,
              csat_score: !isGS ? finalScore : 0,
              answers_json: answers
            });
            
            // Reload stats
            await get().loadCommunityStats();
          } catch (e) {
            console.error("Failed to push scores to database:", e);
          }
        }
      },

      resetExam: () => {
        set({
          currentPaper: null,
          answers: {},
          isSubmitted: false,
          questions: [],
          percentileRank: null
        });
      },

      loadCommunityStats: async () => {
        if (!isSupabaseConfigured) return;
        try {
          const { data, error } = await supabase
            .from('submissions')
            .select('gs_score, csat_score, paper_type, category')
            .order('created_at', { ascending: false });

          if (error) throw error;
          if (!data) return;

          interface DbSubmissionRow {
            gs_score: number;
            csat_score: number;
            paper_type: 'GS' | 'CSAT';
            category: UserProfile['category'];
          }

          // Process stats resiliently
          const formattedSubmissions: SubmissionStats[] = (data as unknown as DbSubmissionRow[]).map((sub) => {
            return {
              gs_score: Number(sub.gs_score || 0),
              csat_score: Number(sub.csat_score || 0),
              paper_type: sub.paper_type,
              category: sub.category
            };
          });

          set({ communitySubmissions: formattedSubmissions });

          // Calculate percentile if submitted
          const { isSubmitted, currentPaper, answers, questions, profile } = get();
          if (isSubmitted && currentPaper && profile) {
            // Find candidate score
            let score = 0;
            const isGS = currentPaper === 'GS';
            questions.forEach((q) => {
              const selected = answers[q.question_no];
              if (isGS) {
                if (q.dropped) score += 2.0;
                else if (selected === q.correct_answer) score += 2.0;
                else if (selected !== undefined) score -= 0.66;
              } else {
                if (selected === q.correct_answer) score += 2.5;
                else if (selected !== undefined) score -= 0.83333;
              }
            });
            const myScore = Math.round(score * 100) / 100;

            // Filter peers of same paper
            const peerScores = formattedSubmissions
              .filter((sub) => sub.paper_type === currentPaper)
              .map((sub) => (isGS ? sub.gs_score : sub.csat_score));

            if (peerScores.length > 0) {
              const beatenPeers = peerScores.filter((s) => myScore > s).length;
              const percentile = Math.round((beatenPeers / peerScores.length) * 100);
              set({ percentileRank: percentile });
            }
          }
        } catch (e) {
          console.error("Failed to load community statistics:", e);
        }
      }
    }),
    {
      name: 'upsc-omr-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profile: state.profile,
        currentPaper: state.currentPaper,
        answers: state.answers,
        isSubmitted: state.isSubmitted,
        questions: state.questions,
        percentileRank: state.percentileRank
      })
    }
  )
);
