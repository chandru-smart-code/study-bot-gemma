import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  BookOpen,
  GraduationCap,
  Layers,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  PanelLeftClose,
  PanelLeft,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react';
import { Conversation, Note } from '../types/index.ts';
import { groupConversationsByDate } from '../utils/studyLogic.ts';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  activeTab: 'chat' | 'notes' | 'exam' | 'flashcards';
  onChangeTab: (tab: 'chat' | 'notes' | 'exam' | 'flashcards') => void;
  notes: Note[];
  isOpen: boolean;
  onToggleOpen: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  activeTab,
  onChangeTab,
  notes,
  isOpen,
  onToggleOpen,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const { today, yesterday, last7Days, older } = groupConversationsByDate(filteredConversations);

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const saveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteConversation(id);
  };

  const renderConversationGroup = (title: string, list: Conversation[]) => {
    if (list.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5">
          {title}
        </h4>
        <div className="space-y-0.5">
          {list.map((conv) => {
            const isActive = activeTab === 'chat' && conv.id === activeConversationId;
            const isEditing = editingId === conv.id;

            return (
              <div
                key={conv.id}
                onClick={() => {
                  onChangeTab('chat');
                  onSelectConversation(conv.id);
                }}
                className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-neutral-200/90 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
              >
                {isEditing ? (
                  <form onSubmit={(e) => saveRename(conv.id, e)} className="flex items-center gap-1 w-full">
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      autoFocus
                      className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-0.5 text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                    />
                    <button
                      type="button"
                      onClick={(e) => saveRename(conv.id, e)}
                      className="p-1 hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      className="p-1 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                      <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'}`} />
                      <span className="truncate text-xs">{conv.title}</span>
                    </div>

                    <div className="hidden group-hover:flex items-center gap-1 shrink-0 ml-1">
                      <button
                        onClick={(e) => startRename(conv, e)}
                        className="p-1 rounded hover:bg-neutral-300/60 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                        title="Rename"
                        aria-label="Rename conversation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(conv.id, e)}
                        className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-neutral-500 hover:text-red-600 dark:hover:text-red-400"
                        title="Delete"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <div className="hidden md:flex flex-col items-center py-3 px-2 bg-[#f9f9f9] dark:bg-[#171717] border-r border-[#e5e5e5] dark:border-[#2f2f2f] w-14 shrink-0 justify-between">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onToggleOpen}
            className="p-2 rounded-lg hover:bg-[#ececec] dark:hover:bg-[#212121] text-neutral-600 dark:text-neutral-400 cursor-pointer"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <button
            onClick={onNewChat}
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
            title="New study chat"
            aria-label="New study chat"
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className="w-8 h-px bg-[#e5e5e5] dark:bg-[#2f2f2f] my-1" />
          <button
            onClick={() => onChangeTab('chat')}
            className={`p-2 rounded-lg cursor-pointer ${activeTab === 'chat' ? 'bg-[#ececec] dark:bg-[#212121] text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 hover:bg-[#ececec] dark:hover:bg-[#212121]'}`}
            title="Chat Assistant"
            aria-label="Chat Assistant"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={() => onChangeTab('notes')}
            className={`p-2 rounded-lg cursor-pointer ${activeTab === 'notes' ? 'bg-[#ececec] dark:bg-[#212121] text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 hover:bg-[#ececec] dark:hover:bg-[#212121]'}`}
            title="Notes Organizer"
            aria-label="Notes Organizer"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={() => onChangeTab('exam')}
            className={`p-2 rounded-lg cursor-pointer ${activeTab === 'exam' ? 'bg-[#ececec] dark:bg-[#212121] text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 hover:bg-[#ececec] dark:hover:bg-[#212121]'}`}
            title="Exam Arena"
            aria-label="Exam Arena"
          >
            <GraduationCap className="w-5 h-5" />
          </button>
          <button
            onClick={() => onChangeTab('flashcards')}
            className={`p-2 rounded-lg cursor-pointer ${activeTab === 'flashcards' ? 'bg-[#ececec] dark:bg-[#212121] text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 hover:bg-[#ececec] dark:hover:bg-[#212121]'}`}
            title="Flashcards"
            aria-label="Flashcards"
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-lg text-neutral-500 hover:bg-[#ececec] dark:hover:bg-[#212121] cursor-pointer"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-neutral-600" />}
        </button>
      </div>
    );
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 md:static flex flex-col w-64 md:w-72 bg-[#f9f9f9] dark:bg-[#171717] border-r border-[#e5e5e5] dark:border-[#2f2f2f] transition-all duration-200 shrink-0 select-none shadow-xl md:shadow-none`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-[#e5e5e5] dark:border-[#2f2f2f]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm font-bold text-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 leading-tight">
              StudyGemma
            </h1>
            <span className="text-[10px] text-neutral-500 dark:text-neutral-400 block font-mono">
              Exam Prep & Notes AI
            </span>
          </div>
        </div>

        <button
          onClick={onToggleOpen}
          className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 cursor-pointer"
          title="Collapse sidebar"
          aria-label="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={() => {
            onChangeTab('chat');
            onNewChat();
          }}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Study Chat
          </span>
          <span className="text-[10px] bg-emerald-700/60 px-1.5 py-0.5 rounded font-mono">
            Ctrl+K
          </span>
        </button>
      </div>

      {/* Navigation Modes */}
      <div className="px-3 pb-2 space-y-1">
        <button
          onClick={() => onChangeTab('chat')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition ${
            activeTab === 'chat'
              ? 'bg-neutral-200 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4" />
            Study Chatbot
          </span>
        </button>

        <button
          onClick={() => onChangeTab('notes')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition ${
            activeTab === 'notes'
              ? 'bg-neutral-200 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4" />
            Notes Organizer
          </span>
          <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded-full text-neutral-600 dark:text-neutral-400">
            {notes.length}
          </span>
        </button>

        <button
          onClick={() => onChangeTab('exam')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition ${
            activeTab === 'exam'
              ? 'bg-neutral-200 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <GraduationCap className="w-4 h-4" />
            Exam Arena
          </span>
          <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
            Mock Tests
          </span>
        </button>

        <button
          onClick={() => onChangeTab('flashcards')}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition ${
            activeTab === 'flashcards'
              ? 'bg-neutral-200 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/50'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Layers className="w-4 h-4" />
            Flashcard Drills
          </span>
        </button>
      </div>

      <div className="mx-3 my-1 border-t border-neutral-200 dark:border-neutral-800" />

      {/* Chat History Search */}
      <div className="px-3 py-1.5">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800/70 text-xs text-neutral-500">
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search study history..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 text-xs w-full"
          />
        </div>
      </div>

      {/* Conversation Thread History */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 text-xs px-3">
            No study sessions yet. Click "New Study Chat" to begin!
          </div>
        ) : (
          <>
            {renderConversationGroup('Today', today)}
            {renderConversationGroup('Yesterday', yesterday)}
            {renderConversationGroup('Previous 7 Days', last7Days)}
            {renderConversationGroup('Older', older)}
          </>
        )}
      </div>

      {/* User & Settings Footer */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-semibold flex items-center justify-center text-xs">
              S
            </div>
            <div className="truncate">
              <span className="block text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                Student Workspace
              </span>
              <span className="block text-[10px] text-neutral-400">
                Exam Mode Active
              </span>
            </div>
          </div>

          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-md text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition cursor-pointer"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
