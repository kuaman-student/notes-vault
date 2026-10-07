import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { SecurityProvider, useSecurity } from './context/SecurityContext';
import { NotesProvider, useNotes } from './context/NotesContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import NoteReader from './components/notes/NoteReader';
import SearchModal from './components/search/SearchModal';
import NoteEditorModal from './components/editor/NoteEditorModal';
import FileUploadModal from './components/editor/FileUploadModal';
import DatabaseConfigModal from './components/database/DatabaseConfigModal';
import CategoryManagerModal from './components/categories/CategoryManagerModal';
import KnowledgeGraphModal from './components/graph/KnowledgeGraphModal';
import AICopilotModal from './components/ai/AICopilotModal';
import PomodoroTimerModal from './components/timer/PomodoroTimerModal';
import ScratchpadDrawer from './components/scratchpad/ScratchpadDrawer';
import CreateFolderModal from './components/folders/CreateFolderModal';
import VaultPinModal from './components/security/VaultPinModal';
import CloudSyncModal from './components/database/CloudSyncModal';
import QuizArenaModal from './components/quiz/QuizArenaModal';

function MainLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const {
    isSearchOpen,
    setIsSearchOpen,
    isEditorOpen,
    setIsEditorOpen,
    isUploadOpen,
    setIsUploadOpen,
    isDatabaseModalOpen,
    setIsDatabaseModalOpen,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    isFolderModalOpen,
    setIsFolderModalOpen,
    isGraphOpen,
    setIsGraphOpen,
    isAICopilotOpen,
    setIsAICopilotOpen,
    isPomodoroOpen,
    setIsPomodoroOpen,
    isCloudSyncOpen,
    setIsCloudSyncOpen,
    isQuizModalOpen,
    setIsQuizModalOpen,
    isLoading
  } = useNotes();

  const { isPinModalOpen, setIsPinModalOpen } = useSecurity();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading your knowledge base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navigation */}
      <Header
        isMobileSidebarOpen={isMobileSidebarOpen}
        setIsMobileSidebarOpen={setIsMobileSidebarOpen}
      />

      {/* Main Workspace (Sidebar + Reader) */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 overflow-y-auto">
          <NoteReader />
        </main>
      </div>

      {/* Floating Scratchpad HUD */}
      <ScratchpadDrawer />

      {/* Global Interactive Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />

      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />

      <DatabaseConfigModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <CreateFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
      />

      <KnowledgeGraphModal
        isOpen={isGraphOpen}
        onClose={() => setIsGraphOpen(false)}
      />

      <AICopilotModal
        isOpen={isAICopilotOpen}
        onClose={() => setIsAICopilotOpen(false)}
      />

      <PomodoroTimerModal
        isOpen={isPomodoroOpen}
        onClose={() => setIsPomodoroOpen(false)}
      />

      {/* Vault Master PIN Security Modal */}
      <VaultPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />

      {/* Firebase Cloud Sync & Security Rules Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncOpen}
        onClose={() => setIsCloudSyncOpen(false)}
      />

      {/* Multi-Note Quiz Arena & Exam Simulator Modal */}
      <QuizArenaModal
        isOpen={isQuizModalOpen}
        onClose={() => setIsQuizModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SecurityProvider>
        <NotesProvider>
          <MainLayout />
        </NotesProvider>
      </SecurityProvider>
    </ThemeProvider>
  );
}
