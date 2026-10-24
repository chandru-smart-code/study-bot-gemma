import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Sparkles,
  Search,
  Trash2,
  HelpCircle,
  GraduationCap,
  Download,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  Upload,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  X,
  FileText,
  Lightbulb,
  ArrowRight,
  FileUp,
} from 'lucide-react';
import { Note, PracticeQuestion } from '../types/index.ts';
import { filterNotesBySearch, SimpleGemmaNoteResult } from '../utils/studyLogic.ts';

interface NotesOrganizerProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onSaveNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  onPracticeInArena: (questions: PracticeQuestion[]) => void;
  onSendToChat: (note: Note) => void;
}

export const NotesOrganizer: React.FC<NotesOrganizerProps> = ({
  notes,
  activeNoteId,
  onSelectNote,
  onSaveNote,
  onDeleteNote,
  onPracticeInArena,
  onSendToChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'cornell' | 'raw' | 'questions' | 'glossary'>('cornell');
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [showAnswerForQuestion, setShowAnswerForQuestion] = useState<Record<string, boolean>>({});

  // Note file upload & Gemma Check state
  const [isAuditing, setIsAuditing] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditResult, setAuditResult] = useState<SimpleGemmaNoteResult | null>(null);
  const [copiedSimpleNote, setCopiedSimpleNote] = useState(false);
  const [interactiveQuizChoice, setInteractiveQuizChoice] = useState<Record<string, number>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeNote = notes.find((n) => n.id === activeNoteId) || notes[0];
  const subjects = ['all', ...Array.from(new Set(notes.map((n) => n.subject)))];
  const filteredNotes = filterNotesBySearch(notes, searchQuery, subjectFilter);

  const handleCreateNewNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Study Note',
      subject: subjectFilter !== 'all' ? subjectFilter : 'General',
      rawContent: '',
      summary: 'Add your lecture notes and click "Audit & Simplify" or "AI Organize" to generate clean notes and exam questions.',
      keyTerms: [],
      examQuestions: [],
      tags: ['study'],
      updatedAt: Date.now(),
    };
    onSaveNote(newNote);
    onSelectNote(newNote.id);
  };

  // Upload and Check File Notes
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text || !text.trim()) {
        alert('The uploaded file appears to be empty.');
        return;
      }
      runNoteCheckAndSimplify(text, file.name, activeNote?.subject || 'General');
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const runNoteCheckAndSimplify = async (content: string, filename?: string, subject?: string) => {
    setIsAuditing(true);
    setIsAuditModalOpen(true);
    try {
      const res = await fetch('/api/check-and-simplify-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          filename: filename || activeNote?.title || 'Study_Note.txt',
          subject: subject || activeNote?.subject || 'General',
        }),
      });

      if (!res.ok) throw new Error('Failed to audit note');
      const data: SimpleGemmaNoteResult = await res.json();
      setAuditResult(data);
    } catch (err) {
      console.error('Audit note error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleApplyAuditAsNote = () => {
    if (!auditResult) return;

    const newNote: Note = {
      id: `note-gemma-${Date.now()}`,
      title: auditResult.title || 'Simplified Study Note',
      subject: auditResult.subject || 'General',
      rawContent: `${auditResult.simplifiedGemmaNote.bigIdea}\n\nCore Mechanism:\n${auditResult.simplifiedGemmaNote.coreMechanism}\n\nHigh-Yield Key Takeaways:\n${auditResult.simplifiedGemmaNote.simplifiedBullets.map((b) => `• ${b}`).join('\n')}\n\nCommon Exam Pitfalls:\n${auditResult.simplifiedGemmaNote.commonTraps.map((t) => `⚠️ ${t}`).join('\n')}`,
      summary: auditResult.simplifiedGemmaNote.bigIdea,
      cornellNotes: {
        cues: [
          'What is the core big idea?',
          'How does the mechanism function in simple terms?',
          'What are the common exam pitfalls to avoid?',
        ],
        notes: auditResult.simplifiedGemmaNote.simplifiedBullets,
        summary: auditResult.simplifiedGemmaNote.coreMechanism,
      },
      keyTerms: auditResult.keyTerms || [],
      examQuestions: auditResult.examQuestions || [],
      tags: ['gemma-verified', 'simple-note'],
      updatedAt: Date.now(),
    };

    onSaveNote(newNote);
    onSelectNote(newNote.id);
    setIsAuditModalOpen(false);
    setActiveTab('cornell');
  };

  const handleCopySimpleNote = () => {
    if (!auditResult) return;
    const text = `# ${auditResult.title} (${auditResult.subject})
📌 Big Idea:
${auditResult.simplifiedGemmaNote.bigIdea}

💡 Core Mechanism in Simple English:
${auditResult.simplifiedGemmaNote.coreMechanism}

🔑 High-Yield Key Points:
${auditResult.simplifiedGemmaNote.simplifiedBullets.map((b) => `- ${b}`).join('\n')}

⚠️ Exam Traps:
${auditResult.simplifiedGemmaNote.commonTraps.map((t) => `- ${t}`).join('\n')}

🎯 Key Terms:
${auditResult.keyTerms.map((kt) => `• ${kt.term}: ${kt.definition}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopiedSimpleNote(true);
    setTimeout(() => setCopiedSimpleNote(false), 2000);
  };

  const handleAiOrganize = async () => {
    if (!activeNote || !activeNote.rawContent.trim()) {
      alert('Please add some raw lecture notes first before running AI Organize.');
      return;
    }

    setIsOrganizing(true);
    try {
      const res = await fetch('/api/organize-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: activeNote.rawContent,
          subject: activeNote.subject,
        }),
      });

      if (!res.ok) throw new Error('Failed to organize notes');
      const data = await res.json();

      const updated: Note = {
        ...activeNote,
        title: data.title || activeNote.title,
        summary: data.summary || activeNote.summary,
        cornellNotes: data.cornellNotes || activeNote.cornellNotes,
        keyTerms: data.keyTerms || activeNote.keyTerms,
        examQuestions: data.examQuestions || activeNote.examQuestions,
        updatedAt: Date.now(),
      };

      onSaveNote(updated);
      setActiveTab('cornell');
    } catch (err) {
      console.error('AI Organize error:', err);
      alert('Unable to organize notes right now. Please try again.');
    } finally {
      setIsOrganizing(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!activeNote) return;
    let md = `# ${activeNote.title}\n**Subject:** ${activeNote.subject}\n\n## Summary\n${activeNote.summary}\n\n`;

    if (activeNote.cornellNotes) {
      md += `## Cornell Notes\n### Cues & Questions\n`;
      activeNote.cornellNotes.cues.forEach((c) => (md += `- ${c}\n`));
      md += `\n### Lecture Notes\n`;
      activeNote.cornellNotes.notes.forEach((n) => (md += `- ${n}\n`));
    }

    if (activeNote.keyTerms.length > 0) {
      md += `\n## Key Vocabulary\n`;
      activeNote.keyTerms.forEach((kt) => (md += `**${kt.term}:** ${kt.definition}\n`));
    }

    if (activeNote.examQuestions.length > 0) {
      md += `\n## Practice Exam Questions\n`;
      activeNote.examQuestions.forEach((q, i) => {
        md += `\n**${i + 1}. ${q.question}**\n`;
        if (q.options) {
          q.options.forEach((opt, optI) => {
            md += `  ${String.fromCharCode(65 + optI)}) ${opt}\n`;
          });
          md += `*Correct Answer: ${String.fromCharCode(65 + Number(q.correctAnswer))}*\n`;
        }
        md += `*Explanation:* ${q.explanation}\n`;
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadSample = (sampleType: 'bio' | 'calc') => {
    if (sampleType === 'bio') {
      runNoteCheckAndSimplify(
        `Photosynthesis occurs in chloroplasts.
Stage 1: Light-dependent reactions happen in thylakoid membranes. Solar photons excite chlorophyll electrons, splitting H2O to release O2 as byproduct. Generates ATP and NADPH.
Stage 2: Calvin Cycle (light-independent) in the stroma. Rubisco fixes carbon dioxide (CO2) into glyceraldehyde-3-phosphate (G3P) using ATP and NADPH.
Misconception check: Some students think the Calvin Cycle only happens at night. It happens during the day because it requires continuous ATP/NADPH from light reactions.`,
        'photosynthesis_lecture_notes.txt',
        'Biology'
      );
    } else {
      runNoteCheckAndSimplify(
        `Calculus: Limits and L'Hopital's Rule.
When evaluating limit as x approaches a of f(x)/g(x), if direct substitution yields indeterminate form 0/0 or infinity/infinity:
L'Hopital's Rule states: lim [f(x)/g(x)] = lim [f'(x)/g'(x)].
Crucial Exam Warning: You take derivatives of numerator and denominator separately! Do NOT apply the Quotient Rule when using L'Hopital's Rule.
Always verify the indeterminate condition first before differentiating!`,
        'calculus_limits_lhopital.txt',
        'Calculus'
      );
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".txt,.md,.text"
        className="hidden"
      />

      {/* Left List of Notes */}
      <div className="w-full md:w-80 border-r border-neutral-200 dark:border-neutral-800 flex flex-col bg-white dark:bg-neutral-900 shrink-0">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Notes Library
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-100 text-xs font-semibold cursor-pointer transition"
                title="Upload note file (.txt, .md)"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>
              <button
                onClick={handleCreateNewNote}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Quick upload help pill */}
          <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 text-[11px] text-neutral-600 dark:text-neutral-400 flex items-center justify-between">
            <span>Upload or try sample note:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleLoadSample('bio')}
                className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] hover:underline cursor-pointer"
              >
                Bio
              </button>
              <button
                onClick={() => handleLoadSample('calc')}
                className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-[10px] hover:underline cursor-pointer"
              >
                Calc
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs">
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search notes & terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
            />
          </div>

          {/* Subject Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSubjectFilter(s)}
                className={`px-2.5 py-1 rounded-md text-[11px] capitalize cursor-pointer transition whitespace-nowrap font-medium ${
                  subjectFilter === s
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Note Cards List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-12 text-xs text-neutral-400">
              No notes found. Upload a file or create a note to begin!
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition relative group ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-neutral-900 dark:text-neutral-100 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-neutral-700 text-[10px] font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                      {note.subject}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${note.title}"?`)) onDeleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-500 transition"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-semibold text-xs truncate mb-1">{note.title}</h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                    {note.summary || note.rawContent || 'No summary generated yet.'}
                  </p>

                  <div className="mt-2 flex items-center gap-3 text-[10px] text-neutral-400">
                    <span>{note.keyTerms.length} terms</span>
                    <span>·</span>
                    <span>{note.examQuestions.length} exam Qs</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Note Detail / Editor */}
      {activeNote ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-900">
          {/* Note Action Toolbar */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={activeNote.subject}
                  onChange={(e) => onSaveNote({ ...activeNote, subject: e.target.value })}
                  className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-neutral-200 dark:border-neutral-700 outline-none w-28"
                  placeholder="Subject"
                />
                <span className="text-[10px] text-neutral-400">Last updated {new Date(activeNote.updatedAt).toLocaleTimeString()}</span>
              </div>
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => onSaveNote({ ...activeNote, title: e.target.value })}
                className="text-base font-bold bg-transparent border-none outline-none text-neutral-900 dark:text-neutral-100 w-full"
                placeholder="Note Title"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Audit & Simplify Note with Gemma */}
              <button
                onClick={() => runNoteCheckAndSimplify(activeNote.rawContent || activeNote.summary, activeNote.title, activeNote.subject)}
                disabled={isAuditing || (!activeNote.rawContent.trim() && !activeNote.summary.trim())}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-100 text-xs font-semibold cursor-pointer transition disabled:opacity-40"
                title="Check note for accuracy & generate simple Gemma study guide"
              >
                {isAuditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                <span>Check & Simplify Note</span>
              </button>

              <button
                onClick={handleAiOrganize}
                disabled={isOrganizing || !activeNote.rawContent.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition disabled:opacity-50"
              >
                {isOrganizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isOrganizing ? 'Organizing...' : 'AI Organize'}</span>
              </button>

              <button
                onClick={() => onPracticeInArena(activeNote.examQuestions)}
                disabled={activeNote.examQuestions.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-medium cursor-pointer transition disabled:opacity-40"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Practice Exam ({activeNote.examQuestions.length})</span>
              </button>

              <button
                onClick={() => onSendToChat(activeNote)}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs cursor-pointer"
                title="Open in Chat Assistant"
              >
                <Send className="w-4 h-4" />
              </button>

              <button
                onClick={handleExportMarkdown}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs cursor-pointer"
                title="Export as Markdown"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="px-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-6 text-xs font-medium bg-neutral-50/50 dark:bg-neutral-850">
            <button
              onClick={() => setActiveTab('cornell')}
              className={`py-2.5 border-b-2 cursor-pointer transition ${
                activeTab === 'cornell'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              📖 Cornell Study Guide
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`py-2.5 border-b-2 cursor-pointer transition ${
                activeTab === 'raw'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              📝 Raw Notes & File Editor
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-2.5 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
                activeTab === 'questions'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <span>🎯 Exam Questions</span>
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px]">
                {activeNote.examQuestions.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              className={`py-2.5 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
                activeTab === 'glossary'
                  ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <span>🔑 Glossary</span>
              <span className="px-1.5 py-0.2 rounded-full bg-neutral-200 dark:bg-neutral-700 text-[10px]">
                {activeNote.keyTerms.length}
              </span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* 1. Cornell Notes View */}
            {activeTab === 'cornell' && (
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Executive Summary Card */}
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Executive Summary & Takeaways
                  </h4>
                  <p>{activeNote.summary || 'Click "AI Organize" or "Check & Simplify Note" to automatically generate an executive summary.'}</p>
                </div>

                {/* Cornell Grid */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-850 shadow-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-200 dark:divide-neutral-800">
                    {/* Left Column: Cues & Questions */}
                    <div className="p-4 bg-neutral-50/60 dark:bg-neutral-800/40 space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        🔍 Cue Column / Questions
                      </div>
                      <p className="text-[11px] text-neutral-400 italic">
                        Questions to trigger active recall while reviewing
                      </p>
                      <div className="space-y-2.5 pt-2">
                        {activeNote.cornellNotes?.cues?.map((cue, i) => (
                          <div
                            key={i}
                            className="p-2.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-750 text-xs font-medium text-neutral-800 dark:text-neutral-200 shadow-2xs"
                          >
                            {cue}
                          </div>
                        )) || <div className="text-xs text-neutral-400">No cues generated yet.</div>}
                      </div>
                    </div>

                    {/* Right Column: Structured Lecture Notes */}
                    <div className="md:col-span-2 p-4 space-y-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        📖 Structured Lecture Notes
                      </div>
                      <p className="text-[11px] text-neutral-400 italic">
                        Condensed formulas, definitions, and relationships
                      </p>
                      <div className="space-y-2 pt-2">
                        {activeNote.cornellNotes?.notes?.map((n, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-xs leading-relaxed text-neutral-800 dark:text-neutral-200"
                          >
                            <span className="text-emerald-500 font-bold shrink-0">•</span>
                            <div>{n}</div>
                          </div>
                        )) || <div className="text-xs text-neutral-400">No structured notes yet.</div>}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Review Summary */}
                  <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/70">
                    <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                      📌 Bottom Summary (The 2-Minute Review)
                    </div>
                    <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                      {activeNote.cornellNotes?.summary || activeNote.summary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Raw Notes & File Editor View */}
            {activeTab === 'raw' && (
              <div className="max-w-4xl mx-auto space-y-4 h-full flex flex-col">
                {/* Drag-and-drop & file upload prompt banner */}
                <div className="p-4 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                        Upload Note File (.txt, .md)
                      </h4>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Upload raw lecture notes to verify accuracy and receive a crystal-clear simple note.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition"
                    >
                      Select File
                    </button>
                    <button
                      onClick={() => handleLoadSample('bio')}
                      className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium cursor-pointer"
                    >
                      Sample
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Raw Note Text:</span>
                  <span>{activeNote.rawContent.length} characters</span>
                </div>

                <textarea
                  value={activeNote.rawContent}
                  onChange={(e) => onSaveNote({ ...activeNote, rawContent: e.target.value })}
                  placeholder="Paste your raw lecture notes, slide transcripts, or textbook chapters here..."
                  className="flex-1 w-full min-h-[300px] p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850 text-xs font-mono leading-relaxed outline-none focus:border-emerald-500 transition"
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => runNoteCheckAndSimplify(activeNote.rawContent, activeNote.title, activeNote.subject)}
                    disabled={isAuditing || !activeNote.rawContent.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>Check & Produce Simple Note for Gemma</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Practice Exam Questions */}
            {activeTab === 'questions' && (
              <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    High-Yield Exam Questions ({activeNote.examQuestions.length})
                  </h3>
                  <button
                    onClick={() => onPracticeInArena(activeNote.examQuestions)}
                    disabled={activeNote.examQuestions.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Launch in Exam Arena</span>
                  </button>
                </div>

                {activeNote.examQuestions.length === 0 ? (
                  <div className="text-center py-12 text-xs text-neutral-400">
                    No exam questions generated yet. Click "Check & Simplify Note" or "AI Organize"!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeNote.examQuestions.map((q, idx) => {
                      const isRevealed = showAnswerForQuestion[q.id];
                      return (
                        <div
                          key={q.id || idx}
                          className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 space-y-3"
                        >
                          <div className="font-semibold text-xs leading-relaxed text-neutral-900 dark:text-neutral-100">
                            {idx + 1}. {q.question}
                          </div>

                          {q.options && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {q.options.map((opt, optI) => {
                                const isCorrect = optI === Number(q.correctAnswer);
                                return (
                                  <div
                                    key={optI}
                                    className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                                      isRevealed && isCorrect
                                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                                    }`}
                                  >
                                    <span className="font-bold text-neutral-400">
                                      {String.fromCharCode(65 + optI)})
                                    </span>
                                    <span>{opt}</span>
                                    {isRevealed && isCorrect && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-auto shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                            <button
                              onClick={() =>
                                setShowAnswerForQuestion((prev) => ({
                                  ...prev,
                                  [q.id]: !prev[q.id],
                                }))
                              }
                              className="text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline"
                            >
                              {isRevealed ? 'Hide Answer & Explanation' : 'Show Answer & Explanation'}
                            </button>
                          </div>

                          {isRevealed && (
                            <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20 text-xs text-neutral-700 dark:text-neutral-300">
                              <span className="font-bold text-emerald-700 dark:text-emerald-300 block mb-1">
                                Explanation & Exam Concept:
                              </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 4. Glossary Tab */}
            {activeTab === 'glossary' && (
              <div className="max-w-4xl mx-auto space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Key Vocabulary & Definitions ({activeNote.keyTerms.length})
                </h3>

                {activeNote.keyTerms.length === 0 ? (
                  <div className="text-center py-12 text-xs text-neutral-400">
                    No vocabulary extracted yet. Run "Check & Simplify Note" or "AI Organize"!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeNote.keyTerms.map((term, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-850 space-y-1.5"
                      >
                        <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <span>{term.term}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                          {term.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-neutral-400" />
          <h3 className="font-semibold text-sm">No Note Selected</h3>
          <p className="text-xs text-neutral-400 max-w-sm">
            Select an existing note from the library, upload a note file, or click New Note to begin.
          </p>
          <button
            onClick={handleCreateNewNote}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
          >
            Create New Note
          </button>
        </div>
      )}

      {/* Output Modal: Gemma Accuracy Check & Correct Simple Note */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-5 my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <span>Gemma Note Check & Simple Study Guide</span>
                    {auditResult?.accuracyCheck && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        {auditResult.accuracyCheck.isAccurate ? '✓ Verified Accurate' : '⚠️ Corrections Applied'}
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    Academic fact verification & crystal-clear simplified study note
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            {isAuditing ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                  Checking note facts against academic standards & synthesizing simple Gemma guide...
                </p>
              </div>
            ) : auditResult ? (
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {/* 1. Academic Accuracy Check Banner */}
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-750 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      1. Academic Verification & Fact Check
                    </span>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      Subject: {auditResult.subject}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {auditResult.accuracyCheck.summary}
                  </p>
                  {auditResult.accuracyCheck.correctionsList && auditResult.accuracyCheck.correctionsList.length > 0 && (
                    <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-1.5">
                      <span className="text-[11px] font-semibold text-neutral-500 block">
                        Verified Points & Adjustments:
                      </span>
                      {auditResult.accuracyCheck.correctionsList.map((item, idx) => (
                        <div
                          key={idx}
                          className="text-xs flex items-start gap-2 text-neutral-800 dark:text-neutral-200"
                        >
                          <span className="text-emerald-500 font-bold">✓</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Correct Simple Note for Gemma Card */}
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      2. Correct Simple Note for Gemma (High Yield)
                    </span>
                    <button
                      onClick={handleCopySimpleNote}
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                    >
                      {copiedSimpleNote ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSimpleNote ? 'Copied!' : 'Copy Note'}</span>
                    </button>
                  </div>

                  {/* Big Idea */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-850 border border-emerald-500/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
                      📌 Big Idea
                    </span>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {auditResult.simplifiedGemmaNote.bigIdea}
                    </p>
                  </div>

                  {/* Core Mechanism in Simple English */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-neutral-850 border border-emerald-500/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-0.5">
                      💡 Core Mechanism in Simple English
                    </span>
                    <p className="text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
                      {auditResult.simplifiedGemmaNote.coreMechanism}
                    </p>
                  </div>

                  {/* Simplified Bullet Points */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 block">
                      🔑 Key High-Yield Points:
                    </span>
                    <div className="space-y-1.5">
                      {auditResult.simplifiedGemmaNote.simplifiedBullets.map((bullet, idx) => (
                        <div
                          key={idx}
                          className="text-xs p-2.5 rounded-lg bg-white dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-start gap-2"
                        >
                          <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Common Traps */}
                  {auditResult.simplifiedGemmaNote.commonTraps && auditResult.simplifiedGemmaNote.commonTraps.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1">
                      <span className="text-xs font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        ⚠️ Common Exam Traps to Watch Out For:
                      </span>
                      {auditResult.simplifiedGemmaNote.commonTraps.map((trap, idx) => (
                        <p key={idx} className="text-[11px] leading-relaxed">
                          • {trap}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Checkpoint Practice Questions */}
                {auditResult.examQuestions && auditResult.examQuestions.length > 0 && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-emerald-500" />
                      3. Checkpoint Practice Questions (Test Your Recall)
                    </span>
                    <div className="space-y-3">
                      {auditResult.examQuestions.map((q, qIdx) => {
                        const selectedChoice = interactiveQuizChoice[q.id || `q-${qIdx}`];
                        const hasAnswered = selectedChoice !== undefined;
                        const isCorrect = hasAnswered && selectedChoice === Number(q.correctAnswer);

                        return (
                          <div
                            key={qIdx}
                            className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/40 space-y-2.5 text-xs"
                          >
                            <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {qIdx + 1}. {q.question}
                            </div>
                            {q.options && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {q.options.map((opt, optIdx) => {
                                  const isOptionChosen = selectedChoice === optIdx;
                                  const isOptionCorrect = optIdx === Number(q.correctAnswer);
                                  return (
                                    <button
                                      key={optIdx}
                                      onClick={() =>
                                        setInteractiveQuizChoice((prev) => ({
                                          ...prev,
                                          [q.id || `q-${qIdx}`]: optIdx,
                                        }))
                                      }
                                      className={`p-2 rounded-lg border text-left cursor-pointer transition flex items-center justify-between ${
                                        hasAnswered
                                          ? isOptionCorrect
                                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-semibold'
                                            : isOptionChosen
                                            ? 'bg-red-500/20 border-red-500 text-red-800 dark:text-red-300'
                                            : 'border-neutral-200 dark:border-neutral-700 opacity-60'
                                          : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-emerald-500'
                                      }`}
                                    >
                                      <span>{String.fromCharCode(65 + optIdx)}) {opt}</span>
                                      {hasAnswered && isOptionCorrect && (
                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {hasAnswered && (
                              <div
                                className={`p-2.5 rounded-lg text-[11px] leading-relaxed ${
                                  isCorrect
                                    ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20'
                                    : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20'
                                }`}
                              >
                                <span className="font-bold block mb-0.5">
                                  {isCorrect ? '🎉 Correct!' : '💡 Explanation:'}
                                </span>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs font-medium cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {auditResult && (
                  <>
                    <button
                      onClick={() => {
                        if (auditResult.examQuestions.length > 0) {
                          onPracticeInArena(auditResult.examQuestions);
                          setIsAuditModalOpen(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold cursor-pointer"
                    >
                      Practice in Arena
                    </button>

                    <button
                      onClick={handleApplyAuditAsNote}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Save to Notes Library
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
