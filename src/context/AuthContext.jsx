import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseService } from '../services/firebaseService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nexus_local_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authError, setAuthError] = useState('');
  const [hasConfigError, setHasConfigError] = useState(false);

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = FirebaseService.onAuthChange((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        localStorage.removeItem('nexus_local_user');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setAuthError('');
    setHasConfigError(false);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthError('');
    setHasConfigError(false);
  };

  const handleAuthError = (err) => {
    console.error('Auth error:', err);
    if (
      err.code === 'auth/configuration-not-found' ||
      err.message?.includes('configuration-not-found') ||
      err.message?.includes('CONFIGURATION_NOT_FOUND')
    ) {
      setHasConfigError(true);
      setAuthError('Firebase Authentication is not yet enabled in your Firebase Console.');
    } else if (err.code === 'auth/popup-closed-by-user') {
      setAuthError('Sign-in popup was closed.');
    } else if (err.code === 'auth/popup-blocked') {
      setAuthError('Sign-in popup was blocked by browser. Please allow popups.');
    } else if (
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/wrong-password'
    ) {
      setAuthError('Invalid username/email or password.');
    } else if (err.code === 'auth/email-already-in-use') {
      setAuthError('This email/username is already registered.');
    } else if (err.code === 'auth/weak-password') {
      setAuthError('Password must be at least 6 characters.');
    } else {
      setAuthError(err.message || 'Authentication failed. Please check credentials.');
    }
  };

  const loginGoogle = async () => {
    setAuthError('');
    setHasConfigError(false);
    try {
      const loggedUser = await FirebaseService.loginWithGoogle();
      setUser(loggedUser);
      closeAuthModal();
      return loggedUser;
    } catch (err) {
      handleAuthError(err);
      throw err;
    }
  };

  const loginEmailOrUsername = async (emailOrUsername, password) => {
    setAuthError('');
    setHasConfigError(false);
    try {
      const loggedUser = await FirebaseService.loginWithEmailOrUsername(emailOrUsername, password);
      setUser(loggedUser);
      closeAuthModal();
      return loggedUser;
    } catch (err) {
      handleAuthError(err);
      throw err;
    }
  };

  const registerEmailOrUsername = async (emailOrUsername, password, displayName) => {
    setAuthError('');
    setHasConfigError(false);
    try {
      const newUser = await FirebaseService.registerWithEmailOrUsername(emailOrUsername, password, displayName);
      setUser(newUser);
      closeAuthModal();
      return newUser;
    } catch (err) {
      handleAuthError(err);
      throw err;
    }
  };

  // Instant local student profile fallback (if Firebase Auth is disabled in console)
  const loginAsLocalUser = (chosenName, username) => {
    const cleanUser = (username || 'student').toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'student';
    const localUser = {
      uid: `local_${cleanUser}`,
      displayName: (chosenName || username || 'Student Explorer').trim(),
      email: username?.includes('@') ? username : `${cleanUser}@vault.internal`,
      isLocal: true,
      createdAt: new Date().toISOString()
    };
    setUser(localUser);
    try {
      localStorage.setItem('nexus_local_user', JSON.stringify(localUser));
    } catch {}
    closeAuthModal();
    return localUser;
  };

  const logout = async () => {
    try {
      localStorage.removeItem('nexus_local_user');
      await FirebaseService.logoutUser();
    } catch (err) {
      console.warn('Logout notice:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
        isLoggedIn: !!user,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authMode,
        setAuthMode,
        authError,
        setAuthError,
        hasConfigError,
        openAuthModal,
        closeAuthModal,
        loginGoogle,
        loginEmailOrUsername,
        registerEmailOrUsername,
        loginAsLocalUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
