import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Sparkles,
  Bot,
  User,
  GraduationCap,
  BookOpen,
  Zap,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ChevronDown,
  X,
  FileText,
  RotateCcw,
  Download,
  Loader2,
  Lightbulb,
  FileUp,
} from 'lucide-react';
import { Conversation, Message, ModelType, Note, PracticeQuestion, StudyRole } from '../types/index.ts';
import { MarkdownRenderer } from './MarkdownRenderer.tsx';
import { parseGeneratedQuestions } from '../utils/studyLogic.ts';

interface ChatAreaProps {
  conversation: Conversation;
  onSendMessage: (content: string, questions?: PracticeQuestion[]) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  notes: Note[];
  onOpenNotes: () => void;
  onSaveAsNote: (title: string, content: string, subject: string) => void;
  onPracticeInArena: (questions: PracticeQuestion[]) => void;
  onUpdateConversationModel: (model: ModelType) => void;
  onUpdateConversationRole: (role: StudyRole) => void;
  onAttachNote: (noteId?: string) => void;
  onClearChat: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  onSendMessage,
  onStopStreaming,
  isStreaming,
  notes,
  onOpenNotes,
  onSaveAsNote,
  onPracticeInArena,
  onUpdateConversationModel,
  onUpdateConversationRole,
  onAttachNote,
  onClearChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // Track user interactive quiz answers in chat
  const [userChatAnswers, setUserChatAnswers] = useState<Record<string, number>>({});

  // Gemma Query Understanding & Cognitive Deconstruction state
  const [isGemmaAnalysisOpen, setIsGemmaAnalysisOpen] = useState(false);
  const [isAnalyzingGemma, setIsAnalyzingGemma] = useState(false);
  const [gemmaAnalysisResult, setGemmaAnalysisResult] = useState<{
    topic: string;
    studentNeed: string;
    cognitiveLevel: string;
    misconception: string;
    suggestedQuestions: string[];
    socraticHint: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const handleChatFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text || !text.trim()) return;

