import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

// Default config provided by user with Vite env fallback
const defaultFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBv07bqr0SNNpMlTCMR4w56Tx_j452wR0Y',
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'notes-vault-dfc48'}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'notes-vault-dfc48',
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'notes-vault-dfc48'}.appspot.com`,
};

let app = null;
let db = null;
let isConfigured = false;

export function initFirebase(customConfig = null) {
  try {
    const config = customConfig || defaultFirebaseConfig;
    if (!config.apiKey || !config.projectId) {
      console.warn('Firebase: Missing apiKey or projectId');
      return null;
    }

    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }

    db = getFirestore(app);
    isConfigured = true;
    return { app, db };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return null;
  }
}

// Auto-initialize on module load
initFirebase();

export const FirebaseService = {
  isAvailable() {
    return !!db;
  },

  getDb() {
    if (!db) initFirebase();
    return db;
  },

  // Test connection to Firestore
  async testConnection() {
    try {
      const firestore = this.getDb();
      if (!firestore) return { success: false, error: 'Firebase not initialized' };
      const colRef = collection(firestore, '_healthcheck');
      await getDocs(colRef);
      return { success: true, projectId: defaultFirebaseConfig.projectId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // --- NOTES CLOUD SYNC ---
  async fetchNotes() {
    try {
      const firestore = this.getDb();
      if (!firestore) return [];
      const colRef = collection(firestore, 'notes');
      const snapshot = await getDocs(colRef);
      const notes = [];
      snapshot.forEach((docSnap) => {
        notes.push({ id: docSnap.id, ...docSnap.data() });
      });
      return notes;
    } catch (err) {
      console.warn('Firebase fetchNotes failed:', err);
      return [];
    }
  },

  async saveNote(note) {
    try {
      const firestore = this.getDb();
      if (!firestore || !note.id) return;
      const docRef = doc(firestore, 'notes', note.id);
      await setDoc(docRef, {
        ...note,
        cloudSyncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Firebase saveNote failed:', err);
    }
  },

  async deleteNote(noteId) {
    try {
      const firestore = this.getDb();
      if (!firestore || !noteId) return;
      const docRef = doc(firestore, 'notes', noteId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firebase deleteNote failed:', err);
    }
  },

  // --- FOLDERS CLOUD SYNC ---
  async fetchFolders() {
    try {
      const firestore = this.getDb();
      if (!firestore) return [];
      const colRef = collection(firestore, 'folders');
      const snapshot = await getDocs(colRef);
      const folders = [];
      snapshot.forEach((docSnap) => {
        folders.push({ id: docSnap.id, ...docSnap.data() });
      });
      return folders;
    } catch (err) {
      console.warn('Firebase fetchFolders failed:', err);
      return [];
    }
  },

  async saveFolder(folder) {
    try {
      const firestore = this.getDb();
      if (!firestore || !folder.id) return;
      const docRef = doc(firestore, 'folders', folder.id);
      await setDoc(docRef, {
        ...folder,
        cloudSyncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Firebase saveFolder failed:', err);
    }
  },

  async deleteFolder(folderId) {
    try {
      const firestore = this.getDb();
      if (!firestore || !folderId) return;
      const docRef = doc(firestore, 'folders', folderId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firebase deleteFolder failed:', err);
    }
  },

  // --- CATEGORIES CLOUD SYNC ---
  async fetchCategories() {
    try {
      const firestore = this.getDb();
      if (!firestore) return [];
      const colRef = collection(firestore, 'categories');
      const snapshot = await getDocs(colRef);
      const categories = [];
      snapshot.forEach((docSnap) => {
        categories.push({ id: docSnap.id, ...docSnap.data() });
      });
      return categories;
    } catch (err) {
      console.warn('Firebase fetchCategories failed:', err);
      return [];
    }
  },

  async saveCategory(category) {
    try {
      const firestore = this.getDb();
      if (!firestore || !category.id) return;
      const docRef = doc(firestore, 'categories', category.id);
      await setDoc(docRef, {
        ...category,
        cloudSyncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Firebase saveCategory failed:', err);
    }
  },

  async deleteCategory(categoryId) {
    try {
      const firestore = this.getDb();
      if (!firestore || !categoryId) return;
      const docRef = doc(firestore, 'categories', categoryId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firebase deleteCategory failed:', err);
    }
  },

  // Real-time snapshot listener for multi-device sync
  subscribeToNotes(callback) {
    try {
      const firestore = this.getDb();
      if (!firestore) return () => {};
      const colRef = collection(firestore, 'notes');
      return onSnapshot(colRef, (snapshot) => {
        const notes = [];
        snapshot.forEach((docSnap) => {
          notes.push({ id: docSnap.id, ...docSnap.data() });
        });
        callback(notes);
      }, (err) => {
        console.warn('Firestore onSnapshot listener notice:', err);
      });
    } catch (err) {
      console.warn('Failed to subscribe to notes:', err);
      return () => {};
    }
  },

  subscribeToFolders(callback) {
    try {
      const firestore = this.getDb();
      if (!firestore) return () => {};
      const colRef = collection(firestore, 'folders');
      return onSnapshot(colRef, (snapshot) => {
        const folders = [];
        snapshot.forEach((docSnap) => {
          folders.push({ id: docSnap.id, ...docSnap.data() });
        });
        callback(folders);
      }, (err) => {
        console.warn('Firestore folders onSnapshot notice:', err);
      });
    } catch (err) {
      console.warn('Failed to subscribe to folders:', err);
      return () => {};
    }
  }
};
