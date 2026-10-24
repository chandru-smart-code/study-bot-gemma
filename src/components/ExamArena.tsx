import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Send,
  HelpCircle,
  Trophy,
  Loader2,
  ChevronRight,
  BookOpen,
  Plus,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Note, PracticeQuestion } from '../types/index.ts';
import { calculateQuizScore } from '../utils/studyLogic.ts';

interface ExamArenaProps {
  initialQuestions?: PracticeQuestion[];
  notes: Note[];
  onSendToChatForReview: (prompt: string) => void;
}

export const ExamArena: React.FC<ExamArenaProps> = ({
  initialQuestions = [],
  notes,
  onSendToChatForReview,
}) => {
  const [questions, setQuestions] = useState<PracticeQuestion[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number | string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mode, setMode] = useState<'instant' | 'exam'>('instant');
  const [openTextAnswers, setOpenTextAnswers] = useState<Record<string, string>>({});
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [openAnswerEvaluation, setOpenAnswerEvaluation] = useState<any>(null);

  // Exam Generator form state
  const [examTopic, setExamTopic] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string>('');
  const [questionCount, setQuestionCount] = useState(4);
  const [difficulty, setDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);

  // Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      setQuestions(initialQuestions);
      setCurrentIndex(0);
      setUserAnswers({});
      setIsSubmitted(false);
      setSecondsElapsed(0);
    }
  }, [initialQuestions]);

  useEffect(() => {
    let interval: any = null;
    if (questions.length > 0 && !isSubmitted) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [questions.length, isSubmitted]);

  const handleGenerateExam = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const chosenNote = notes.find((n) => n.id === selectedNoteId);
    const targetTopic = examTopic.trim() || chosenNote?.title || 'General Academic Prep';

    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: targetTopic,
          noteContent: chosenNote?.rawContent || '',
          count: questionCount,
          difficulty,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate exam questions');
      const data = await res.json();

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        setUserAnswers({});
        setIsSubmitted(false);
        setSecondsElapsed(0);
      }
    } catch (err) {
      console.error('Exam generation error:', err);
      alert('Could not generate exam questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (isSubmitted && mode === 'exam') return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  const handleSubmitExam = () => {
    setIsSubmitted(true);
    // Grade questions
    const updated = questions.map((q) => {
      const ans = userAnswers[q.id];
      const isCorrect = ans !== undefined && ans === q.correctAnswer;
      return {
        ...q,
        userResponse: ans,
        isCorrect,
      };
    });
    setQuestions(updated);

    const score = calculateQuizScore(updated);
    if (score.percentage >= 80) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const handleGradeOpenEnded = async (question: PracticeQuestion) => {
    const text = openTextAnswers[question.id] || '';
    if (!text.trim()) return;

    setIsGradingOpen(true);
    try {
      const res = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.question,
          userAnswer: text,
          correctAnswer: question.correctAnswer,
          context: question.explanation,
        }),
      });

      const data = await res.json();
      setOpenAnswerEvaluation(data);

      setQuestions((prev) =>
        prev.map((q) =>
          q.id === question.id
            ? {
                ...q,
                userResponse: text,
                isCorrect: data.isCorrect,
                score: data.score,
                rubricFeedback: data.rubricFeedback,
              }
            : q
        )
      );
    } catch (err) {
      console.error('Grade open answer error:', err);
    } finally {
      setIsGradingOpen(false);
    }
  };

  const handleResetExam = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setCurrentIndex(0);
    setSecondsElapsed(0);
    setOpenAnswerEvaluation(null);
  };

  const scoreSummary = calculateQuizScore(
    questions.map((q) => ({
      ...q,
      userResponse: userAnswers[q.id],
      isCorrect: userAnswers[q.id] !== undefined && userAnswers[q.id] === q.correctAnswer,
    }))
  );

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 overflow-y-auto">
      {/* Top Header */}
      <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 px-6 flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">Exam Practice Arena</h2>
            <span className="text-[10px] text-neutral-400">Timed Mock Tests & Instant Feedback Drills</span>
          </div>
        </div>

        {questions.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-300">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{formatTimer(secondsElapsed)}</span>
            </div>

            <div className="flex rounded-lg border border-neutral-200 dark:border-neutral-700 p-0.5 text-xs bg-neutral-100 dark:bg-neutral-800">
              <button
                onClick={() => setMode('instant')}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition ${
                  mode === 'instant' ? 'bg-white dark:bg-neutral-900 font-semibold shadow-xs text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'
                }`}
              >
                Instant Feedback
              </button>
              <button
                onClick={() => setMode('exam')}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition ${
                  mode === 'exam' ? 'bg-white dark:bg-neutral-900 font-semibold shadow-xs text-amber-600 dark:text-amber-400' : 'text-neutral-500'
                }`}
              >
                Exam Simulation
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* 1. Exam Generator Controls when no questions or user wants a new test */}
        {questions.length === 0 ? (
          <div className="bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="max-w-xl mx-auto text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                Generate Custom Practice Exam
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Test your knowledge before the actual exam. Choose a topic or select one of your organized study notes.
              </p>
            </div>

            <form onSubmit={handleGenerateExam} className="max-w-xl mx-auto space-y-4">
              {/* Option A: Pick a saved note */}
              {notes.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                    Option 1: Base exam on saved note
                  </label>
                  <select
                    value={selectedNoteId}
                    onChange={(e) => {
                      setSelectedNoteId(e.target.value);
                      if (e.target.value) setExamTopic('');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                  >
                    <option value="">-- Or enter custom topic below --</option>
                    {notes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.subject}: {n.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Option B: Enter Topic */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Option 2: Enter study topic / course chapter
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cellular Respiration & Krebs Cycle, Calculus Limits, World War I"
                  value={examTopic}
                  onChange={(e) => {
                    setExamTopic(e.target.value);
                    if (e.target.value) setSelectedNoteId('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 outline-none focus:border-amber-500"
                />
              </div>

              {/* Settings row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">
                    Number of Questions
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none"
                  >
                    <option value={3}>3 Questions (Quick Drill)</option>
                    <option value={5}>5 Questions (Standard)</option>
                    <option value={8}>8 Questions (Full Mock Exam)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-500 mb-1">
                    Exam Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none"
                  >
                    <option value="easy">Introductory / Foundational</option>
                    <option value="medium">Standard Midterm Level</option>
                    <option value="hard">Challenging / AP / Final Exam</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating || (!examTopic.trim() && !selectedNoteId)}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                <span>{isGenerating ? 'Generating exam questions with AI...' : 'Generate Practice Exam'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Active Exam View */
          <div className="space-y-6">
            {/* Progress Bar & Question Jump bar */}
            <div className="bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-600 dark:text-neutral-400">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-neutral-400 font-mono">
                  {Object.keys(userAnswers).length} answered
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                />
              </div>

              {/* Question Dots */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {questions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentIndex;
                  const isCorrect = isSubmitted && q.isCorrect;
                  const isWrong = isSubmitted && q.isCorrect === false;

                  return (
                    <button
                      key={q.id || idx}
                      onClick={() => setCurrentIndex(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                        isCurrent
                          ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-neutral-900 bg-emerald-600 text-white'
                          : isCorrect
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 border border-emerald-500/30'
                          : isWrong
                          ? 'bg-red-100 dark:bg-red-950 text-red-600 border border-red-500/30'
                          : isAnswered
                          ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Card */}
            {currentQ && (
              <div className="bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Problem {currentIndex + 1}
                    </span>
                    <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                      {currentQ.question}
                    </h3>
                  </div>
                </div>

                {/* Multiple Choice Options */}
                {currentQ.options && currentQ.options.length > 0 ? (
                  <div className="space-y-2.5">
                    {currentQ.options.map((option, optIdx) => {
                      const selected = userAnswers[currentQ.id] === optIdx;
                      const showFeedback = mode === 'instant' ? userAnswers[currentQ.id] !== undefined : isSubmitted;
                      const isCorrect = optIdx === currentQ.correctAnswer;

                      let optClass = 'border-neutral-200 dark:border-neutral-750 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200';

                      if (showFeedback) {
                        if (isCorrect) {
                          optClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold';
                        } else if (selected && !isCorrect) {
                          optClass = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300';
                        } else {
                          optClass = 'opacity-60 border-neutral-200 dark:border-neutral-800';
                        }
                      } else if (selected) {
                        optClass = 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-medium';
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={showFeedback}
                          onClick={() => handleSelectOption(currentQ.id, optIdx)}
                          className={`w-full p-3.5 rounded-xl border text-xs text-left transition flex items-center justify-between cursor-pointer ${optClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-neutral-500 shrink-0">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="leading-relaxed">{option}</span>
                          </div>

                          {showFeedback && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 ml-2" />
                          )}
                          {showFeedback && selected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-red-500 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  /* Open-Ended Question Answer Box */
                  <div className="space-y-3">
                    <textarea
                      value={openTextAnswers[currentQ.id] || ''}
                      onChange={(e) =>
                        setOpenTextAnswers((prev) => ({ ...prev, [currentQ.id]: e.target.value }))
                      }
                      placeholder="Type your complete answer here. The AI examiner will grade it against academic rubrics..."
                      rows={4}
                      className="w-full p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-emerald-500"
                    />

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleGradeOpenEnded(currentQ)}
                        disabled={isGradingOpen || !openTextAnswers[currentQ.id]?.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
                      >
                        {isGradingOpen ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>Grade Answer with AI Rubric</span>
                      </button>
                    </div>

                    {openAnswerEvaluation && (
                      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs space-y-2">
                        <div className="flex items-center justify-between font-bold">
                          <span>Score: {openAnswerEvaluation.score} / 100</span>
                          <span className={openAnswerEvaluation.isCorrect ? 'text-emerald-500' : 'text-amber-500'}>
                            {openAnswerEvaluation.isCorrect ? 'Passing Answer' : 'Needs Improvement'}
                          </span>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-300">{openAnswerEvaluation.rubricFeedback}</p>
                        <div className="text-[11px] text-neutral-400">
                          <strong>Ideal Answer:</strong> {openAnswerEvaluation.idealAnswer}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation block (visible in instant mode after answering or after exam submit) */}
                {((mode === 'instant' && userAnswers[currentQ.id] !== undefined) || isSubmitted) && (
                  <div className="mt-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs leading-relaxed space-y-1.5">
                    <div className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-emerald-500" />
                      Comprehensive Concept Breakdown
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-300">{currentQ.explanation}</p>
                    <button
                      onClick={() =>
                        onSendToChatForReview(
                          `Please explain this exam question in detail and guide me through the concept:\n"${currentQ.question}"\nExplanation: ${currentQ.explanation}`
                        )
                      }
                      className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline pt-1 inline-block cursor-pointer"
                    >
                      Ask AI Study Coach to explain this further in Chat →
                    </button>
                  </div>
                )}

                {/* Navigation Buttons between questions */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentIndex === 0}
                    className="px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-600 dark:text-neutral-300 disabled:opacity-40 cursor-pointer"
                  >
                    Previous Question
                  </button>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                      className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold cursor-pointer"
                    >
                      <span>Next Question</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    !isSubmitted && (
                      <button
                        onClick={handleSubmitExam}
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        Submit Completed Exam
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Scorecard Summary if submitted */}
            {isSubmitted && (
              <div className="bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-md text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                  <Trophy className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-bold">Exam Results</h3>
                  <p className="text-xs text-neutral-400">{scoreSummary.feedback}</p>
                </div>

                <div className="flex items-center justify-center gap-8 py-2">
                  <div>
                    <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {scoreSummary.percentage}%
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-neutral-400">Score</div>
                  </div>

                  <div>
                    <div className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono">
                      {scoreSummary.letterGrade}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-neutral-400">Grade</div>
                  </div>

                  <div>
                    <div className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-100 font-mono">
                      {scoreSummary.correct} / {scoreSummary.total}
                    </div>
                    <div className="text-[10px] uppercase font-semibold text-neutral-400">Correct</div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={handleResetExam}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-semibold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Same Exam</span>
                  </button>

                  <button
                    onClick={() => setQuestions([])}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Exam Practice</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