      const fileNameClean = file.name.replace(/\.[^/.]+$/, '');
      onSaveAsNote(fileNameClean, text, 'Uploaded Notes');
      onSendMessage(
        `I uploaded my study notes file "${file.name}". Please check these notes for academic accuracy, point out any misconceptions, and generate the correct simple note for Gemma study:\n\n"""\n${text}\n"""`
      );
      setIsAttachModalOpen(false);
    };
    reader.readAsText(file);
    if (chatFileInputRef.current) chatFileInputRef.current.value = '';
  };

  const attachedNote = notes.find((n) => n.id === conversation.attachedNoteId);

  const handleRunGemmaAnalysis = async (customQuery?: string) => {
    const query = customQuery || inputText.trim() || conversation.messages[conversation.messages.length - 1]?.content || 'Review key exam concepts and common traps';
    setIsAnalyzingGemma(true);
    setIsGemmaAnalysisOpen(true);
    try {
      const res = await fetch('/api/gemma/analyze-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          subject: attachedNote?.subject || 'General Study',
          conversationHistory: conversation.messages.slice(-4),
        }),
      });
      const data = await res.json();
      setGemmaAnalysisResult(data);
    } catch (e) {
      console.error('Gemma query analysis error:', e);
    } finally {
      setIsAnalyzingGemma(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages, isStreaming]);

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isStreaming) return;
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(trimmed);
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSelectInteractiveOption = (qId: string, optionIdx: number) => {
    setUserChatAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleExportChat = () => {
    const text = conversation.messages
      .map((m) => `[${m.role.toUpperCase()} - ${new Date(m.timestamp).toLocaleTimeString()}]:\n${m.content}\n\n`)
      .join('---\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickPrompts = [
    { label: '🛡️ Check & Simplify Note', prompt: 'Please check my study notes for academic accuracy, point out any misconceptions, and provide the correct simple note for Gemma study.' },
    { label: '🎯 5 Exam Questions', prompt: 'Generate 5 high-yield exam practice questions with detailed explanations for this topic.' },
    { label: '📝 Cornell Notes', prompt: 'Summarize this material using the Cornell Note-Taking system with cues, structured notes, and key takeaways.' },
    { label: '💡 Socratic Drill', prompt: 'Test my understanding by asking me one challenging conceptual question at a time and evaluating my answers.' },
    { label: '🧮 Step-by-Step Proof', prompt: 'Walk through the core theorem/equation and explain how to apply it during a midterm exam.' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 overflow-hidden relative">
      {/* Top ChatGPT-style Header */}
      <header className="h-14 border-b border-neutral-200 dark:border-neutral-800 px-4 flex items-center justify-between shrink-0 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          {/* Model Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium cursor-pointer transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {conversation.model === 'gemini-3.8-flash' && 'Gemini 3.8 Flash / Gemma Tutor'}
                {conversation.model === 'gemini-3.1-flash-lite' && 'Gemini 3.1 Flash Lite (Fast)'}
                {conversation.model === 'gemini-4-argon' && 'Gemini 4 Argon (Reasoning)'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {isModelDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-neutral-850 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-1.5 z-50">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Select AI Study Model
                </div>
                <button
                  onClick={() => {
                    onUpdateConversationModel('gemini-3.8-flash');
                    setIsModelDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                    conversation.model === 'gemini-3.8-flash' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold flex items-center gap-1.5">
                      <span>Gemini 3.8 Flash</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">Recommended</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">Gemma-powered tutor for notes & exam prep</div>
                  </div>
                  {conversation.model === 'gemini-3.8-flash' && <Check className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    onUpdateConversationModel('gemini-3.1-flash-lite');
                    setIsModelDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                    conversation.model === 'gemini-3.1-flash-lite' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold">Gemini 3.1 Flash Lite</div>
                    <div className="text-[11px] text-neutral-400">Lightning fast flashcard drills & quick Q&A</div>
                  </div>
                  {conversation.model === 'gemini-3.1-flash-lite' && <Check className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    onUpdateConversationModel('gemini-4-argon');
                    setIsModelDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                    conversation.model === 'gemini-4-argon' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium' : ''
                  }`}
                >
                  <div>
                    <div className="font-semibold">Gemini 4 Argon</div>
                    <div className="text-[11px] text-neutral-400">Complex mathematical proofs & multi-step STEM</div>
                  </div>
                  {conversation.model === 'gemini-4-argon' && <Check className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>

          {/* Study Role Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs text-neutral-700 dark:text-neutral-300 font-medium cursor-pointer transition"
            >
              {conversation.studyRole === 'exam_coach' && <GraduationCap className="w-3.5 h-3.5 text-amber-500" />}
              {conversation.studyRole === 'note_synthesizer' && <BookOpen className="w-3.5 h-3.5 text-blue-500" />}
              {conversation.studyRole === 'quizmaster' && <Zap className="w-3.5 h-3.5 text-purple-500" />}
              {conversation.studyRole === 'concept_explainer' && <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />}

              <span>
                {conversation.studyRole === 'exam_coach' && 'Role: Exam Coach'}
                {conversation.studyRole === 'note_synthesizer' && 'Role: Cornell Notes'}
                {conversation.studyRole === 'quizmaster' && 'Role: Quizmaster'}
                {conversation.studyRole === 'concept_explainer' && 'Role: Feynman Tutor'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-60 bg-white dark:bg-neutral-850 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-1.5 z-50">
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                  Select Study Persona
                </div>
                {[
                  { role: 'exam_coach', label: 'Exam Coach', desc: 'Creates exam questions & grades student answers', icon: GraduationCap },
                  { role: 'note_synthesizer', label: 'Note Synthesizer', desc: 'Formats into Cornell notes & key takeaways', icon: BookOpen },
                  { role: 'quizmaster', label: 'Quizmaster', desc: 'Rapid-fire interactive drills & Socratic checks', icon: Zap },
                  { role: 'concept_explainer', label: 'Feynman Tutor', desc: 'Intuitive analogies & step-by-step breakdowns', icon: HelpCircle },
                ].map((item) => (
                  <button
                    key={item.role}
                    onClick={() => {
                      onUpdateConversationRole(item.role as StudyRole);
                      setIsRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer ${
                      conversation.studyRole === item.role ? 'bg-neutral-100 dark:bg-neutral-800 font-semibold' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        <item.icon className="w-3.5 h-3.5 text-emerald-500" />
                        {item.label}
                      </div>
                      <div className="text-[10px] text-neutral-400">{item.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Attached Note Pill */}
          {attachedNote && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs border border-emerald-500/20">
              <FileText className="w-3 h-3" />
              <span className="truncate max-w-[120px] font-medium">{attachedNote.title}</span>
              <button
                onClick={() => onAttachNote(undefined)}
                className="hover:text-red-500 ml-0.5 cursor-pointer"
                title="Detach note"
                aria-label="Detach note"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleRunGemmaAnalysis()}
            disabled={isAnalyzingGemma}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer transition disabled:opacity-50"
            title="Gemma Query Intelligence: Cognitive deconstruction & intent analysis"
          >
            {isAnalyzingGemma ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
            <span className="hidden sm:inline">Gemma Intelligence</span>
          </button>

          <button
            onClick={() => setIsAttachModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs cursor-pointer"
            title="Attach a note from library"
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Attach Note</span>
          </button>

          <button
            onClick={handleExportChat}
            disabled={conversation.messages.length === 0}
            className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 disabled:opacity-40 cursor-pointer"
            title="Export conversation to Markdown"
            aria-label="Export conversation"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClearChat}
            disabled={conversation.messages.length === 0}
            className="p-1.5 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 disabled:opacity-40 cursor-pointer"
            title="Clear study chat"
            aria-label="Clear study chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Attach Note Modal */}
      {isAttachModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-emerald-500" />
                Attach Note to Study Session
              </h3>
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="file"
              ref={chatFileInputRef}
              onChange={handleChatFileUpload}
              accept=".txt,.md,.text"
              className="hidden"
            />

            {/* Upload File Note Option */}
            <div className="p-3 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">Upload Note File (.txt, .md)</div>
                  <div className="text-[10px] text-neutral-500">Auto-check accuracy & generate simple note</div>
                </div>
              </div>
              <button
                onClick={() => chatFileInputRef.current?.click()}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs transition"
              >
                Upload File
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Or select a note from your library to ground exam questions and chat:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {notes.length === 0 ? (
                <div className="text-center py-6 text-xs text-neutral-400">
                  No notes in your library. Create one in the Notes Organizer tab!
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => {
                      onAttachNote(note.id);
                      setIsAttachModalOpen(false);
                    }}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition flex items-center justify-between ${
                      conversation.attachedNoteId === note.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-neutral-900 dark:text-neutral-100">{note.title}</div>
                      <div className="text-[10px] text-neutral-400">{note.subject} · {note.keyTerms.length} terms · {note.examQuestions.length} Qs</div>
                    </div>
                    {conversation.attachedNoteId === note.id && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAttachModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemma Query Intelligence Modal */}
      {isGemmaAnalysisOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    Gemma Query Intelligence
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-mono">Gemma 3 (27B)</span>
                  </h3>
                  <p className="text-[10px] text-neutral-400">Cognitive intent analysis & misconception detection</p>
                </div>
              </div>
              <button
                onClick={() => setIsGemmaAnalysisOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isAnalyzingGemma ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                <p className="text-xs text-neutral-500 font-medium">
                  Gemma is deconstructing student query intent and mapping concepts...
                </p>
              </div>
            ) : gemmaAnalysisResult ? (
              <div className="space-y-4 text-xs">
                {/* Topic & Cognitive Level */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Identified Academic Topic</span>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{gemmaAnalysisResult.topic}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Bloom's Cognitive Level</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{gemmaAnalysisResult.cognitiveLevel}</span>
                  </div>
                </div>

                {/* Misconception Alert */}
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Cognitive Hurdle / Potential Misconception:
                  </div>
                  <p className="text-[11px] leading-relaxed">{gemmaAnalysisResult.misconception}</p>
                </div>

                {/* Socratic Guidance Hint */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Socratic Prompt (Think through this):
                  </div>
                  <p className="text-[11px] leading-relaxed italic">"{gemmaAnalysisResult.socraticHint}"</p>
                </div>

                {/* Predicted Exam Questions */}
                {gemmaAnalysisResult.suggestedQuestions && gemmaAnalysisResult.suggestedQuestions.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-bold text-neutral-700 dark:text-neutral-300 block">
                      Targeted Questions Formulated by Gemma:
                    </span>
                    <div className="space-y-1.5">
                      {gemmaAnalysisResult.suggestedQuestions.map((q: string, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setIsGemmaAnalysisOpen(false);
                            onSendMessage(q);
                          }}
                          className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-750 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer transition flex items-center justify-between group"
                        >
                          <span className="font-medium text-[11px] text-neutral-800 dark:text-neutral-200">
                            {idx + 1}. {q}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 group-hover:underline shrink-0 ml-2">
                            Ask in Chat →
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setIsGemmaAnalysisOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Scroll Container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
        {conversation.messages.length === 0 ? (
          /* Empty State Welcome */
          <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto text-center py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg mb-4">
              <GraduationCap className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              What are we studying today?
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-8 max-w-lg leading-relaxed">
              Your AI study companion for synthesizing messy lecture notes, drilling high-yield exam questions, and mastering difficult concepts.
            </p>

            {/* Quick-start cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {quickPrompts.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(item.prompt)}
                  className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition text-xs group cursor-pointer"
                >
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 mb-1">
                    {item.label}
                  </div>
                  <div className="text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </div>
                </button>
              ))}
            </div>

            {attachedNote && (
              <div className="mt-6 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300">
                <FileText className="w-4 h-4 shrink-0" />
                <span>Active note attached: <strong>{attachedNote.title}</strong></span>
              </div>
            )}
          </div>
        ) : (
          /* Conversation Message List */
          <div className="max-w-3xl mx-auto space-y-6">
            {conversation.messages.map((message) => {
              const isUser = message.role === 'user';
              const questions = message.practiceQuestions || (!isUser ? parseGeneratedQuestions(message.content) : []);

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 md:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-3 max-w-[88%] md:max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Message Bubble / Container */}
                    <div
                      className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xs ${
                        isUser
                          ? 'bg-emerald-600 text-white rounded-tr-xs'
                          : 'bg-neutral-100/90 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-750 text-neutral-800 dark:text-neutral-200 rounded-tl-xs'
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      ) : (
                        <MarkdownRenderer
                          content={message.content}
                          onPracticeExam={() => {
                            if (questions.length > 0) {
                              onPracticeInArena(questions);
                            }
                          }}
                          onSaveToNotes={(text) => {
                            const firstLine = text.split('\n')[0].replace(/^[#\*\s]+/, '') || 'Exam Prep Notes';
                            onSaveAsNote(firstLine, text, attachedNote?.subject || 'General');
                          }}
                        />
                      )}

                      {/* Interactive In-Chat Exam Questions if detected */}
                      {!isUser && questions.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-neutral-300/60 dark:border-neutral-700/80 space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                              <GraduationCap className="w-4 h-4" />
                              Interactive Exam Questions ({questions.length})
                            </span>
                            <button
                              onClick={() => onPracticeInArena(questions)}
                              className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              Launch in Exam Arena →
                            </button>
                          </div>

                          {questions.map((q, qIndex) => {
                            const userChoice = userChatAnswers[q.id];
                            const isAnswered = userChoice !== undefined;
                            const isCorrectChoice = isAnswered && userChoice === q.correctAnswer;

                            return (
                              <div
                                key={q.id || qIndex}
                                className="p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-750 space-y-2 text-xs"
                              >
                                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                  {qIndex + 1}. {q.question}
                                </div>

                                {q.options && (
                                  <div className="space-y-1.5 mt-2">
                                    {q.options.map((opt, optIdx) => {
                                      const isSelected = userChoice === optIdx;
                                      const isTargetCorrect = q.correctAnswer === optIdx;

                                      let btnStyle = 'border-neutral-200 dark:border-neutral-750 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300';
                                      if (isAnswered) {
                                        if (isTargetCorrect) {
                                          btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold';
                                        } else if (isSelected && !isTargetCorrect) {
                                          btnStyle = 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300';
                                        } else {
                                          btnStyle = 'opacity-60 border-neutral-200 dark:border-neutral-800';
                                        }
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          disabled={isAnswered}
                                          onClick={() => handleSelectInteractiveOption(q.id, optIdx)}
                                          className={`w-full text-left px-3 py-2 rounded-lg border text-xs flex items-center justify-between transition cursor-pointer ${btnStyle}`}
                                        >
                                          <span>
                                            <strong className="mr-1.5 text-neutral-500">
                                              {String.fromCharCode(65 + optIdx)})
                                            </strong>
                                            {opt}
                                          </span>

                                          {isAnswered && isTargetCorrect && (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                                          )}
                                          {isAnswered && isSelected && !isTargetCorrect && (
                                            <XCircle className="w-4 h-4 text-red-500 shrink-0 ml-2" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {isAnswered && (
                                  <div className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-300">
                                    <div className="font-semibold mb-0.5 text-neutral-800 dark:text-neutral-200">
                                      {isCorrectChoice ? '🎉 Correct!' : '⚠️ Explanation:'}
                                    </div>
                                    {q.explanation}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Message Actions */}
                    {!isUser && (
                      <div className="flex items-center gap-2 px-1 text-[11px] text-neutral-400">
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="flex items-center gap-1 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
                        >
                          {copiedMessageId === message.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <span>·</span>
                        <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-neutral-700 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isStreaming && (
              <div className="flex gap-3 md:gap-4 justify-start">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shrink-0 shadow-sm mt-0.5">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-750 text-sm text-neutral-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>StudyGemma is analyzing notes and formulating response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Sticky Bottom Input Area */}
      <div className="p-3 md:p-4 bg-white/95 dark:bg-neutral-900/95 border-t border-neutral-200 dark:border-neutral-800 backdrop-blur-md">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Quick pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(p.prompt)}
                disabled={isStreaming}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-medium transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="relative flex items-end gap-2 bg-neutral-100 dark:bg-neutral-800/90 rounded-2xl border border-neutral-200 dark:border-neutral-700 px-3 py-2.5 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition">
            <button
              onClick={() => setIsAttachModalOpen(true)}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 transition cursor-pointer mb-0.5"
              title="Attach notes"
              aria-label="Attach notes"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                attachedNote
                  ? `Ask questions about "${attachedNote.title}" or request exam practice...`
                  : 'Ask a question, paste lecture notes, or request exam practice questions...'
              }
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 max-h-40 leading-relaxed py-1"
            />

            {isStreaming ? (
              <button
                onClick={onStopStreaming}
                className="p-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition cursor-pointer shrink-0"
                title="Stop response"
                aria-label="Stop response"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white disabled:text-neutral-500 shadow-sm transition cursor-pointer shrink-0 disabled:cursor-not-allowed"
                title="Send message"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-center">
            <span className="text-[11px] text-neutral-400">
              StudyGemma uses AI to help you learn faster. Verify critical formulas with your course syllabus.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
