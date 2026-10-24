import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQuizScore,
  groupConversationsByDate,
  filterNotesBySearch,
  parseGeneratedQuestions,
  formatAsCornellNote,
  buildSystemInstruction,
  parseGemmaQueryAnalysis,
  buildFallbackAuditAndSimpleNote,
} from './studyLogic.ts';
import { Conversation, Note, PracticeQuestion } from '../types/index.ts';

test('calculateQuizScore handles empty question array', () => {
  const result = calculateQuizScore([]);
  assert.equal(result.total, 0);
  assert.equal(result.percentage, 0);
  assert.equal(result.letterGrade, 'N/A');
});

test('calculateQuizScore calculates correct percentage and letter grades', () => {
  const sampleQuestions: PracticeQuestion[] = [
    {
      id: 'q1',
      question: 'What is mitochondria?',
      type: 'mcq',
      correctAnswer: 0,
      userResponse: 0,
      isCorrect: true,
      explanation: 'Powerhouse of the cell',
    },
    {
      id: 'q2',
      question: 'What is ribosome?',
      type: 'mcq',
      correctAnswer: 1,
      userResponse: 0,
      isCorrect: false,
      explanation: 'Synthesizes proteins',
    },
    {
      id: 'q3',
      question: 'Explain osmosis',
      type: 'open',
      correctAnswer: 'Water diffusion',
      userResponse: 'Diffusion of water across membrane',
      score: 85,
      explanation: 'Osmosis definition',
    },
  ];

  const result = calculateQuizScore(sampleQuestions);
  assert.equal(result.total, 3);
  assert.equal(result.answered, 3);
  assert.equal(result.correct, 2); // q1 correct + q3 score >= 70
  assert.equal(result.percentage, 67); // 2/3 = 66.666 -> 67
  assert.equal(result.letterGrade, 'D');

  // Test Grade A
  const perfectQuestions: PracticeQuestion[] = [
    {
      id: 'q1',
      question: 'Test',
      type: 'mcq',
      correctAnswer: 0,
      userResponse: 0,
      isCorrect: true,
      explanation: 'Ok',
    },
  ];
  const perfect = calculateQuizScore(perfectQuestions);
  assert.equal(perfect.percentage, 100);
  assert.equal(perfect.letterGrade, 'A');
});

test('groupConversationsByDate groups correctly into today, yesterday, last 7 days', () => {
  const now = new Date('2026-10-24T12:00:00Z').getTime();
  const oneHour = 60 * 60 * 1000;
  const oneDay = 24 * 60 * 60 * 1000;

  const convs: Conversation[] = [
    {
      id: 'c-today',
      title: 'Biology Exam Prep',
      messages: [],
      createdAt: now - oneHour,
      updatedAt: now - oneHour,
      model: 'gemini-3.8-flash',
      studyRole: 'exam_coach',
    },
    {
      id: 'c-yesterday',
      title: 'Calculus Limits',
      messages: [],
      createdAt: now - 26 * oneHour,
      updatedAt: now - 26 * oneHour,
      model: 'gemini-3.8-flash',
      studyRole: 'concept_explainer',
    },
    {
      id: 'c-7days',
      title: 'World War II Summary',
      messages: [],
      createdAt: now - 4 * oneDay,
      updatedAt: now - 4 * oneDay,
      model: 'gemini-3.1-flash-lite',
      studyRole: 'note_synthesizer',
    },
    {
      id: 'c-older',
      title: 'Intro to Algorithms',
      messages: [],
      createdAt: now - 15 * oneDay,
      updatedAt: now - 15 * oneDay,
      model: 'gemini-4-argon',
      studyRole: 'quizmaster',
    },
  ];

  const grouped = groupConversationsByDate(convs, now);
  assert.equal(grouped.today.length, 1);
  assert.equal(grouped.today[0].id, 'c-today');
  assert.equal(grouped.yesterday.length, 1);
  assert.equal(grouped.yesterday[0].id, 'c-yesterday');
  assert.equal(grouped.last7Days.length, 1);
  assert.equal(grouped.last7Days[0].id, 'c-7days');
  assert.equal(grouped.older.length, 1);
  assert.equal(grouped.older[0].id, 'c-older');
});

