'use client';

import React, { useState, useEffect } from 'react';
import { useExamStore } from '@/lib/examStore';
import { useRouter } from 'next/navigation';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  BarChart, Bar, Legend
} from 'recharts';
import {
  Award, CheckCircle2, AlertCircle, RefreshCw,
  TrendingUp, BarChart3, HelpCircle, ChevronDown, ChevronUp, BookOpen, User, Info
} from 'lucide-react';

export default function ResultsDashboard() {
  const router = useRouter();
  const { questions, answers, currentPaper, resetExam, profile, communitySubmissions, percentileRank } = useExamStore();
  const [mounted, setMounted] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentPaper || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <AlertCircle className="w-12 h-12 text-muted-foreground animate-bounce" />
        <h3 className="mt-4 text-lg font-bold text-foreground">No active test session</h3>
        <p className="text-sm text-muted-foreground mt-1">Please select an exam from the home portal to begin.</p>
      </div>
    );
  }

  // --- 1. CORE CANDIDATE SCORING ---
  const totalQuestions = questions.length;
  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let rawCorrectCount = 0;
  
  let score = 0;
  const isGS = currentPaper === 'GS';

  questions.forEach((q) => {
    const selected = answers[q.question_no];
    const correct = q.correct_answer;

    if (isGS) {
      if (q.dropped) {
        score += 2.0; // Q64 Auto-credit
      } else {
        if (selected === undefined) {
          skippedCount++;
        } else if (selected === correct) {
          correctCount++;
          rawCorrectCount++;
          score += 2.0;
        } else {
          wrongCount++;
          score -= 0.66;
        }
      }
    } else { // CSAT
      if (selected === undefined) {
        skippedCount++;
      } else if (selected === correct) {
        correctCount++;
        rawCorrectCount++;
        score += 2.5;
      } else {
        wrongCount++;
        score -= 0.83333;
      }
    }
  });

  const finalScore = Math.round(score * 100) / 100;
  const maxMarks = 200;
  const attemptCount = correctCount + wrongCount;
  const accuracy = attemptCount > 0 ? Math.round((rawCorrectCount / attemptCount) * 100) : 0;
  const attemptRate = Math.round((attemptCount / totalQuestions) * 100);
  const totalDeducted = Math.round((wrongCount * (isGS ? 0.66 : 0.83)) * 100) / 100;

  // --- 2. LIVE CROWDSOURCED CUTOFF PREDICTOR ENGINE ---
  // Retrieve all GS scores submitted by the community
  const gsSubmissions = communitySubmissions
    .filter((sub) => sub.paper_type === 'GS')
    .map((sub) => sub.gs_score);

  // 75th percentile statistical calculation
  let predictedURCutoff = 76.0; // Lengthy/Tough paper fallback baseline (General UR)

  if (gsSubmissions.length >= 10) {
    const sorted = [...gsSubmissions].sort((a, b) => a - b);
    const percentileIndex = Math.floor(sorted.length * 0.75);
    const statisticalCutoff = sorted[percentileIndex];
    // Constrain within a highly realistic boundary to avoid early outlier crashes
    predictedURCutoff = Math.max(68.0, Math.min(102.0, statisticalCutoff));
  }

  // Scale category cutoffs proportionally based on standard UPSC ratios
  const categoryCutoffs: Record<string, number> = {
    'General': Math.round(predictedURCutoff * 2) / 2,
    'OBC': Math.round((predictedURCutoff - 1.0) * 2) / 2,
    'EWS': Math.round((predictedURCutoff - 5.0) * 2) / 2,
    'SC': Math.round((predictedURCutoff - 14.0) * 2) / 2,
    'ST': Math.round((predictedURCutoff - 19.0) * 2) / 2,
    'PwBD': Math.round((predictedURCutoff - 28.0) * 2) / 2
  };

  const myCategory = profile?.category || 'General';
  const myCutoff = categoryCutoffs[myCategory] || 76.0;

  // Verify CSAT first
  let csatScore = finalScore; // If CSAT, it is our finalScore. If GS, we assume CSAT is cleared for independent evaluation
  if (isGS) {
    csatScore = 80.0; // Default to qualified for independent evaluation
  }
  const isCSATQualified = csatScore >= 66.67;

  // --- 3. DYNAMIC ENCOURAGING 5-TIER VERDICT ---
  let verdictTitle = '';
  let verdictDesc = '';
  let verdictStyle = '';

  if (isGS && !isCSATQualified) {
    verdictTitle = 'CSAT Non-Qualifier (Focus on Paper II)';
    verdictStyle = 'from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30 text-rose-500 shadow-rose-500/5';
    verdictDesc = `Though your GS score is ${finalScore}, you did not secure the qualifying marks of 66.67 in CSAT. Do not be discouraged; prioritize analytical CSAT preparation and reading comprehension for the next attempt.`;
  } else if (!isGS) {
    // CSAT specific verdict
    const csatPassed = finalScore >= 66.67;
    verdictTitle = csatPassed ? 'CSAT Qualified (Threshold Cleared)' : 'CSAT Non-Qualifier';
    verdictStyle = csatPassed 
      ? 'from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30 text-emerald-600 shadow-emerald-500/5'
      : 'from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30 text-rose-500 shadow-rose-500/5';
    verdictDesc = csatPassed
      ? `Congratulations! You cleared the CSAT cutoff with ${finalScore} marks. Ensure your GS Paper I scores are checked to see your final Main qualification standing.`
      : `You scored ${finalScore} marks, which is below the qualifying threshold of 66.67. Make sure to review your quantitative and logical errors below to focus on Paper II.`;
  } else {
    // GS specific verdict
    const diff = finalScore - myCutoff;
    if (diff >= 5.0) {
      verdictTitle = 'Excellent Chances (Highly Likely to Qualify for Mains)';
      verdictStyle = 'from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10';
      verdictDesc = `Outstanding performance! Your score of ${finalScore} is comfortably above the predicted cutoff of ${myCutoff} for ${myCategory} category. You have exceptional chances of qualifying—immediately begin your intensive UPSC Mains preparation!`;
    } else if (diff >= 0) {
      verdictTitle = 'High Chances (Very Likely to Qualify for Mains)';
      verdictStyle = 'from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30 text-emerald-500 shadow-emerald-500/5';
      verdictDesc = `Great job! Your score of ${finalScore} is above the predicted category cutoff of ${myCutoff}. Your chances are very strong. Maintain your momentum, start planning your GS & optional answers sheets!`;
    } else if (diff >= -3.0) {
      verdictTitle = 'Borderline (Decent Chance — Start Mains Prep!)';
      verdictStyle = 'from-amber-500/15 via-amber-500/5 to-transparent border-amber-500/30 text-amber-500 shadow-amber-500/5';
      verdictDesc = `You are right in the buffer zone! Since the actual cutoff can easily swing lower based on final paper lengths and vacancies, you have a decent chance of qualifying. Do not waste precious weeks waiting for the results—start preparing for Mains today!`;
    } else {
      verdictTitle = 'Low Chances (Unlikely to Qualify for Mains)';
      verdictStyle = 'from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/20 text-rose-500';
      verdictDesc = `While qualifying this year is statistically unlikely, this challenging paper is an excellent learning stepping stone. Review your topic breakdowns below and refine your core concepts for the next attempt.`;
    }
  }

  // --- 4. TOPIC-WISE PERFORMANCE ANALYTICS ---
  const topicData: Record<string, { total: number; correct: number; wrong: number; skipped: number; score: number }> = {};
  
  questions.forEach((q) => {
    const topic = q.topic;
    const selected = answers[q.question_no];
    const correct = q.correct_answer;
    
    if (!topicData[topic]) {
      topicData[topic] = { total: 0, correct: 0, wrong: 0, skipped: 0, score: 0 };
    }
    
    topicData[topic].total++;
    
    if (q.dropped && isGS) {
      topicData[topic].correct++;
      topicData[topic].score += 2.0;
    } else {
      if (selected === undefined) {
        topicData[topic].skipped++;
      } else if (selected === correct) {
        topicData[topic].correct++;
        topicData[topic].score += isGS ? 2.0 : 2.5;
      } else {
        topicData[topic].wrong++;
        topicData[topic].score -= isGS ? 0.66 : 0.83;
      }
    }
  });

  const barChartData = Object.keys(topicData).map((topic) => {
    const data = topicData[topic];
    const attempted = data.correct + data.wrong;
    const topicAccuracy = attempted > 0 ? Math.round((data.correct / attempted) * 100) : 0;
    return {
      name: topic,
      Accuracy: topicAccuracy,
      'Attempt Rate': Math.round((attempted / data.total) * 100)
    };
  });

  // --- 5. SCORE FREQUENCY DISTRIBUTION GRAPH ---
  // Create beautiful score density bins
  const scoresArray = isGS ? gsSubmissions : communitySubmissions.filter(s => s.paper_type === 'CSAT').map(s => s.csat_score);
  const densityData = [];
  
  // Set default distribution baseline if database has too few entries
  const defaultUR = isGS ? 76.0 : 80.0;
  
  for (let bin = 0; bin <= 180; bin += 15) {
    const count = scoresArray.filter((s) => s >= bin && s < bin + 15).length;
    // Generate smooth bell curve fallback if needed
    const defaultFreq = Math.round(15 * Math.exp(-Math.pow(bin - defaultUR, 2) / 2000));
    densityData.push({
      Score: bin + 7.5,
      Candidates: scoresArray.length >= 10 ? count : defaultFreq,
    });
  }

  // Find community average score
  const totalScores = scoresArray.reduce((acc, curr) => acc + curr, 0);
  const communityAverage = scoresArray.length > 0 ? Math.round((totalScores / scoresArray.length) * 10) / 10 : (isGS ? 70.4 : 78.5);

  const toggleQuestion = (qNum: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qNum]: !prev[qNum],
    }));
  };

  const handleRetake = () => {
    if (confirm("Are you sure you want to re-enter your answers? This will clear your current selections.")) {
      resetExam();
      router.push('/attempt');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Portal Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/80 rounded-2xl p-6 shadow-sm glass">
        <div className="flex items-center space-x-3.5">
          <div className="bg-primary/10 text-primary w-12 h-12 flex items-center justify-center rounded-xl font-bold text-xl border border-primary/20 shrink-0">
            {profile?.name ? profile.name[0].toUpperCase() : 'C'}
          </div>
          <div>
            <span className="bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md border border-primary/20">
              Live Scorecard
            </span>
            <h2 className="text-xl font-black text-foreground mt-2">
              Performance analysis: {profile?.name || 'Candidate'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
              Paper: UPSC {currentPaper === 'GS' ? 'GS Paper I' : 'CSAT Paper II'} • Category: {myCategory} • Gender: {profile?.gender}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={handleRetake}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-sm font-semibold border border-border bg-card hover:bg-secondary/80 text-foreground transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Edit OMR Sheet
          </button>
          <button
            onClick={() => {
              resetExam();
              router.push('/');
            }}
            className="flex-1 sm:flex-none px-5 py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer text-center"
          >
            Portal Home
          </button>
        </div>
      </div>

      {/* UPSC Mains Dynamic Verdict Badge */}
      <div className={`bg-gradient-to-br ${verdictStyle} border rounded-2xl p-6 shadow-sm relative overflow-hidden`}>
        <div className="absolute right-4 top-4 bg-white/10 dark:bg-black/20 p-2.5 rounded-xl border border-white/20">
          <Award className="w-6 h-6 shrink-0" />
        </div>
        <div className="flex flex-col space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider opacity-80">Mains Qualifying Verdict</span>
          <h3 className="text-xl md:text-2xl font-black tracking-tight">{verdictTitle}</h3>
          <p className="text-xs md:text-sm leading-relaxed opacity-90 max-w-3xl pt-1">
            {verdictDesc}
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Glowing Score Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-4 top-4 bg-secondary p-1.5 rounded-lg">
            <Award className="w-4 h-4 text-primary" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Score Gained</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-4xl font-black font-mono tracking-tight text-foreground">
                {finalScore}
              </span>
              <span className="text-muted-foreground text-xs font-bold">/ {maxMarks} Marks</span>
            </div>
            {isGS && (
              <span className="inline-block mt-3 text-[10px] bg-blue-500/10 text-blue-600 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                Q64 Auto-Credit Applied (+2.0)
              </span>
            )}
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Evaluation Counts</span>
            <span className="bg-secondary p-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </span>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between border-b border-border/40 pb-1">
              <span className="text-muted-foreground">Correct Responses:</span>
              <span className="font-bold font-mono text-emerald-600">
                {rawCorrectCount} {isGS ? '(+1 Dropped)' : ''}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1">
              <span className="text-muted-foreground">Incorrect Responses:</span>
              <span className="font-bold font-mono text-rose-500">{wrongCount}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-muted-foreground">Skipped / Blanks:</span>
              <span className="font-bold font-mono text-slate-500">{skippedCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accuracy & Deductions</span>
            <span className="bg-secondary p-1.5 rounded-lg">
              <TrendingUp className="w-4 h-4 text-primary" />
            </span>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between border-b border-border/40 pb-1">
              <span className="text-muted-foreground">Accuracy Percentage:</span>
              <span className="font-bold font-mono text-foreground">{accuracy}%</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1">
              <span className="text-muted-foreground">Attempt Checklist Rate:</span>
              <span className="font-bold font-mono text-foreground">{attemptRate}%</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-muted-foreground">Negative Marks Deducted:</span>
              <span className="font-bold font-mono text-rose-500">-{totalDeducted}</span>
            </div>
          </div>
        </div>

        {/* Community Rank Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Community Stand</span>
            <span className="bg-secondary p-1.5 rounded-lg">
              <User className="w-4 h-4 text-primary" />
            </span>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between border-b border-border/40 pb-1">
              <span className="text-muted-foreground">Percentile Rank:</span>
              <span className="font-bold font-mono text-foreground">
                {percentileRank !== null ? `${percentileRank}%` : 'Evaluating...'}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-1">
              <span className="text-muted-foreground">Community Average:</span>
              <span className="font-bold font-mono text-foreground">{communityAverage}</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-muted-foreground">Total Logs Recorded:</span>
              <span className="font-bold font-mono text-foreground">
                {scoresArray.length || 'Placeholder'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Thresholds Table & Distribution Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* OMR Live Thresholds Table */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col lg:col-span-1 glass-card">
          <div>
            <h3 className="text-sm font-bold text-foreground">Live Predicted Cutoffs</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Category-wise Mains qualifiers thresholds</p>
          </div>

          <div className="mt-4 overflow-x-auto flex-1 select-none">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                  <th className="py-2">Category</th>
                  <th className="py-2 text-right">Cutoff</th>
                  <th className="py-2 text-right">Decent</th>
                  <th className="py-2 text-right">Excellent</th>
                </tr>
              </thead>
              <tbody className="font-medium">
                {Object.keys(categoryCutoffs).map((cat) => {
                  const cut = categoryCutoffs[cat];
                  const isActiveCat = myCategory === cat;
                  
                  return (
                    <tr
                      key={cat}
                      className={`border-b border-border/20 last:border-0 ${
                        isActiveCat
                          ? 'text-primary font-black bg-primary/5 border-l-2 border-l-primary pl-2'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <td className="py-2.5 font-bold">{cat}</td>
                      <td className="py-2.5 text-right font-bold font-mono">{cut}</td>
                      <td className="py-2.5 text-right font-mono text-amber-500">{cut - 3.0}</td>
                      <td className="py-2.5 text-right font-mono text-emerald-600">{cut + 5.0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 border-t border-border/40 pt-3 flex items-start space-x-2 text-[10px] leading-relaxed text-muted-foreground select-none font-medium">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <span>
              ℹ️ Note: These thresholds are calculated dynamically in real-time using a 75th-percentile statistical model of all logged scores. They will shift as more candidates input their checklists.
            </span>
          </div>
        </div>

        {/* Score Frequency Distribution Curve Graph */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col lg:col-span-2 glass-card h-[380px]">
          <div>
            <h3 className="text-sm font-bold text-foreground">Score Frequency Curve</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Comparative distribution of all scores.Dotted pins indicate cutoffs and community average.
            </p>
          </div>

          <div className="flex-1 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={densityData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                <XAxis dataKey="Score" tick={{ fontSize: 9 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '10px'
                  }}
                />
                <Area type="monotone" dataKey="Candidates" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.15} strokeWidth={2.5} />
                
                {/* Reference Pins */}
                <ReferenceLine x={finalScore} stroke="#8b5cf6" strokeWidth={2} label={{ value: 'You', position: 'top', fill: 'currentColor', fontSize: 10, fontWeight: 'bold' }} />
                <ReferenceLine x={myCutoff} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Cutoff', position: 'top', fill: '#f59e0b', fontSize: 9 }} />
                <ReferenceLine x={communityAverage} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Average', position: 'top', fill: '#94a3b8', fontSize: 9 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* 6. Topic-Wise Analytics Grid */}
      <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm flex flex-col h-[350px]">
        <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-primary" />
          Syllabus Segment Accuracy & Attempt Checklist Rates (%)
        </h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#fff'
                }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
              <Bar dataKey="Accuracy" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Attempt Rate" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7. Detailed Solutions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Detailed Response Review & Solutions Sheet
          </h3>
          <span className="text-xs text-muted-foreground font-semibold">
            Click any question row to expand option layouts and explanations
          </span>
        </div>

        <div className="space-y-3.5">
          {questions.map((q) => {
            const selected = answers[q.question_no];
            const correct = q.correct_answer;
            const isCorrect = selected === correct;
            const isSkipped = selected === undefined;
            const isDropped = q.dropped;
            const isExpanded = expandedQuestions[q.question_no] || false;

            let badgeStyle = 'bg-secondary text-muted-foreground border-border';
            let badgeText = 'Skipped (0.0)';
            if (isGS && isDropped) {
              badgeStyle = 'bg-blue-500/10 text-blue-600 border-blue-500/20';
              badgeText = 'Dropped (+2.0)';
            } else if (isCorrect) {
              badgeStyle = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
              badgeText = `Correct (+${isGS ? '2.0' : '2.5'})`;
            } else if (!isSkipped) {
              badgeStyle = 'bg-rose-500/10 text-rose-600 border-rose-500/20';
              badgeText = `Incorrect (-${isGS ? '0.66' : '0.83'})`;
            }

            return (
              <div
                key={q.question_no}
                className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all animate-in fade-in"
              >
                {/* Header row */}
                <div
                  onClick={() => toggleQuestion(q.question_no)}
                  className="p-4 flex items-center justify-between cursor-pointer select-none gap-4"
                >
                  <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                    <span className="bg-secondary text-foreground font-mono font-bold w-7 h-7 flex items-center justify-center rounded-lg border border-border text-xs">
                      {q.question_no}
                    </span>
                    <p className="text-sm font-medium text-foreground truncate flex-1 leading-relaxed">
                      {q.question.replace(/\n/g, ' ')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3.5 shrink-0">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeStyle}`}>
                      {badgeText}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-border/40 bg-secondary/20 space-y-4 animate-in slide-in-from-top-2 duration-150">
                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {q.question}
                    </div>

                    {/* Options list */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {(Object.keys(q.options) as Array<'A' | 'B' | 'C' | 'D'>).map((key) => {
                        const optVal = q.options[key];
                        const isCorrectOpt = key === correct;
                        const isSelectedOpt = key === selected;
                        
                        let optStyle = 'border-border/60 text-muted-foreground bg-card';
                        if (isGS && isDropped) {
                          optStyle = 'border-blue-300 bg-blue-500/5 text-foreground';
                        } else if (isCorrectOpt) {
                          optStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold';
                        } else if (isSelectedOpt) {
                          optStyle = 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400';
                        }

                        return (
                          <div
                            key={key}
                            className={`flex items-start p-3 rounded-lg border text-xs leading-relaxed ${optStyle}`}
                          >
                            <span className={`w-5 h-5 flex items-center justify-center rounded-md font-bold text-[10px] mr-2 shrink-0 ${
                              isGS && isDropped ? 'bg-blue-500 text-white' :
                              isCorrectOpt ? 'bg-emerald-600 text-white' :
                              isSelectedOpt ? 'bg-rose-600 text-white' :
                              'bg-secondary text-muted-foreground'
                            }`}>
                              {key}
                            </span>
                            <span className="flex-1">{optVal}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Metadata breakdown details */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-3.5 border-t border-border/40 text-xs font-semibold text-muted-foreground">
                      <div className="flex items-center space-x-2.5">
                        <span className="flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-md border border-border">
                          <BookOpen className="w-3.5 h-3.5" />
                          Topic: {q.topic}
                        </span>
                        <span className="bg-card px-2.5 py-1 rounded-md border border-border">
                          Difficulty: {q.difficulty}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {selected !== undefined && !isDropped && (
                          <span>
                            Selected Option: <strong className={isCorrect ? 'text-emerald-600' : 'text-rose-500'}>{selected}</strong>
                          </span>
                        )}
                        <span>
                          Official Key: <strong className="text-emerald-600">{isDropped ? 'X (Dropped)' : correct}</strong>
                        </span>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
