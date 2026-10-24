import { Conversation, Flashcard, Note } from '../types/index.ts';

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-bio-1',
    title: 'Cellular Respiration & Glycolysis',
    subject: 'Biology',
    rawContent: `Cellular respiration converts glucose into ATP.
3 Main Stages:
1. Glycolysis:
   - Takes place in cytoplasm.
   - Anaerobic (no O2 required).
   - 1 Glucose (6C) -> 2 Pyruvate (3C).
   - Net gain: 2 ATP (via substrate-level phosphorylation) + 2 NADH.
2. Krebs Cycle (Citric Acid Cycle):
   - Mitochondrial matrix.
   - Acetyl-CoA oxidized, yields CO2, 6 NADH, 2 FADH2, 2 ATP per glucose.
3. Oxidative Phosphorylation (Electron Transport Chain):
   - Inner mitochondrial membrane (cristae).
   - NADH & FADH2 donate electrons to protein complexes.
   - H+ pumped into intermembrane space creating proton gradient.
   - ATP Synthase uses proton motive force (chemiosmosis) to generate ~28-34 ATP!
   - Oxygen is final electron acceptor, forming H2O.`,
    summary: 'Cellular respiration oxidizes glucose into cellular energy (ATP) across three stages: Glycolysis (cytoplasm), Krebs Cycle (matrix), and Oxidative Phosphorylation (cristae), generating roughly 30-32 ATP with oxygen as the terminal electron acceptor.',
    simpleExplanation: 'Think of cellular respiration as your body burning fuel (glucose) to charge tiny cellular batteries called ATP. Just like a power plant uses coal to spin turbines and send electricity into your home, your mitochondria use food and oxygen to spin ATP Synthase and power your muscles and brain.',
    realWorldExamples: [
      'The Hydroelectric Dam Analogy: Hydrogen ions (H+) are pumped across the inner membrane like water pumped behind a high dam. When the floodgates open, the rushing water spins a turbine (ATP Synthase) to produce electricity (ATP).',
      'The Sprinting Athlete: When you sprint 100 meters, your lungs cannot supply oxygen fast enough. Muscle cells switch temporarily to fermentation, creating lactate so you can still produce quick bursts of ATP without waiting for oxygen.',
    ],
    cornellNotes: {
      cues: [
        'Where does glycolysis occur?',
        'What is the net ATP yield of glycolysis?',
        'What is the final electron acceptor in the ETC?',
        'How does ATP synthase generate ATP?',
      ],
      notes: [
        'Glycolysis is anaerobic and occurs in the cytosol.',
        'Net yield is 2 ATP and 2 NADH per glucose molecule.',
        'Oxygen acts as the terminal electron acceptor, forming water.',
        'Proton motive force drives chemiosmosis through ATP synthase.',
      ],
      summary: 'High-yield exam takeaway: Know where each stage occurs, their net ATP/electron carrier outputs, and the critical role of oxygen in driving the proton gradient.',
    },
    keyTerms: [
      { term: 'Glycolysis', definition: 'The enzymatic breakdown of a glucose molecule into two pyruvate molecules in the cytosol.' },
      { term: 'Chemiosmosis', definition: 'The movement of ions across a semipermeable membrane down their electrochemical gradient to drive ATP synthesis.' },
      { term: 'Proton Motive Force', definition: 'Energy stored in the electrochemical gradient of protons across the inner mitochondrial membrane.' },
      { term: 'Substrate-Level Phosphorylation', definition: 'Direct transfer of a phosphate group to ADP from a phosphorylated metabolic intermediate.' },
    ],
    problems: [
      {
        id: 'bio-prob-1',
        title: 'Mitochondrial Cyanide Poisoning Scenario',
        scenario: 'A patient accidentally inhales a chemical compound that irreversibly binds and blocks Complex IV (cytochrome c oxidase) in the electron transport chain. Trace the cascade of cellular failures.',
        realWorldExample: 'Like putting a concrete barrier at the end of an assembly line. When the final worker cannot hand off their product, the entire line jams up immediately.',
        stepByStepSolution: [
          'Step 1: Electrons back up at Complex IV and can no longer be transferred to Oxygen.',
          'Step 2: Upstream electron carriers (Complex III, Complex I, NADH, FADH2) stay permanently reduced and cannot accept new electrons.',
          'Step 3: Proton pumping halts; the electrochemical proton gradient across the inner membrane collapses.',
          'Step 4: ATP Synthase stops rotating, and cellular ATP levels plunge within seconds.',
        ],
        finalAnswer: 'Electron flow halts, proton gradient collapses, and oxidative phosphorylation ceases, causing acute cellular energy starvation.',
      },
    ],
    examQuestions: [
      {
        id: 'bio-q1',
        question: 'If a poison blocks ATP synthase, what immediate change occurs in the mitochondrial intermembrane space?',
        type: 'mcq',
        options: [
          'Proton concentration increases and pH decreases',
          'Proton concentration decreases and pH increases',
          'ATP production doubles immediately',
          'Glycolysis stops instantaneously in the cytoplasm',
        ],
        correctAnswer: 0,
        explanation: 'Because electrons continue to pump protons into the intermembrane space without being drained through ATP synthase, H+ accumulates, lowering the pH (higher acidity).',
      },
      {
        id: 'bio-q2',
        question: 'Under anaerobic conditions in human muscle cells, what accepts electrons from NADH to regenerate NAD+?',
        type: 'mcq',
        options: ['Pyruvate (forming lactate)', 'Oxygen (forming water)', 'Carbon dioxide', 'Ethanol'],
        correctAnswer: 0,
        explanation: 'In lactic acid fermentation, pyruvate accepts electrons from NADH to produce lactate, thereby regenerating NAD+ needed to sustain glycolysis.',
      },
      {
        id: 'bio-q3',
        question: 'Which stage of cellular respiration produces the majority of ATP molecules?',
        type: 'mcq',
        options: [
          'Oxidative phosphorylation (ETC & chemiosmosis)',
          'Glycolysis',
          'Citric acid cycle',
          'Pyruvate oxidation',
        ],
        correctAnswer: 0,
        explanation: 'Oxidative phosphorylation produces approximately 28 to 32 ATP per glucose via the electron transport chain and ATP synthase.',
      },
    ],
    tags: ['biology', 'cellular respiration', 'atp', 'metabolism'],
    updatedAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: 'note-calc-1',
    title: 'Differential Calculus: Derivatives & Optimization',
    subject: 'Calculus',
    rawContent: `Derivative Rules:
1. Power Rule: d/dx [x^n] = n * x^(n-1)
2. Product Rule: (f * g)' = f' * g + f * g'
3. Quotient Rule: (f / g)' = (f' * g - f * g') / g^2
4. Chain Rule: d/dx [f(g(x))] = f'(g(x)) * g'(x)

Optimization Steps for Midterm Exams:
1. Draw a sketch and assign variables.
2. Formulate the primary objective equation (what you want to maximize or minimize).
3. Find constraint equation to reduce objective to 1 single independent variable.
4. Take the first derivative and set f'(x) = 0 to find critical points.
5. Verify max/min using First Derivative Test or Second Derivative Test (f''(x) < 0 => local maximum).`,
    summary: 'Master differentiation rules (power, product, quotient, chain rule) and follow the 5-step optimization protocol: set f\'(x)=0, test critical numbers, and verify endpoints against constraints.',
    cornellNotes: {
      cues: [
        'State the Chain Rule formula',
        'How do you confirm a critical point is a local maximum?',
        'What is the Quotient Rule mnemonic?',
      ],
      notes: [
        'Chain Rule: d/dx [f(g(x))] = f\'(g(x)) * g\'(x).',
        'Second Derivative Test: if f\'(c) = 0 and f\'\'(c) < 0, then f(c) is a local maximum (concave down).',
        'Quotient mnemonic: "Low d-High minus High d-Low, over the square of what\'s below".',
      ],
      summary: 'Optimization problems always hinge on writing a single-variable function, setting derivative to 0, and rigorously testing critical values on the domain.',
    },
    keyTerms: [
      { term: 'Critical Number', definition: 'A value c in the domain of f such that f\'(c) = 0 or f\'(c) is undefined.' },
      { term: 'Extreme Value Theorem', definition: 'If f is continuous on a closed interval [a, b], then f must attain an absolute maximum and minimum.' },
      { term: 'Inflection Point', definition: 'A point on a curve at which the concavity changes from upward to downward (or vice versa).' },
    ],
    examQuestions: [
      {
        id: 'calc-q1',
        question: 'Find the derivative of f(x) = (3x^2 + 1)^4.',
        type: 'mcq',
        options: [
          '24x(3x^2 + 1)^3',
          '4(3x^2 + 1)^3',
          '12x(3x^2 + 1)^3',
          '6x(3x^2 + 1)^4',
        ],
        correctAnswer: 0,
        explanation: 'Apply Chain Rule: f\'(x) = 4(3x^2 + 1)^3 * d/dx[3x^2 + 1] = 4(3x^2 + 1)^3 * (6x) = 24x(3x^2 + 1)^3.',
      },
      {
        id: 'calc-q2',
        question: 'If f\'(c) = 0 and f\'\'(c) = -5, what can you conclude about x = c?',
        type: 'mcq',
        options: [
          'f has a local maximum at x = c',
          'f has a local minimum at x = c',
          'f has an inflection point at x = c',
          'The test is inconclusive',
        ],
        correctAnswer: 0,
        explanation: 'By the Second Derivative Test, when the first derivative is zero and second derivative is strictly negative, the curve is concave down, creating a local maximum.',
      },
    ],
    tags: ['calculus', 'derivatives', 'optimization', 'math'],
    updatedAt: Date.now() - 1000 * 60 * 60 * 24,
  },
];

