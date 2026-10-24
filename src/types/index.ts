export type StudyRole = 
  | 'exam_coach' 
  | 'note_synthesizer' 
  | 'quizmaster' 
  | 'concept_explainer';

export type ModelType = 
  | 'gemini-3.8-flash' 
  | 'gemini-3.1-flash-lite' 
  | 'gemini-4-argon';

export interface PracticeQuestion {
  id: string;
  question: string;
  type: 'mcq' | 'open' | 'true_false';
  options?: string[];
  correctAnswer: string | number;
  explanation: string;
  hint?: string;
  userResponse?: string | number;
  isCorrect?: boolean;
  score?: number; // 0 - 100 for open ended
  rubricFeedback?: string;
}

export interface NoteKeyTerm {
  term: string;
  definition: string;
}

export interface CornellNotes {
  cues: string[];
  notes: string[];
  summary: string;
}

export interface NoteProblem {
  id: string;
  title: string;
  scenario: string;
  realWorldExample: string;
  stepByStepSolution: string[];
  finalAnswer: string;
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  rawContent: string;
  summary: string;
  simpleExplanation?: string;
  realWorldExamples?: string[];
  cornellNotes?: CornellNotes;
  keyTerms: NoteKeyTerm[];
  examQuestions: PracticeQuestion[];
  problems?: NoteProblem[];
  tags: string[];
  updatedAt: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  model?: string;
  studyRole?: StudyRole;
  attachedNoteId?: string;
  attachedNoteTitle?: string;
  practiceQuestions?: PracticeQuestion[];
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: ModelType;
  studyRole: StudyRole;
  attachedNoteId?: string;
}

export interface Flashcard {
  id: string;
  subject: string;
  front: string;
  back: string;
  difficulty?: 'easy' | 'good' | 'hard' | 'new';
  lastReviewed?: number;
}
