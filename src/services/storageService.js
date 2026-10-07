import { INITIAL_FOLDERS, INITIAL_NOTES } from '../data/initialNotes';

const DB_NAME = 'NexusNotesDB';
const DB_VERSION = 3;
const STORE_NOTES = 'notes';
const STORE_CATEGORIES = 'categories';
const STORE_FOLDERS = 'folders';

const LOCAL_STORAGE_NOTES = 'nexus_notes_data';
const LOCAL_STORAGE_CATEGORIES = 'nexus_categories_data';
const LOCAL_STORAGE_FOLDERS = 'nexus_folders_data';
const LOCAL_STORAGE_SCRATCHPAD = 'nexus_scratchpad_data';
const SETTINGS_KEY = 'nexus_notes_settings';

export const DEFAULT_CATEGORIES = [
  { id: 'cat-ai-everyone', name: 'AI FOR EVERYONE', icon: '🤖', color: '#14b8a6' }
];

// IndexedDB Helper
function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NOTES)) {
        db.createObjectStore(STORE_NOTES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CATEGORIES)) {
        db.createObjectStore(STORE_CATEGORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_FOLDERS)) {
        db.createObjectStore(STORE_FOLDERS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const StorageService = {
  // --- FOLDERS & SUBFOLDERS ---
  async getAllFolders() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_FOLDERS, 'readonly');
        const store = transaction.objectStore(STORE_FOLDERS);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          const local = localStorage.getItem(LOCAL_STORAGE_FOLDERS);
          resolve(local ? JSON.parse(local) : []);
        };
      });
    } catch {
      const local = localStorage.getItem(LOCAL_STORAGE_FOLDERS);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveAllFolders(folders) {
    try {
      localStorage.setItem(LOCAL_STORAGE_FOLDERS, JSON.stringify(folders));
    } catch (e) {
      console.warn('LocalStorage folders save failed:', e);
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_FOLDERS, 'readwrite');
      const store = transaction.objectStore(STORE_FOLDERS);
      await store.clear();
      folders.forEach((f) => store.put(f));
    } catch (e) {
      console.warn('IndexedDB folders save failed:', e);
    }
  },

  async createFolder(newFolder) {
    const folders = await this.getAllFolders();
    const folderObj = {
      id: newFolder.id || `folder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newFolder.name.trim(),
      parentId: newFolder.parentId || null, // null for root folder, id for subfolder
      icon: newFolder.icon || (newFolder.parentId ? '📂' : '📁'),
      color: newFolder.color || '#14b8a6',
      isExpanded: true,
      createdAt: new Date().toISOString()
    };
    const updated = [...folders, folderObj];
    await this.saveAllFolders(updated);
    return updated;
  },

  async deleteFolder(folderId) {
    const folders = await this.getAllFolders();
    // Find all subfolder IDs recursively
    const idsToDelete = new Set([folderId]);
    let added = true;
    while (added) {
      added = false;
      folders.forEach((f) => {
        if (f.parentId && idsToDelete.has(f.parentId) && !idsToDelete.has(f.id)) {
          idsToDelete.add(f.id);
          added = true;
        }
      });
    }

    const updatedFolders = folders.filter((f) => !idsToDelete.has(f.id));
    await this.saveAllFolders(updatedFolders);

    // Also unassign or remove folderId from notes in deleted folders
    const notes = await this.getAllNotes();
    const updatedNotes = notes.map((n) => {
      if (n.folderId && idsToDelete.has(n.folderId)) {
        return { ...n, folderId: null };
      }
      return n;
    });
    await this.saveAllNotes(updatedNotes);

    return { updatedFolders, updatedNotes };
  },

  async updateFolder(folderId, updatedData) {
    const folders = await this.getAllFolders();
    const updated = folders.map((f) => (f.id === folderId ? { ...f, ...updatedData } : f));
    await this.saveAllFolders(updated);
    return updated;
  },

  // --- CATEGORIES ---
  async getAllCategories() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_CATEGORIES, 'readonly');
        const store = transaction.objectStore(STORE_CATEGORIES);
        const request = store.getAll();

        request.onsuccess = () => {
          if (request.result && request.result.length > 0) {
            resolve(request.result);
          } else {
            const local = localStorage.getItem(LOCAL_STORAGE_CATEGORIES);
            const cats = local ? JSON.parse(local) : DEFAULT_CATEGORIES;
            this.saveAllCategories(cats);
            resolve(cats);
          }
        };

        request.onerror = () => {
          const local = localStorage.getItem(LOCAL_STORAGE_CATEGORIES);
          resolve(local ? JSON.parse(local) : DEFAULT_CATEGORIES);
        };
      });
    } catch {
      const local = localStorage.getItem(LOCAL_STORAGE_CATEGORIES);
      return local ? JSON.parse(local) : DEFAULT_CATEGORIES;
    }
  },

  async saveAllCategories(categories) {
    try {
      localStorage.setItem(LOCAL_STORAGE_CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.warn('LocalStorage categories save failed:', e);
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_CATEGORIES, 'readwrite');
      const store = transaction.objectStore(STORE_CATEGORIES);
      await store.clear();
      categories.forEach((cat) => store.put(cat));
    } catch (e) {
      console.warn('IndexedDB categories save failed:', e);
    }
  },

  async addCategory(newCategory) {
    const cats = await this.getAllCategories();
    const catObj = {
      id: newCategory.id || `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newCategory.name.trim(),
      icon: newCategory.icon || '📁',
      color: newCategory.color || '#14b8a6',
      description: newCategory.description || ''
    };
    const updated = [...cats, catObj];
    await this.saveAllCategories(updated);
    return updated;
  },

  async deleteCategory(categoryId) {
    const cats = await this.getAllCategories();
    const updated = cats.filter((c) => c.id !== categoryId);
    await this.saveAllCategories(updated);
    return updated;
  },

  async updateCategory(categoryId, updatedData) {
    const cats = await this.getAllCategories();
    const updated = cats.map((c) => (c.id === categoryId ? { ...c, ...updatedData } : c));
    await this.saveAllCategories(updated);
    return updated;
  },

  // --- NOTES ---
  async getAllNotes() {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORE_NOTES, 'readonly');
        const store = transaction.objectStore(STORE_NOTES);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };

        request.onerror = () => {
          const local = localStorage.getItem(LOCAL_STORAGE_NOTES);
          resolve(local ? JSON.parse(local) : []);
        };
      });
    } catch {
      const local = localStorage.getItem(LOCAL_STORAGE_NOTES);
      return local ? JSON.parse(local) : [];
    }
  },

  async clearAllNotesAndFolders() {
    try {
      localStorage.removeItem(LOCAL_STORAGE_NOTES);
      localStorage.removeItem(LOCAL_STORAGE_FOLDERS);
      const db = await openDB();
      const transaction = db.transaction([STORE_NOTES, STORE_FOLDERS], 'readwrite');
      transaction.objectStore(STORE_NOTES).clear();
      transaction.objectStore(STORE_FOLDERS).clear();
    } catch (e) {
      console.warn('Clear all notes/folders failed:', e);
    }
  },

  async saveAllNotes(notes) {
    try {
      localStorage.setItem(LOCAL_STORAGE_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    try {
      const db = await openDB();
      const transaction = db.transaction(STORE_NOTES, 'readwrite');
      const store = transaction.objectStore(STORE_NOTES);
      await store.clear();
      notes.forEach((note) => store.put(note));
    } catch (e) {
      console.warn('IndexedDB save failed:', e);
    }
  },

  async saveNote(note) {
    const notes = await this.getAllNotes();
    const existingIndex = notes.findIndex((n) => n.id === note.id);
    let updatedNotes;

    if (existingIndex >= 0) {
      updatedNotes = [...notes];
      updatedNotes[existingIndex] = { ...note, lastUpdated: new Date().toISOString().slice(0, 10) };
    } else {
      updatedNotes = [
        {
          ...note,
          id: note.id || `note-${Date.now()}`,
          folderId: note.folderId !== undefined ? note.folderId : null,
          category: note.category || 'General',
          lastUpdated: new Date().toISOString().slice(0, 10)
        },
        ...notes
      ];
    }

    await this.saveAllNotes(updatedNotes);
    return updatedNotes;
  },

  async deleteNote(noteId) {
    const notes = await this.getAllNotes();
    const updatedNotes = notes.filter((n) => n.id !== noteId);
    await this.saveAllNotes(updatedNotes);
    return updatedNotes;
  },

  // Reset to default
  async resetToDefaults() {
    await Promise.all([
      this.saveAllFolders(INITIAL_FOLDERS),
      this.saveAllNotes(INITIAL_NOTES)
    ]);
    return { folders: INITIAL_FOLDERS, notes: INITIAL_NOTES };
  },

  // --- SCRATCHPAD ---
  getScratchpad() {
    return localStorage.getItem(LOCAL_STORAGE_SCRATCHPAD) || '';
  },

  saveScratchpad(text) {
    localStorage.setItem(LOCAL_STORAGE_SCRATCHPAD, text);
  },

  // Export all notes, folders & categories as JSON
  exportAsJSON(notes, categories, folders) {
    const payload = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      folders: folders || [],
      categories: categories || [],
      notes: notes || []
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `NexusNotes_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Export single note as .md file
  exportAsMarkdown(note) {
    const mdContent = `---
title: "${note.title}"
folderId: "${note.folderId || ''}"
category: "${note.category || ''}"
tags: [${(note.tags || []).map((t) => `"${t}"`).join(', ')}]
difficulty: "${note.difficulty || 'Intermediate'}"
lastUpdated: "${note.lastUpdated || new Date().toISOString().slice(0, 10)}"
---

${note.content}
`;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    const sanitizedTitle = (note.title || 'untitled').toLowerCase().replace(/[^a-z0-9]/g, '-');
    downloadAnchor.setAttribute('download', `${sanitizedTitle}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  },

  // Parse Markdown File (supporting optional YAML frontmatter)
  parseMarkdownFile(filename, rawText, folderId = null, defaultCategory = 'General') {
    let title = filename.replace(/\.(md|markdown|txt)$/i, '');
    let category = defaultCategory;
    let targetFolderId = folderId;
    let tags = ['Imported'];
    let difficulty = 'Intermediate';
    let content = rawText;

    const frontmatterMatch = rawText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      content = frontmatterMatch[2].trim();

      const titleMatch = frontmatter.match(/title:\s*["']?(.*?)["']?$/m);
      if (titleMatch) title = titleMatch[1].trim();

      const folderMatch = frontmatter.match(/folderId:\s*["']?(.*?)["']?$/m);
      if (folderMatch && folderMatch[1].trim()) targetFolderId = folderMatch[1].trim();

      const catMatch = frontmatter.match(/category:\s*["']?(.*?)["']?$/m);
      if (catMatch) category = catMatch[1].trim();

      const diffMatch = frontmatter.match(/difficulty:\s*["']?(.*?)["']?$/m);
      if (diffMatch) difficulty = diffMatch[1].trim();

      const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/m);
      if (tagsMatch) {
        tags = tagsMatch[1].split(',').map((t) => t.replace(/["']/g, '').trim()).filter(Boolean);
      }
    } else {
      const h1Match = content.match(/^#\s+(.+)$/m);
      if (h1Match) {
        title = h1Match[1].trim();
      }
    }

    const wordCount = content.split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(wordCount / 200));

    return {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      folderId: targetFolderId,
      title,
      category,
      tags: tags.length > 0 ? tags : ['General'],
      difficulty,
      readTime: `${minutes} min read`,
      revisionStatus: 'need_revision',
      isBookmarked: false,
      lastUpdated: new Date().toISOString().slice(0, 10),
      summary: content.slice(0, 160).replace(/[#*`_>]/g, '').trim() + '...',
      content
    };
  },

  getSettings() {
    try {
      const settings = localStorage.getItem(SETTINGS_KEY);
      return settings ? JSON.parse(settings) : {
        enableCloudSync: false,
        firebaseConfig: { apiKey: '', projectId: '', appId: '' }
      };
    } catch {
      return { enableCloudSync: false };
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }
};