export const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: 'fc-1',
    subject: 'Biology',
    front: 'Where does Glycolysis take place in eukaryotic cells?',
    back: 'In the Cytoplasm (Cytosol). It does not require oxygen (anaerobic).',
    difficulty: 'easy',
  },
  {
    id: 'fc-2',
    subject: 'Biology',
    front: 'What is the role of Oxygen in the electron transport chain?',
    back: 'It acts as the Terminal Electron Acceptor, combining with electrons and protons to form H2O.',
    difficulty: 'good',
  },
  {
    id: 'fc-3',
    subject: 'Calculus',
    front: 'State the Product Rule for differentiation.',
    back: 'd/dx [f(x) * g(x)] = f\'(x) * g(x) + f(x) * g\'(x).',
    difficulty: 'good',
  },
  {
    id: 'fc-4',
    subject: 'Calculus',
    front: 'How do you determine if a critical point c is a maximum using the 2nd Derivative Test?',
    back: 'Calculate f\'\'(c). If f\'\'(c) < 0, the graph is concave down and c is a local maximum.',
    difficulty: 'easy',
  },
  {
    id: 'fc-5',
    subject: 'Computer Science',
    front: 'What is the average time complexity of QuickSort?',
    back: 'O(n log n). Worst case is O(n^2) when poor pivots are chosen.',
    difficulty: 'good',
  },
];

