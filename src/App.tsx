import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Flashcard, Message, ModelType, Note, PracticeQuestion, StudyRole } from './types/index.ts';
import { INITIAL_CONVERSATION, INITIAL_FLASHCARDS, INITIAL_NOTES } from './data/seedData.ts';
import { Sidebar } from './components/Sidebar.tsx';
import { ChatArea } from './components/ChatArea.tsx';
import { NotesOrganizer } from './components/NotesOrganizer.tsx';
import { ExamArena } from './components/ExamArena.tsx';
import { FlashcardDeck } from './components/FlashcardDeck.tsx';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Persistent / State data
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem('studygemma_conversations');
      return saved ? JSON.parse(saved) : [INITIAL_CONVERSATION];
    } catch {
      return [INITIAL_CONVERSATION];
    }
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(
    conversations[0]?.id || INITIAL_CONVERSATION.id
  );

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem('studygemma_notes');
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  });

  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);

  const [flashcards, setFlashcards] = useState<Flashcard[]>(() => {
    try {
      const saved = localStorage.getItem('studygemma_flashcards');
      return saved ? JSON.parse(saved) : INITIAL_FLASHCARDS;
    } catch {
      return INITIAL_FLASHCARDS;
    }
  });

  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'exam' | 'flashcards'>('chat');
  const [arenaQuestions, setArenaQuestions] = useState<PracticeQuestion[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('studygemma_conversations', JSON.stringify(conversations));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem('studygemma_notes', JSON.stringify(notes));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [notes]);

  useEffect(() => {
    try {
      localStorage.setItem('studygemma_flashcards', JSON.stringify(flashcards));
    } catch (e) {
      console.warn('Storage save error:', e);
    }
  }, [flashcards]);

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || conversations[0];

  // 1. Send Message with SSE streaming support
  const handleSendMessage = async (content: string) => {
    if (!activeConversation) return;

    const userMsg: Message = {
      id: `msg-u-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const assistantMsgId = `msg-a-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      model: activeConversation.model,
      studyRole: activeConversation.studyRole,
    };

    // Update conversation with user message & placeholder assistant message
    const updatedMessages = [...activeConversation.messages, userMsg, assistantMsg];
    const isFirstUserMessage = activeConversation.messages.length === 0;
    const newTitle = isFirstUserMessage ? content.slice(0, 32).trim() + (content.length > 32 ? '...' : '') : activeConversation.title;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              title: newTitle,
              messages: updatedMessages,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    const attachedNote = notes.find((n) => n.id === activeConversation.attachedNoteId);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          messages: [...activeConversation.messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: activeConversation.model,
          studyRole: activeConversation.studyRole,
          attachedNoteContent: attachedNote ? attachedNote.rawContent || attachedNote.summary : '',
          subject: attachedNote?.subject || '',
          stream: true,
        }),
      });

      if (!response.ok) throw new Error('Chat API returned error');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.slice(6).trim();
              if (dataStr === '[DONE]') break;

              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  accumulatedText += parsed.text;
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === activeConversation.id
                        ? {
                            ...c,
                            messages: c.messages.map((m) =>
                              m.id === assistantMsgId ? { ...m, content: accumulatedText } : m
                            ),
                          }
                        : c
                    )
                  );
                }
              } catch {
                // Ignore SSE framing artifacts
              }
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream stopped by user');
      } else {
        console.error('Chat error:', err);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation.id
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          content:
                            m.content ||
                            '### 🎓 Study Assistant\n\nI was unable to complete the response. Please check your connection and try asking again!',
                        }
                      : m
                  ),
                }
              : c
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleNewChat = () => {
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Study Session',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'gemini-3.8-flash',
      studyRole: 'exam_coach',
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setActiveTab('chat');
  };

  const handleDeleteConversation = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    setConversations(remaining);
    if (activeConversationId === id) {
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  };

  const handleUpdateConversationModel = (model: ModelType) => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, model } : c))
    );
  };

  const handleUpdateConversationRole = (studyRole: StudyRole) => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, studyRole } : c))
    );
  };

  const handleAttachNote = (noteId?: string) => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, attachedNoteId: noteId } : c))
    );
  };

  const handleClearChat = () => {
    if (!activeConversation) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, messages: [] } : c))
    );
  };

  const handleSaveNote = (updatedNote: Note) => {
    setNotes((prev) => {
      const exists = prev.some((n) => n.id === updatedNote.id);
      if (exists) {
        return prev.map((n) => (n.id === updatedNote.id ? updatedNote : n));
      }
      return [updatedNote, ...prev];
    });
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeNoteId === id) {
      const nextNote = notes.find((n) => n.id !== id);
      setActiveNoteId(nextNote ? nextNote.id : null);
    }
  };

  const handlePracticeInArena = (questions: PracticeQuestion[]) => {
    setArenaQuestions(questions);
    setActiveTab('exam');
  };

  const handleSendToChat = (note: Note) => {
    const newConv: Conversation = {
      id: `conv-note-${Date.now()}`,
      title: `${note.subject}: ${note.title.slice(0, 20)}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'gemini-3.8-flash',
      studyRole: 'exam_coach',
      attachedNoteId: note.id,
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    setActiveTab('chat');
  };

  const handleSaveAsNote = (title: string, content: string, subject: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title,
      subject: subject || 'General Study',
      rawContent: content,
      summary: content.slice(0, 180) + '...',
      keyTerms: [],
      examQuestions: [],
      tags: ['chat-saved'],
      updatedAt: Date.now(),
    };
    handleSaveNote(newNote);
    setActiveNoteId(newNote.id);
    setActiveTab('notes');
  };

  const handleAddFlashcard = (card: Flashcard) => {
    setFlashcards((prev) => [card, ...prev]);
  };

  const handleUpdateFlashcard = (updated: Flashcard) => {
    setFlashcards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleUploadNoteFile = async (file: File) => {
    setIsStreaming(true);
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const reader = new FileReader();

    if (isPdf) {
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const res = await fetch('/api/upload-note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: reader.result,
              fileName: file.name,
              mimeType: 'application/pdf',
              subject: 'General Study',
            }),
          });
          const data = await res.json();
          const newNote: Note = {
            id: `note-${Date.now()}`,
            title: data.title || file.name.replace(/\.[^/.]+$/, ''),
            subject: data.subject || 'General Study',
            rawContent: `[Uploaded PDF: ${file.name}]`,
            summary: data.summary,
            simpleExplanation: data.simpleExplanation,
            realWorldExamples: data.realWorldExamples || [],
            cornellNotes: data.cornellNotes,
            keyTerms: data.keyTerms || [],
            problems: data.problems || [],
            examQuestions: data.examQuestions || [],
            tags: ['uploaded', 'pdf'],
            updatedAt: Date.now(),
          };
          handleSaveNote(newNote);
          handleAttachNote(newNote.id);

          const assistantMsg: Message = {
            id: `msg-a-${Date.now()}`,
            role: 'assistant',
            content: `### 📄 Uploaded & Structured: **${newNote.title}**\n\nI've extracted your lecture PDF and converted it into an easy-to-understand study guide:\n- 💡 **Simple Explanation & Real-World Analogies**\n- 📝 **Structured Cornell Notes**\n- 🧮 **${newNote.problems?.length || 0} Applied Problems with Step-by-Step Solutions**\n- 🎯 **${newNote.examQuestions?.length || 0} Practice Exam Questions**\n\nThis note is now **attached** to our study session. Try asking questions or click below to practice!`,
            timestamp: Date.now(),
            practiceQuestions: newNote.examQuestions,
          };

          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversation.id
                ? {
                    ...c,
                    attachedNoteId: newNote.id,
                    messages: [...c.messages, assistantMsg],
                    updatedAt: Date.now(),
                  }
                : c
            )
          );
        } catch (e) {
          console.error('PDF note upload error:', e);
        } finally {
          setIsStreaming(false);
        }
      };
    } else {
      reader.readAsText(file);
      reader.onload = async () => {
        try {
          const text = String(reader.result || '');
          const res = await fetch('/api/organize-notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rawText: text,
              subject: 'General Study',
            }),
          });
          const data = await res.json();
          const newNote: Note = {
            id: `note-${Date.now()}`,
            title: data.title || file.name.replace(/\.[^/.]+$/, ''),
            subject: data.subject || 'General Study',
            rawContent: text,
            summary: data.summary,
            simpleExplanation: data.simpleExplanation,
            realWorldExamples: data.realWorldExamples || [],
            cornellNotes: data.cornellNotes,
            keyTerms: data.keyTerms || [],
            problems: data.problems || [],
            examQuestions: data.examQuestions || [],
            tags: ['uploaded'],
            updatedAt: Date.now(),
          };
          handleSaveNote(newNote);
          handleAttachNote(newNote.id);

          const assistantMsg: Message = {
            id: `msg-a-${Date.now()}`,
            role: 'assistant',
            content: `### 📄 Uploaded & Structured: **${newNote.title}**\n\nI've analyzed your notes and created an intuitive study guide with real-world examples, problem scenarios, and ${newNote.examQuestions?.length || 0} exam questions. Ask me anything, or jump to the **Notes Organizer** to inspect the full breakdown!`,
            timestamp: Date.now(),
            practiceQuestions: newNote.examQuestions,
          };

          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConversation.id
                ? {
                    ...c,
                    attachedNoteId: newNote.id,
                    messages: [...c.messages, assistantMsg],
                    updatedAt: Date.now(),
                  }
                : c
            )
          );
        } catch (e) {
          console.error('Note upload error:', e);
        } finally {
          setIsStreaming(false);
        }
      };
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-neutral-900 font-sans antialiased">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
        notes={notes}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {activeTab === 'chat' && activeConversation && (
          <ChatArea
            conversation={activeConversation}
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
            isStreaming={isStreaming}
            notes={notes}
            onOpenNotes={() => setActiveTab('notes')}
            onSaveAsNote={handleSaveAsNote}
            onPracticeInArena={handlePracticeInArena}
            onUpdateConversationModel={handleUpdateConversationModel}
            onUpdateConversationRole={handleUpdateConversationRole}
            onAttachNote={handleAttachNote}
            onClearChat={handleClearChat}
            onUploadNoteFile={handleUploadNoteFile}
          />
        )}

        {activeTab === 'notes' && (
          <NotesOrganizer
            notes={notes}
            activeNoteId={activeNoteId}
            onSelectNote={(id) => setActiveNoteId(id)}
            onSaveNote={handleSaveNote}
            onDeleteNote={handleDeleteNote}
            onPracticeInArena={handlePracticeInArena}
            onSendToChat={handleSendToChat}
          />
        )}

        {activeTab === 'exam' && (
          <ExamArena
            initialQuestions={arenaQuestions}
            notes={notes}
            onSendToChatForReview={(prompt) => {
              handleNewChat();
              handleSendMessage(prompt);
            }}
          />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardDeck
            flashcards={flashcards}
            notes={notes}
            onAddFlashcard={handleAddFlashcard}
            onUpdateFlashcard={handleUpdateFlashcard}
            onGenerateFromNote={(note) => {
              if (note.keyTerms.length > 0) {
                const newCards: Flashcard[] = note.keyTerms.map((kt, i) => ({
                  id: `fc-gen-${Date.now()}-${i}`,
                  subject: note.subject,
                  front: kt.term,
                  back: kt.definition,
                  difficulty: 'new',
                }));
                setFlashcards((prev) => [...newCards, ...prev]);
              }
            }}
          />
        )}
      </main>
    </div>
  );
}
