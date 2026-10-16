import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  updateDoc
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

// Default config provided by user with Vite env fallback
const defaultFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBv07bqr0SNNpMlTCMR4w56Tx_j452wR0Y',
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'notes-vault-dfc48'}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'notes-vault-dfc48',
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || 'notes-vault-dfc48'}.appspot.com`,
};

let app = null;
let db = null;
let auth = null;
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
    auth = getAuth(app);
    isConfigured = true;
    return { app, db, auth };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return null;
  }
}

// Auto-initialize on module load
initFirebase();

// Helper to normalize username into valid email for Firebase Auth
function normalizeEmailOrUsername(input) {
  const trimmed = (input || '').trim().toLowerCase();
  if (trimmed.includes('@')) {
    return trimmed;
  }
  // Convert username to internal email
  const cleanUser = trimmed.replace(/[^a-z0-9._-]/g, '');
  return `${cleanUser}@vault.internal`;
}

export const FirebaseService = {
  isAvailable() {
    return !!db;
  },

  getDb() {
    if (!db) initFirebase();
    return db;
  },

  getAuth() {
    if (!auth) initFirebase();
    return auth;
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

  // ==========================================
  // --- AUTHENTICATION & MULTI-USER ---
  // ==========================================

  // Google Sign-In Popup
  async loginWithGoogle() {
    const authInst = this.getAuth();
    if (!authInst) throw new Error('Auth not initialized');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(authInst, provider);
    const user = result.user;

    // Sync profile to users collection in Firestore
    await this.syncUserProfile(user);
    return user;
  },

  // Username or Email + Password Sign-In
  async loginWithEmailOrUsername(emailOrUsername, password) {
    const authInst = this.getAuth();
    if (!authInst) throw new Error('Auth not initialized');
    const email = normalizeEmailOrUsername(emailOrUsername);
    const result = await signInWithEmailAndPassword(authInst, email, password);
    await this.syncUserProfile(result.user);
    return result.user;
  },

  // Register with Email or Username + Password
  async registerWithEmailOrUsername(emailOrUsername, password, displayName) {
    const authInst = this.getAuth();
    if (!authInst) throw new Error('Auth not initialized');
    const email = normalizeEmailOrUsername(emailOrUsername);
    const name = displayName?.trim() || emailOrUsername.split('@')[0];
    const result = await createUserWithEmailAndPassword(authInst, email, password);
    const user = result.user;

    // Update display name
    await updateProfile(user, { displayName: name });
    await this.syncUserProfile(user, name);
    return user;
  },

  // Sign out
  async logoutUser() {
    const authInst = this.getAuth();
    if (authInst) {
      await signOut(authInst);
    }
  },

  // Listen to Auth State
  onAuthChange(callback) {
    const authInst = this.getAuth();
    if (!authInst) return () => {};
    return onAuthStateChanged(authInst, callback);
  },

  // Save/Update user profile document in Firestore
  async syncUserProfile(user, customName = null) {
    try {
      const firestore = this.getDb();
      if (!firestore || !user?.uid) return;
      const userRef = doc(firestore, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: customName || user.displayName || user.email?.split('@')[0] || 'Explorer',
        photoURL: user.photoURL || null,
        lastLoginAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Sync user profile notice:', err);
    }
  },

  // ==========================================
  // --- PER-USER PROGRESS (STATUS, BOOKMARKS) ---
  // ==========================================

  // Save user's personalized revision status & bookmark for a note
  async saveUserNoteProgress(userId, noteId, progressData) {
    try {
      const firestore = this.getDb();
      if (!firestore || !userId || !noteId) return;
      const progressRef = doc(firestore, 'userProgress', userId, 'notes', noteId);
      await setDoc(progressRef, {
        ...progressData,
        noteId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('saveUserNoteProgress notice:', err);
    }
  },

  // Fetch all note progress for a specific user
  async fetchUserProgress(userId) {
    try {
      const firestore = this.getDb();
      if (!firestore || !userId) return {};
      const colRef = collection(firestore, 'userProgress', userId, 'notes');
      const snap = await getDocs(colRef);
      const progressMap = {};
      snap.forEach((d) => {
        progressMap[d.id] = d.data();
      });
      return progressMap;
    } catch (err) {
      console.warn('fetchUserProgress notice:', err);
      return {};
    }
  },

  // Real-time listener for user progress
  subscribeToUserProgress(userId, callback) {
    try {
      const firestore = this.getDb();
      if (!firestore || !userId) return () => {};
      const colRef = collection(firestore, 'userProgress', userId, 'notes');
      return onSnapshot(colRef, (snap) => {
        const progressMap = {};
        snap.forEach((d) => {
          progressMap[d.id] = d.data();
        });
        callback(progressMap);
      });
    } catch {
      return () => {};
    }
  },

  // ==========================================
  // --- PER-USER QUIZZES ---
  // ==========================================

  async saveUserQuiz(userId, quiz) {
    try {
      const firestore = this.getDb();
      if (!firestore || !quiz.id) return;
      const docRef = doc(firestore, 'userQuizzes', userId || 'anonymous', 'attempts', quiz.id);
      await setDoc(docRef, {
        ...quiz,
        userId: userId || 'anonymous',
        cloudSyncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('saveUserQuiz notice:', err);
    }
  },

  async fetchUserQuizzes(userId) {
    try {
      const firestore = this.getDb();
      if (!firestore) return [];
      const colRef = collection(firestore, 'userQuizzes', userId || 'anonymous', 'attempts');
      const snap = await getDocs(colRef);
      const quizzes = [];
      snap.forEach((docSnap) => {
        quizzes.push({ id: docSnap.id, ...docSnap.data() });
      });
      return quizzes;
    } catch (err) {
      console.warn('fetchUserQuizzes notice:', err);
      return [];
    }
  },

  subscribeToUserQuizzes(userId, callback) {
    try {
      const firestore = this.getDb();
      if (!firestore) return () => {};
      const colRef = collection(firestore, 'userQuizzes', userId || 'anonymous', 'attempts');
      return onSnapshot(colRef, (snap) => {
        const quizzes = [];
        snap.forEach((docSnap) => {
          quizzes.push({ id: docSnap.id, ...docSnap.data() });
        });
        quizzes.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        callback(quizzes);
      }, (err) => {
        console.warn('subscribeToUserQuizzes notice:', err);
      });
    } catch {
      return () => {};
    }
  },

  async deleteUserQuiz(userId, quizId) {
    try {
      const firestore = this.getDb();
      if (!firestore || !quizId) return;
      const docRef = doc(firestore, 'userQuizzes', userId || 'anonymous', 'attempts', quizId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('deleteUserQuiz notice:', err);
    }
  },

  // ==========================================
  // --- DOUBTS & COMMUNITY DISCUSSION ---
  // ==========================================

  // Fetch doubts for a specific note
  async fetchDoubts(noteId) {
    try {
      const firestore = this.getDb();
      if (!firestore || !noteId) return [];
      const colRef = collection(firestore, 'doubts');
      const q = query(colRef, where('noteId', '==', noteId));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (err) {
      console.warn('fetchDoubts notice:', err);
      return [];
    }
  },

  // Real-time listener for doubts on a note
  subscribeToDoubts(noteId, callback) {
    try {
      const firestore = this.getDb();
      if (!firestore || !noteId) return () => {};
      const colRef = collection(firestore, 'doubts');
      const q = query(colRef, where('noteId', '==', noteId));
      return onSnapshot(q, (snap) => {
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        callback(list);
      }, (err) => {
        console.warn('subscribeToDoubts error:', err);
      });
    } catch {
      return () => {};
    }
  },

  // Post a new doubt
  async createDoubt(doubtData) {
    try {
      const firestore = this.getDb();
      if (!firestore) throw new Error('Firestore not initialized');
      const doubtId = doubtData.id || `doubt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const docRef = doc(firestore, 'doubts', doubtId);
      const nowIso = new Date().toISOString();
      const payload = {
        ...doubtData,
        id: doubtId,
        isResolved: false,
        replies: doubtData.replies || [],
        upvotes: 0,
        upvoters: [],
        timestamp: Date.now(),
        createdAt: nowIso
      };
      await setDoc(docRef, payload);
      return payload;
    } catch (err) {
      console.error('createDoubt error:', err);
      throw err;
    }
  },

  // Reply to an existing doubt
  async addReplyToDoubt(doubtId, replyData) {
    try {
      const firestore = this.getDb();
      if (!firestore || !doubtId) return;
      const docRef = doc(firestore, 'doubts', doubtId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) throw new Error('Doubt not found');

      const data = snap.data();
      const replies = data.replies || [];
      const newReply = {
        id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ...replyData,
        timestamp: Date.now(),
        createdAt: new Date().toISOString()
      };
      await updateDoc(docRef, {
        replies: [...replies, newReply]
      });
      return newReply;
    } catch (err) {
      console.error('addReplyToDoubt error:', err);
      throw err;
    }
  },

  // Toggle resolve status on a doubt
  async toggleResolveDoubt(doubtId, currentStatus) {
    try {
      const firestore = this.getDb();
      if (!firestore || !doubtId) return;
      const docRef = doc(firestore, 'doubts', doubtId);
      await updateDoc(docRef, {
        isResolved: !currentStatus
      });
    } catch (err) {
      console.warn('toggleResolveDoubt error:', err);
    }
  },

  // ==========================================
  // --- COMMUNITY NOTES CONTRIBUTION & APPROVAL ---
  // ==========================================

  // Submit note by student / normal user (sets status: 'pending_approval')
  async submitNoteContribution(noteData, user) {
    try {
      const firestore = this.getDb();
      if (!firestore) throw new Error('Firestore not initialized');
      const noteId = noteData.id || `contrib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const docRef = doc(firestore, 'notes', noteId);
      const nowIso = new Date().toISOString();
      const payload = {
        ...noteData,
        id: noteId,
        status: 'pending_approval',
        authorUid: user?.uid || 'guest',
        authorName: user?.displayName || user?.email?.split('@')[0] || 'Community Student',
        authorAvatar: user?.photoURL || null,
        submittedAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
        timestamp: Date.now()
      };
      await setDoc(docRef, payload);
      return payload;
    } catch (err) {
      console.error('submitNoteContribution error:', err);
      throw err;
    }
  },

  // Fetch notes waiting for admin approval
  async fetchPendingNotes() {
    try {
      const firestore = this.getDb();
      if (!firestore) return [];
      const colRef = collection(firestore, 'notes');
      const q = query(colRef, where('status', '==', 'pending_approval'));
      const snap = await getDocs(q);
      const pending = [];
      snap.forEach((d) => pending.push({ id: d.id, ...d.data() }));
      return pending;
    } catch (err) {
      console.warn('fetchPendingNotes notice:', err);
      return [];
    }
  },

  // Real-time listener for pending notes (for Admin Studio badge)
  subscribeToPendingNotes(callback) {
    try {
      const firestore = this.getDb();
      if (!firestore) return () => {};
      const colRef = collection(firestore, 'notes');
      const q = query(colRef, where('status', '==', 'pending_approval'));
      return onSnapshot(q, (snap) => {
        const pending = [];
        snap.forEach((d) => pending.push({ id: d.id, ...d.data() }));
        callback(pending);
      }, (err) => {
        console.warn('subscribeToPendingNotes notice:', err);
      });
    } catch {
      return () => {};
    }
  },

  // Admin approves a submitted note
  async approveNote(noteId) {
    try {
      const firestore = this.getDb();
      if (!firestore || !noteId) return;
      const docRef = doc(firestore, 'notes', noteId);
      await updateDoc(docRef, {
        status: 'approved',
        approvedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('approveNote error:', err);
      throw err;
    }
  },

  // Admin rejects or deletes a note
  async rejectNote(noteId) {
    try {
      const firestore = this.getDb();
      if (!firestore || !noteId) return;
      const docRef = doc(firestore, 'notes', noteId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('rejectNote error:', err);
      throw err;
    }
  },

  // ==========================================
  // --- CORE NOTES, FOLDERS & CATEGORIES ---
  // ==========================================

  // Fetch approved notes (and legacy notes without status)
  async fetchNotes() {
    try {
      const firestore = this.getDb();
      if (!firestore) return [];
      const colRef = collection(firestore, 'notes');
      const snapshot = await getDocs(colRef);
      const notes = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Include if approved or legacy (undefined status)
        if (!data.status || data.status === 'approved') {
          notes.push({ id: docSnap.id, ...data });
        }
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
      const nowIso = new Date().toISOString();
      await setDoc(docRef, {
        ...note,
        status: note.status || 'approved', // Notes added directly by admin are approved
        createdAt: note.createdAt || nowIso,
        updatedAt: note.updatedAt || nowIso,
        timestamp: note.timestamp || Date.now(),
        cloudSyncedAt: nowIso
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

  // Real-time listener for public notes
  subscribeToNotes(callback) {
    try {
      const firestore = this.getDb();
      if (!firestore) return () => {};
      const colRef = collection(firestore, 'notes');
      return onSnapshot(colRef, (snapshot) => {
        const liveNotes = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (!data.status || data.status === 'approved') {
            liveNotes.push({ id: docSnap.id, ...data });
          }
        });
        callback(liveNotes);
      }, (err) => {
        console.warn('Firestore notes onSnapshot notice:', err);
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
        const liveFolders = [];
        snapshot.forEach((docSnap) => {
          liveFolders.push({ id: docSnap.id, ...docSnap.data() });
        });
        callback(liveFolders);
      }, (err) => {
        console.warn('Firestore folders onSnapshot notice:', err);
      });
    } catch (err) {
      console.warn('Failed to subscribe to folders:', err);
      return () => {};
    }
  },

  // Global / Legacy quizzes sync
  async fetchQuizzes() {
    try {
      const firestore = this.getDb();
      if (!firestore) return [];
      const colRef = collection(firestore, 'quizzes');
      const snapshot = await getDocs(colRef);
      const quizzes = [];
      snapshot.forEach((docSnap) => {
        quizzes.push({ id: docSnap.id, ...docSnap.data() });
      });
      return quizzes;
    } catch (err) {
      console.warn('Firebase fetchQuizzes failed:', err);
      return [];
    }
  },

  async saveQuiz(quiz) {
    try {
      const firestore = this.getDb();
      if (!firestore || !quiz.id) return;
      const docRef = doc(firestore, 'quizzes', quiz.id);
      await setDoc(docRef, {
        ...quiz,
        cloudSyncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Firebase saveQuiz failed:', err);
    }
  },

  async deleteQuiz(quizId) {
    try {
      const firestore = this.getDb();
      if (!firestore || !quizId) return;
      const docRef = doc(firestore, 'quizzes', quizId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Firebase deleteQuiz failed:', err);
    }
  },

  subscribeToQuizzes(callback) {
    try {
      const firestore = this.getDb();
      if (!firestore) return () => {};
      const colRef = collection(firestore, 'quizzes');
      return onSnapshot(colRef, (snapshot) => {
        const quizzes = [];
        snapshot.forEach((docSnap) => {
          quizzes.push({ id: docSnap.id, ...docSnap.data() });
        });
        callback(quizzes);
      }, (err) => {
        console.warn('Firestore quizzes onSnapshot notice:', err);
      });
    } catch (err) {
      console.warn('Failed to subscribe to quizzes:', err);
      return () => {};
    }
  }
};