export const INITIAL_CONVERSATION: Conversation = {
  id: 'conv-welcome',
  title: 'Biology Exam: Cellular Respiration',
  createdAt: Date.now() - 1000 * 60 * 45,
  updatedAt: Date.now() - 1000 * 60 * 45,
  model: 'gemini-3.8-flash',
  studyRole: 'exam_coach',
  attachedNoteId: 'note-bio-1',
  messages: [
    {
      id: 'msg-1',
      role: 'user',
      content: 'Can you quiz me on Cellular Respiration and Glycolysis from my notes? Give me 2 tough multiple choice questions with explanations.',
      timestamp: Date.now() - 1000 * 60 * 44,
    },
    {
      id: 'msg-2',
      role: 'assistant',
      content: `### 🎯 Exam Coach: Cellular Respiration Practice Set

I reviewed your **Cellular Respiration & Glycolysis** notes. Here are two high-yield exam questions that professors frequently use on midterm exams:

---

**Question 1:**
A metabolic inhibitor prevents NADH from donating its high-energy electrons to Complex I of the electron transport chain. What will be the direct consequence?
A) The proton gradient across the inner mitochondrial membrane will decrease, diminishing ATP synthesis
B) Glycolysis will immediately accelerate by 500%
C) Oxygen consumption will increase dramatically
D) The mitochondrial matrix will become alkaline

*Correct Answer: A*
*Explanation: Inhibiting Complex I prevents electron flow, stopping the pumping of protons from the matrix to the intermembrane space. Without the electrochemical proton gradient, ATP Synthase cannot phosphorylate ADP into ATP.*

---

**Question 2:**
During high-intensity sprinting, human muscle cells deplete available oxygen. Why must pyruvate be converted into lactate during fermentation?
A) To regenerate NAD+ so that glycolysis can continue producing ATP
B) Because lactate yields more energy than glucose
C) To neutralize cellular lactic acidosis
D) To transport electrons into the nucleus

*Correct Answer: A*
*Explanation: Glycolysis requires NAD+ to accept electrons during the oxidation of glyceraldehyde-3-phosphate. Without oxygen to reoxidize NADH in the ETC, fermentation couples NADH oxidation to pyruvate reduction, regenerating vital NAD+.*

---

💡 **Next Step:** Select your answers right in the interactive quiz widget below, or let me know if you want to drill another topic!`,
      timestamp: Date.now() - 1000 * 60 * 43,
      practiceQuestions: [
        {
          id: 'chat-q1',
          question: 'A metabolic inhibitor prevents NADH from donating electrons to Complex I of the ETC. What is the direct consequence?',
          type: 'mcq',
          options: [
            'Proton gradient decreases, diminishing ATP synthesis',
            'Glycolysis immediately accelerates by 500%',
            'Oxygen consumption will increase dramatically',
            'The mitochondrial matrix will become alkaline',
          ],
          correctAnswer: 0,
          explanation: 'Inhibiting Complex I halts electron flow, stopping proton pumping and collapsing the gradient needed for ATP Synthase.',
        },
        {
          id: 'chat-q2',
          question: 'Under anaerobic muscle exertion, why must pyruvate be converted into lactate?',
          type: 'mcq',
          options: [
            'To regenerate NAD+ so glycolysis can continue producing ATP',
            'Because lactate yields more energy than glucose',
            'To neutralize cellular lactic acidosis',
            'To transport electrons into the nucleus',
          ],
          correctAnswer: 0,
          explanation: 'Fermentation re-oxidizes NADH to NAD+, allowing glycolysis to keep generating net 2 ATP per glucose under anaerobic conditions.',
        },
      ],
    },
  ],
};
