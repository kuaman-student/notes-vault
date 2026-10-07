import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { StorageService, DEFAULT_CATEGORIES } from '../services/storageService';
import { FirebaseService } from '../services/firebaseService';
import { INITIAL_FOLDERS, INITIAL_NOTES } from '../data/initialNotes';
import confetti from 'canvas-confetti';

const NotesContext = createContext();

export function NotesProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [folders, setFolders] = useState(INITIAL_FOLDERS);
  const [quizzes, setQuizzes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('connecting'); // 'synced', 'syncing', 'error'

  // View Mode: 'tree' (branch-wise folder tree matching screenshot) or 'list'
  const [sidebarViewMode, setSidebarViewMode] = useState('tree');

  // Filters & Active Selection
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTag, setSelectedTag] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'mastered', 'need_revision', 'bookmarked'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Tools
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderModalParentId, setFolderModalParentId] = useState(null);
  const [isGraphOpen, setIsGraphOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizSelectedNoteIds, setQuizSelectedNoteIds] = useState([]);
  const [scratchpadText, setScratchpadText] = useState(() => StorageService.getScratchpad());

  const [editingNote, setEditingNote] = useState(null);

  // Load notes, folders & categories on mount with Firebase Cloud sync
  useEffect(() => {
    let unsubscribeNotes = () => {};
    let unsubscribeFolders = () => {};
    let unsubscribeQuizzes = () => {};

    async function loadData() {
      setIsLoading(true);
      try {
        // Clean wipe previous default dummy notes so user starts with a completely blank canvas
        if (!localStorage.getItem('nexus_empty_notes_flag_v2')) {
          await StorageService.clearAllNotesAndFolders();
          localStorage.setItem('nexus_empty_notes_flag_v2', 'true');
        }

        // 1. Instant local IndexedDB load (0ms latency)
        const [loadedCats, loadedFolders, loadedNotes, loadedQuizzes] = await Promise.all([
          StorageService.getAllCategories(),
          StorageService.getAllFolders(),
          StorageService.getAllNotes(),
          StorageService.getAllQuizzes()
        ]);

        setCategories(loadedCats.length > 0 ? loadedCats : DEFAULT_CATEGORIES);
        setFolders(loadedFolders || []);
        setNotes(loadedNotes || []);
        setQuizzes(loadedQuizzes || []);

        if (loadedNotes && loadedNotes.length > 0) {
          setSelectedNoteId(loadedNotes[0].id);
        }

        // 2. Asynchronous Cloud Fetch from Firebase (notes-vault-dfc48)
        try {
          setCloudSyncStatus('syncing');
          const [cloudNotes, cloudFolders, cloudCategories, cloudQuizzes] = await Promise.all([
            FirebaseService.fetchNotes(),
            FirebaseService.fetchFolders(),
            FirebaseService.fetchCategories(),
            FirebaseService.fetchQuizzes()
          ]);

          if (cloudNotes && cloudNotes.length > 0) {
            setNotes(cloudNotes);
            await StorageService.saveAllNotes(cloudNotes);
            setSelectedNoteId((prev) => prev || cloudNotes[0]?.id || null);
          }
          if (cloudFolders && cloudFolders.length > 0) {
            setFolders(cloudFolders);
            await StorageService.saveAllFolders(cloudFolders);
          }
          if (cloudCategories && cloudCategories.length > 0) {
            setCategories(cloudCategories);
            await StorageService.saveAllCategories(cloudCategories);
          }
          if (cloudQuizzes && cloudQuizzes.length > 0) {
            setQuizzes(cloudQuizzes);
            await StorageService.saveAllQuizzes(cloudQuizzes);
          }

          setCloudSyncStatus('synced');
        } catch (cloudErr) {
          console.warn('Firebase initial cloud fetch notice:', cloudErr);
          setCloudSyncStatus('error');
        }

        // 3. Real-time Firebase listeners for live multi-device sync
        unsubscribeNotes = FirebaseService.subscribeToNotes((liveNotes) => {
          if (liveNotes && liveNotes.length > 0) {
            setNotes(liveNotes);
            StorageService.saveAllNotes(liveNotes);
          }
        });

        unsubscribeFolders = FirebaseService.subscribeToFolders((liveFolders) => {
          if (liveFolders && liveFolders.length > 0) {
            setFolders(liveFolders);
            StorageService.saveAllFolders(liveFolders);
          }
        });

        unsubscribeQuizzes = FirebaseService.subscribeToQuizzes((liveQuizzes) => {
          if (liveQuizzes && liveQuizzes.length > 0) {
            setQuizzes(liveQuizzes);
            StorageService.saveAllQuizzes(liveQuizzes);
          }
        });
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    return () => {
      unsubscribeNotes();
      unsubscribeFolders();
      unsubscribeQuizzes();
    };
  }, []);

  // Sync scratchpad
  const updateScratchpad = (text) => {
    setScratchpadText(text);
    StorageService.saveScratchpad(text);
  };

  // Compute active note
  const activeNote = useMemo(() => {
    if (!notes.length) return null;
    return notes.find((n) => n.id === selectedNoteId) || notes[0];
  }, [notes, selectedNoteId]);

  // Compute all available tags
  const allTags = useMemo(() => {
    const tagSet = new Set();
    notes.forEach((n) => {
      if (Array.isArray(n.tags)) {
        n.tags.forEach((t) => tagSet.add(t));
      }
    });
    return Array.from(tagSet);
  }, [notes]);

  // Filtered notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Folder filter
      if (selectedFolderId && note.folderId !== selectedFolderId) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All' && note.category !== selectedCategory) {
        return false;
      }

      // Tag filter
      if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) {
        return false;
      }

      // Status filter
      if (statusFilter === 'bookmarked' && !note.isBookmarked) {
        return false;
      }
      if (statusFilter === 'mastered' && note.revisionStatus !== 'mastered') {
        return false;
      }
      if (statusFilter === 'need_revision' && note.revisionStatus !== 'need_revision') {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = (note.title || '').toLowerCase().includes(q);
        const matchesContent = (note.content || '').toLowerCase().includes(q);
        const matchesCategory = (note.category || '').toLowerCase().includes(q);
        const matchesTag = note.tags && note.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesCategory && !matchesTag) {
          return false;
        }
      }

      return true;
    });
  }, [notes, selectedFolderId, selectedCategory, selectedTag, statusFilter, searchQuery]);

  // Manual 1-click cloud sync
  const syncCloudData = async () => {
    setCloudSyncStatus('syncing');
    try {
      // Fetch latest cloud data
      const [cloudNotes, cloudFolders, cloudCategories] = await Promise.all([
        FirebaseService.fetchNotes(),
        FirebaseService.fetchFolders(),
        FirebaseService.fetchCategories()
      ]);

      // If cloud is empty but local has notes, upload local to cloud!
      if (cloudNotes.length === 0 && notes.length > 0) {
        for (const n of notes) {
          await FirebaseService.saveNote(n);
        }
      } else if (cloudNotes.length > 0) {
        setNotes(cloudNotes);
        await StorageService.saveAllNotes(cloudNotes);
      }

      if (cloudFolders.length === 0 && folders.length > 0) {
        for (const f of folders) {
          await FirebaseService.saveFolder(f);
        }
      } else if (cloudFolders.length > 0) {
        setFolders(cloudFolders);
        await StorageService.saveAllFolders(cloudFolders);
      }

      setCloudSyncStatus('synced');
      return true;
    } catch (e) {
      setCloudSyncStatus('error');
      throw e;
    }
  };

  // --- FOLDERS HANDLERS ---
  const createFolder = async (folderData) => {
    const updated = await StorageService.createFolder(folderData);
    setFolders(updated);
    setIsFolderModalOpen(false);

    // Sync newly created folder to Firebase Cloud
    const createdFolder = updated[updated.length - 1];
    if (createdFolder) {
      FirebaseService.saveFolder(createdFolder);
    }

    return updated;
  };

  const deleteFolder = async (folderId) => {
    const { updatedFolders, updatedNotes } = await StorageService.deleteFolder(folderId);
    setFolders(updatedFolders);
    setNotes(updatedNotes);
    if (selectedFolderId === folderId) setSelectedFolderId(null);

    // Delete in Firebase Cloud
    FirebaseService.deleteFolder(folderId);
  };

  const updateFolder = async (folderId, data) => {
    const updated = await StorageService.updateFolder(folderId, data);
    setFolders(updated);
    const target = updated.find((f) => f.id === folderId);
    if (target) {
      FirebaseService.saveFolder(target);
    }
  };

  const toggleFolderExpansion = (folderId) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f))
    );
  };

  const expandAllFolders = () => {
    setFolders((prev) => prev.map((f) => ({ ...f, isExpanded: true })));
  };

  const collapseAllFolders = () => {
    setFolders((prev) => prev.map((f) => ({ ...f, isExpanded: false })));
  };

  // Helper: Get Breadcrumb path for a folderId
  const getFolderPath = (folderId) => {
    if (!folderId) return [];
    const path = [];
    let curr = folders.find((f) => f.id === folderId);
    while (curr) {
      path.unshift(curr);
      curr = curr.parentId ? folders.find((f) => f.id === curr.parentId) : null;
    }
    return path;
  };

  // --- CATEGORIES HANDLERS ---
  const addCategory = async (newCat) => {
    const updated = await StorageService.addCategory(newCat);
    setCategories(updated);
    const created = updated[updated.length - 1];
    if (created) {
      FirebaseService.saveCategory(created);
    }
    return updated;
  };

  const deleteCategory = async (catId) => {
    const targetCat = categories.find((c) => c.id === catId);
    if (!targetCat) return;

    const updatedCats = await StorageService.deleteCategory(catId);
    setCategories(updatedCats);

    if (selectedCategory === targetCat.name) {
      setSelectedCategory('All');
    }

    const updatedNotes = notes.map((n) =>
      n.category === targetCat.name ? { ...n, category: 'General' } : n
    );
    await StorageService.saveAllNotes(updatedNotes);
    setNotes(updatedNotes);

    FirebaseService.deleteCategory(catId);
  };

  const updateCategory = async (catId, data) => {
    const updatedCats = await StorageService.updateCategory(catId, data);
    setCategories(updatedCats);
    const target = updatedCats.find((c) => c.id === catId);
    if (target) {
      FirebaseService.saveCategory(target);
    }
  };

  // --- NOTES HANDLERS ---
  const saveNote = async (noteData) => {
    const updatedNotes = await StorageService.saveNote(noteData);
    setNotes(updatedNotes);
    setSelectedNoteId(noteData.id || updatedNotes[0].id);
    setEditingNote(null);
    setIsEditorOpen(false);

    // Sync to Firebase Cloud
    const savedTarget = updatedNotes.find((n) => n.id === (noteData.id || updatedNotes[0].id));
    if (savedTarget) {
      FirebaseService.saveNote(savedTarget);
    }
  };

  const deleteNote = async (noteId) => {
    const updatedNotes = await StorageService.deleteNote(noteId);
    setNotes(updatedNotes);
    if (selectedNoteId === noteId) {
      setSelectedNoteId(updatedNotes[0]?.id || null);
    }

    // Delete in Firebase Cloud
    FirebaseService.deleteNote(noteId);
  };

  const toggleBookmark = async (noteId) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;
    const updated = { ...target, isBookmarked: !target.isBookmarked };
    await saveNote(updated);
  };

  const updateRevisionStatus = async (noteId, status) => {
    const target = notes.find((n) => n.id === noteId);
    if (!target) return;

    if (status === 'mastered') {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 }
        });
      } catch {}
    }

    const updated = { ...target, revisionStatus: status };
    await saveNote(updated);
  };

  // Import single/multiple Markdown files
  const importMarkdownFiles = async (files, targetFolderId = null, defaultCategory = 'General') => {
    const newNotes = [];
    for (const file of files) {
      const text = await file.text();
      const parsed = StorageService.parseMarkdownFile(file.name, text, targetFolderId, defaultCategory);
      newNotes.push(parsed);
      // Sync each imported file to Firebase Cloud
      FirebaseService.saveNote(parsed);
    }

    const combined = [...newNotes, ...notes];
    await StorageService.saveAllNotes(combined);
    setNotes(combined);
    if (newNotes.length > 0) {
      setSelectedNoteId(newNotes[0].id);
    }
    return newNotes.length;
  };

  // Import JSON backup
  const importJSONBackup = async (file) => {
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.notes && Array.isArray(data.notes)) {
      await StorageService.saveAllNotes(data.notes);
      setNotes(data.notes);
      if (data.folders && Array.isArray(data.folders)) {
        await StorageService.saveAllFolders(data.folders);
        setFolders(data.folders);
      }
      if (data.categories && Array.isArray(data.categories)) {
        await StorageService.saveAllCategories(data.categories);
        setCategories(data.categories);
      }
      if (data.notes.length > 0) setSelectedNoteId(data.notes[0].id);

      // Push backup notes to cloud
      for (const n of data.notes) {
        FirebaseService.saveNote(n);
      }
      return data.notes.length;
    } else if (Array.isArray(data)) {
      await StorageService.saveAllNotes(data);
      setNotes(data);
      if (data.length > 0) setSelectedNoteId(data[0].id);
      for (const n of data) {
        FirebaseService.saveNote(n);
      }
      return data.length;
    }
    throw new Error('Invalid JSON format');
  };

  // Clear all notes and folders for clean slate
  const clearAllNotes = async () => {
    // Delete in cloud
    for (const n of notes) {
      FirebaseService.deleteNote(n.id);
    }
    for (const f of folders) {
      FirebaseService.deleteFolder(f.id);
    }
    await StorageService.clearAllNotesAndFolders();
    setNotes([]);
    setFolders([]);
    setSelectedNoteId(null);
  };

  // Export full JSON
  const exportAllJSON = () => {
    StorageService.exportAsJSON(notes, categories, folders);
  };

  // --- QUIZ & EXAM ARENA HANDLERS ---
  const saveQuizAttempt = async (quizData) => {
    const updated = await StorageService.saveQuiz(quizData);
    setQuizzes(updated);
    FirebaseService.saveQuiz(quizData);
    return updated;
  };

  const deleteQuizAttempt = async (quizId) => {
    const updated = await StorageService.deleteQuiz(quizId);
    setQuizzes(updated);
    FirebaseService.deleteQuiz(quizId);
    return updated;
  };

  const clearAllQuizAttempts = async () => {
    for (const q of quizzes) {
      FirebaseService.deleteQuiz(q.id);
    }
    await StorageService.clearAllQuizzes();
    setQuizzes([]);
  };

  const openQuizForNote = (noteId) => {
    setQuizSelectedNoteIds([noteId]);
    setIsQuizModalOpen(true);
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        filteredNotes,
        folders,
        categories,
        quizzes,
        isLoading,
        cloudSyncStatus,
        activeNote,
        selectedNoteId,
        setSelectedNoteId,
        selectedFolderId,
        setSelectedFolderId,
        selectedCategory,
        setSelectedCategory,
        selectedTag,
        setSelectedTag,
        statusFilter,
        setStatusFilter,
        searchQuery,
        setSearchQuery,
        allTags,
        sidebarViewMode,
        setSidebarViewMode,
        // Cloud Sync
        syncCloudData,
        isCloudSyncOpen,
        setIsCloudSyncOpen,
        // Quiz & Exam Arena
        isQuizModalOpen,
        setIsQuizModalOpen,
        quizSelectedNoteIds,
        setQuizSelectedNoteIds,
        saveQuizAttempt,
        deleteQuizAttempt,
        clearAllQuizAttempts,
        openQuizForNote,
        // Folder handlers
        createFolder,
        deleteFolder,
        updateFolder,
        toggleFolderExpansion,
        expandAllFolders,
        collapseAllFolders,
        getFolderPath,
        isFolderModalOpen,
        setIsFolderModalOpen,
        folderModalParentId,
        setFolderModalParentId,
        // Category handlers
        addCategory,
        deleteCategory,
        updateCategory,
        // Notes handlers
        saveNote,
        deleteNote,
        toggleBookmark,
        updateRevisionStatus,
        importMarkdownFiles,
        importJSONBackup,
        exportAllJSON,
        clearAllNotes,
        // Scratchpad
        scratchpadText,
        updateScratchpad,
        isScratchpadOpen,
        setIsScratchpadOpen,
        // Modals & Tools
        isSearchOpen,
        setIsSearchOpen,
        isEditorOpen,
        setIsEditorOpen,
        isUploadOpen,
        setIsUploadOpen,
        isZenMode,
        setIsZenMode,
        isFlashcardsOpen,
        setIsFlashcardsOpen,
        isDatabaseModalOpen,
        setIsDatabaseModalOpen,
        isCategoryModalOpen,
        setIsCategoryModalOpen,
        isGraphOpen,
        setIsGraphOpen,
        isAICopilotOpen,
        setIsAICopilotOpen,
        isPomodoroOpen,
        setIsPomodoroOpen,
        editingNote,
        setEditingNote,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);