test('filterNotesBySearch filters by title, subject, and keywords', () => {
  const notes: Note[] = [
    {
      id: 'n1',
      title: 'Cellular Respiration',
      subject: 'Biology',
      rawContent: 'Glycolysis occurs in cytoplasm.',
      summary: 'ATP synthesis overview',
      keyTerms: [{ term: 'ATP', definition: 'Energy currency of cell' }],
      examQuestions: [],
      tags: ['bio', 'energy'],
      updatedAt: Date.now(),
    },
    {
      id: 'n2',
      title: 'Derivative Rules',
      subject: 'Calculus',
      rawContent: 'Power rule, product rule, quotient rule.',
      summary: 'Rules for differentiation',
      keyTerms: [{ term: 'Limit', definition: 'Approach value' }],
      examQuestions: [],
      tags: ['math', 'derivatives'],
      updatedAt: Date.now(),
    },
  ];

  // Subject filtering
  const bioOnly = filterNotesBySearch(notes, '', 'Biology');
  assert.equal(bioOnly.length, 1);
  assert.equal(bioOnly[0].id, 'n1');

  // Search by keyword
  const mathSearch = filterNotesBySearch(notes, 'power rule', 'all');
  assert.equal(mathSearch.length, 1);
  assert.equal(mathSearch[0].id, 'n2');

  // Search by term
  const atpSearch = filterNotesBySearch(notes, 'currency', '');
  assert.equal(atpSearch.length, 1);
  assert.equal(atpSearch[0].id, 'n1');
});

test('parseGeneratedQuestions parses JSON block format properly', () => {
  const jsonText = `Here are practice questions:
\`\`\`json
[
  {
    "question": "What is the primary product of photosynthesis?",
    "type": "mcq",
    "options": ["Glucose", "Carbon dioxide", "Nitrogen", "Methane"],
    "correctAnswer": 0,
    "explanation": "Plants synthesize glucose from CO2 and water using sunlight."
  }
]
\`\`\`
Good luck!`;

  const parsed = parseGeneratedQuestions(jsonText);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].question, 'What is the primary product of photosynthesis?');
  assert.equal(parsed[0].options?.length, 4);
  assert.equal(parsed[0].correctAnswer, 0);
});

test('formatAsCornellNote formats notes with cues and summary', () => {
  const sampleNote = `
Key Concept: Photosynthesis light reaction
- Chlorophyll absorbs photons in the thylakoid membrane.
- Water molecules are split producing oxygen.
Summary: Light reactions produce ATP and NADPH while releasing oxygen as a byproduct.
  `;

  const cornell = formatAsCornellNote(sampleNote);
  assert.ok(cornell.cues.length > 0);
  assert.ok(cornell.notes.length > 0);
  assert.ok(cornell.summary.includes('Light reactions'));
});

test('buildSystemInstruction integrates role and attached notes', () => {
  const prompt = buildSystemInstruction('exam_coach', 'Photosynthesis lecture notes', 'Biology');
  assert.ok(prompt.includes('Exam Preparation Coach'));
  assert.ok(prompt.includes('Biology'));
  assert.ok(prompt.includes('Photosynthesis lecture notes'));
});

test('parseGemmaQueryAnalysis extracts topic and cognitive level', () => {
  const sampleJson = `
\`\`\`json
{
  "topic": "Krebs Cycle NADH yield",
  "studentNeed": "Calculation confusion",
  "cognitiveLevel": "Analysis",
  "suggestedQuestions": ["How many NADH molecules are generated per turn of the cycle?"],
  "socraticHint": "Track carbon counts from Acetyl-CoA through oxaloacetate."
}
\`\`\`
`;
  const res = parseGemmaQueryAnalysis(sampleJson);
  assert.equal(res.topic, 'Krebs Cycle NADH yield');
  assert.equal(res.cognitiveLevel, 'Analysis');
  assert.equal(res.suggestedQuestions.length, 1);
  assert.ok(res.socraticHint.includes('Acetyl-CoA'));
});

test('buildFallbackAuditAndSimpleNote produces verified simple gemma note and questions', () => {
  const noteText = `Photosynthesis converts light into chemical energy.
Stage 1: Light-dependent reactions in thylakoid membranes.
Stage 2: Calvin Cycle in stroma fixes CO2 into sugars.`;
  const result = buildFallbackAuditAndSimpleNote(noteText, 'photosynthesis_lecture.txt', 'Biology');
  assert.ok(result.title.toLowerCase().includes('photosynthesis'));
  assert.equal(result.subject, 'Biology');
  assert.equal(result.accuracyCheck.isAccurate, true);
  assert.ok(result.simplifiedGemmaNote.coreMechanism.length > 10);
  assert.ok(result.simplifiedGemmaNote.simplifiedBullets.length > 0);
  assert.equal(result.examQuestions.length, 2);
});


