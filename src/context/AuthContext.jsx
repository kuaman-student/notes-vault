import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseService } from '../services/firebaseService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = FirebaseService.onAuthChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setAuthError('');
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthError('');
  };

  const loginGoogle = async () => {
    setAuthError('');
    try {
      const loggedUser = await FirebaseService.loginWithGoogle();
      setUser(loggedUser);
      closeAuthModal();
      return loggedUser;
    } catch (err) {
      console.error('Google login error:', err);
      // Give clear friendly message
      if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in popup was closed.');
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by browser. Please allow popups.');
      } else {
        setAuthError(err.message || 'Failed to sign in with Google');
      }
      throw err;
    }
  };

  const loginEmailOrUsername = async (emailOrUsername, password) => {
    setAuthError('');
    try {
      const loggedUser = await FirebaseService.loginWithEmailOrUsername(emailOrUsername, password);
      setUser(loggedUser);
      closeAuthModal();
      return loggedUser;
    } catch (err) {
      console.error('Email/User login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setAuthError('Invalid username/email or password.');
      } else {
        setAuthError(err.message || 'Login failed. Please check credentials.');
      }
      throw err;
    }
  };

  const registerEmailOrUsername = async (emailOrUsername, password, displayName) => {
    setAuthError('');
    try {
      const newUser = await FirebaseService.registerWithEmailOrUsername(emailOrUsername, password, displayName);
      setUser(newUser);
      closeAuthModal();
      return newUser;
    } catch (err) {
      console.error('Register error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('This email/username is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Password must be at least 6 characters.');
      } else {
        setAuthError(err.message || 'Registration failed.');
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await FirebaseService.logoutUser();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
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
        openAuthModal,
        closeAuthModal,
        loginGoogle,
        loginEmailOrUsername,
        registerEmailOrUsername,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
